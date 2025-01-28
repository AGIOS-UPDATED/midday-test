'use client';

import { atom, map, type MapStore, type ReadableAtom, type WritableAtom } from 'nanostores';
import type { EditorDocument, ScrollPosition } from '@/components/chat-assistant/codemirror/CodeMirrorEditor';
import { ActionRunner } from '@/lib/runtime/action-runner';
import type { ActionCallbackData, ArtifactCallbackData } from '@/lib/runtime/message-parser';
import { webcontainer } from '@/lib/webcontainer';
import type { ITerminal } from '@/types/terminal';
import { unreachable } from '@/utils/chat-assistant/unreachable';
import { EditorStore } from './editor';
import { FilesStore, type FileMap } from './files';
import { PreviewsStore } from './previews';
import { TerminalStore } from './terminal';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Octokit, type RestEndpointMethodTypes } from '@octokit/rest';
import pathBrowserify from 'path-browserify';
import { extractRelativePath } from '@/utils/chat-assistant/diff';
import { description } from '@/lib/persistence';
import Cookies from 'js-cookie';
import { createSampler } from '@/utils/chat-assistant/sampler';
import type { ActionAlert } from '@/types/actions';

export interface ArtifactState {
  id: string;
  title: string;
  type?: string;
  closed: boolean;
  runner: ActionRunner;
}

export type ArtifactUpdateState = Pick<ArtifactState, 'title' | 'closed'>;

type Artifacts = MapStore<Record<string, ArtifactState>>;

export type WorkbenchViewType = 'code' | 'preview';

export class WorkbenchStore {
  // Internal sub-stores
  #previewsStore = new PreviewsStore(webcontainer);
  #filesStore = new FilesStore(webcontainer);
  #editorStore = new EditorStore(this.#filesStore);
  #terminalStore = new TerminalStore(webcontainer);

  // Tracks reloaded messages to avoid repeated alerts
  #reloadedMessages = new Set<string>();

  // Nanostores
  artifacts: Artifacts = map({});
  showWorkbench: WritableAtom<boolean> = atom(false);
  currentView: WritableAtom<WorkbenchViewType> = atom('code');
  unsavedFiles: WritableAtom<Set<string>> = atom(new Set<string>());
  actionAlert: WritableAtom<ActionAlert | undefined> = atom<ActionAlert | undefined>(undefined);

  // Other internal state
  modifiedFiles = new Set<string>();
  artifactIdList: string[] = [];
  #globalExecutionQueue = Promise.resolve();

  constructor() {
    // No `import.meta.hot` references in Next.js
  }

  /**
   * Queue any async operation so they run sequentially instead of in parallel.
   */
  addToExecutionQueue(callback: () => Promise<void>) {
    this.#globalExecutionQueue = this.#globalExecutionQueue.then(() => callback());
  }

  // --- Preview/Files/Editor Accessors ---

  get previews() {
    return this.#previewsStore.previews;
  }

  get files() {
    return this.#filesStore.files;
  }

  get currentDocument(): ReadableAtom<EditorDocument | undefined> {
    return this.#editorStore.currentDocument;
  }

  get selectedFile(): ReadableAtom<string | undefined> {
    return this.#editorStore.selectedFile;
  }

  get firstArtifact(): ArtifactState | undefined {
    return this.#getArtifact(this.artifactIdList[0]);
  }

  get filesCount(): number {
    return this.#filesStore.filesCount;
  }

  // --- Terminal-Related ---

  get showTerminal() {
    return this.#terminalStore.showTerminal;
  }

  get boltTerminal() {
    return this.#terminalStore.boltTerminal;
  }

  toggleTerminal(value?: boolean) {
    this.#terminalStore.toggleTerminal(value);
  }

  attachTerminal(terminal: ITerminal) {
    this.#terminalStore.attachTerminal(terminal);
  }

  attachBoltTerminal(terminal: ITerminal) {
    this.#terminalStore.attachBoltTerminal(terminal);
  }

  onTerminalResize(cols: number, rows: number) {
    this.#terminalStore.onTerminalResize(cols, rows);
  }

  // --- Alerts ---

  get alert() {
    return this.actionAlert;
  }

  clearAlert() {
    this.actionAlert.set(undefined);
  }

  // --- Workbench Controls ---

  setShowWorkbench(show: boolean) {
    this.showWorkbench.set(show);
  }

  // --- Files/Editor Integration ---

  setDocuments(files: FileMap) {
    this.#editorStore.setDocuments(files);
    if (this.#filesStore.filesCount > 0 && this.currentDocument.get() === undefined) {
      // automatically select the first file in the map
      for (const [filePath, dirent] of Object.entries(files)) {
        if (dirent?.type === 'file') {
          this.setSelectedFile(filePath);
          break;
        }
      }
    }
  }

  setCurrentDocumentContent(newContent: string) {
    const filePath = this.currentDocument.get()?.filePath;
    if (!filePath) return;

    const originalContent = this.#filesStore.getFile(filePath)?.content;
    const unsavedChanges = originalContent !== undefined && originalContent !== newContent;

    this.#editorStore.updateFile(filePath, newContent);

    const currentDocument = this.currentDocument.get();
    if (currentDocument) {
      const previousUnsavedFiles = this.unsavedFiles.get();
      // If we already have unsaved changes for this file, no need to re-check
      if (unsavedChanges && previousUnsavedFiles.has(currentDocument.filePath)) {
        return;
      }

      const newUnsavedFiles = new Set(previousUnsavedFiles);

      if (unsavedChanges) {
        newUnsavedFiles.add(currentDocument.filePath);
      } else {
        newUnsavedFiles.delete(currentDocument.filePath);
      }

      this.unsavedFiles.set(newUnsavedFiles);
    }
  }

  setCurrentDocumentScrollPosition(position: ScrollPosition) {
    const editorDocument = this.currentDocument.get();
    if (!editorDocument) return;
    this.#editorStore.updateScrollPosition(editorDocument.filePath, position);
  }

  setSelectedFile(filePath: string | undefined) {
    this.#editorStore.setSelectedFile(filePath);
  }

  async saveFile(filePath: string) {
    const documents = this.#editorStore.documents.get();
    const document = documents[filePath];
    if (!document) return;

    await this.#filesStore.saveFile(filePath, document.value);

    const newUnsavedFiles = new Set(this.unsavedFiles.get());
    newUnsavedFiles.delete(filePath);
    this.unsavedFiles.set(newUnsavedFiles);
  }

  async saveCurrentDocument() {
    const currentDocument = this.currentDocument.get();
    if (!currentDocument) return;
    await this.saveFile(currentDocument.filePath);
  }

  resetCurrentDocument() {
    const currentDocument = this.currentDocument.get();
    if (!currentDocument) return;

    const file = this.#filesStore.getFile(currentDocument.filePath);
    if (!file) return;
    this.setCurrentDocumentContent(file.content);
  }

  async saveAllFiles() {
    for (const filePath of this.unsavedFiles.get()) {
      await this.saveFile(filePath);
    }
  }

  getFileModifcations() {
    return this.#filesStore.getFileModifications();
  }

  resetAllFileModifications() {
    this.#filesStore.resetFileModifications();
  }

  abortAllActions() {
    // For future: handle any logic if you need to forcibly cancel all in-flight tasks
  }

  // --- Reloaded Messages ---

  setReloadedMessages(messages: string[]) {
    this.#reloadedMessages = new Set(messages);
  }

  // --- Artifacts & Actions ---

  addArtifact({ messageId, title, id, type }: ArtifactCallbackData) {
    const artifact = this.#getArtifact(messageId);
    if (artifact) return; // Already exist

    if (!this.artifactIdList.includes(messageId)) {
      this.artifactIdList.push(messageId);
    }

    this.artifacts.setKey(messageId, {
      id,
      title,
      closed: false,
      type,
      runner: new ActionRunner(
        webcontainer,
        () => this.boltTerminal,
        (alert) => {
          if (this.#reloadedMessages.has(messageId)) return;
          this.actionAlert.set(alert);
        },
      ),
    });
  }

  updateArtifact({ messageId }: ArtifactCallbackData, state: Partial<ArtifactUpdateState>) {
    const artifact = this.#getArtifact(messageId);
    if (!artifact) return;
    this.artifacts.setKey(messageId, { ...artifact, ...state });
  }

  addAction(data: ActionCallbackData) {
    // Defer execution in queue
    this.addToExecutionQueue(() => this._addAction(data));
  }
  async _addAction(data: ActionCallbackData) {
    const { messageId } = data;
    const artifact = this.#getArtifact(messageId);
    if (!artifact) {
      unreachable('Artifact not found');
    }
    return artifact.runner.addAction(data);
  }

  runAction(data: ActionCallbackData, isStreaming = false) {
    if (isStreaming) {
      this.actionStreamSampler(data, isStreaming);
    } else {
      this.addToExecutionQueue(() => this._runAction(data, isStreaming));
    }
  }

  async _runAction(data: ActionCallbackData, isStreaming: boolean) {
    const { messageId } = data;
    const artifact = this.#getArtifact(messageId);
    if (!artifact) {
      unreachable('Artifact not found');
    }

    const action = artifact.runner.actions.get()[data.actionId];
    if (!action || action.executed) {
      return;
    }

    // If it's a file-action, possibly load or select the file in the editor
    if (data.action.type === 'file') {
      const wc = await webcontainer;
      // Use path-browserify instead of node:path
      const fullPath = pathBrowserify.join(wc.workdir, data.action.filePath);

      if (this.selectedFile.get() !== fullPath) {
        this.setSelectedFile(fullPath);
      }

      if (this.currentView.get() !== 'code') {
        this.currentView.set('code');
      }

      const doc = this.#editorStore.documents.get()[fullPath];

      if (!doc) {
        // If the doc is not yet loaded, run the action to create or open it
        await artifact.runner.runAction(data, isStreaming);
      }

      // Update the file content in memory
      this.#editorStore.updateFile(fullPath, data.action.content);

      if (!isStreaming) {
        await artifact.runner.runAction(data);
        this.resetAllFileModifications();
      }
    } else {
      await artifact.runner.runAction(data);
    }
  }

  /**
   * Action sampler to reduce spamming with frequent streaming updates
   */
  actionStreamSampler = createSampler(async (data: ActionCallbackData, isStreaming = false) => {
    return this._runAction(data, isStreaming);
  }, 100);

  // Find the artifact from local store
  #getArtifact(id: string) {
    const artifacts = this.artifacts.get();
    return artifacts[id];
  }

  // --- Download & Sync Files ---

  async downloadZip() {
    const zip = new JSZip();
    const files = this.files.get();

    const projectName = (description.value ?? 'project')
      .toLocaleLowerCase()
      .split(' ')
      .join('_');

    // 6-char hash from timestamp
    const timestampHash = Date.now().toString(36).slice(-6);
    const uniqueProjectName = `${projectName}_${timestampHash}`;

    for (const [filePath, dirent] of Object.entries(files)) {
      if (dirent?.type === 'file' && !dirent.isBinary) {
        const relativePath = extractRelativePath(filePath);
        const segments = relativePath.split('/');

        if (segments.length > 1) {
          let currentFolder = zip;
          for (let i = 0; i < segments.length - 1; i++) {
            currentFolder = currentFolder.folder(segments[i])!;
          }
          currentFolder.file(segments[segments.length - 1], dirent.content);
        } else {
          zip.file(relativePath, dirent.content);
        }
      }
    }

    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `${uniqueProjectName}.zip`);
  }

  async syncFiles(targetHandle: FileSystemDirectoryHandle) {
    const files = this.files.get();
    const syncedFiles = [];

    for (const [filePath, dirent] of Object.entries(files)) {
      if (dirent?.type === 'file' && !dirent.isBinary) {
        const relativePath = extractRelativePath(filePath);
        const pathSegments = relativePath.split('/');
        let currentHandle = targetHandle;

        for (let i = 0; i < pathSegments.length - 1; i++) {
          currentHandle = await currentHandle.getDirectoryHandle(pathSegments[i], { create: true });
        }

        const fileHandle = await currentHandle.getFileHandle(pathSegments[pathSegments.length - 1], {
          create: true,
        });

        const writable = await fileHandle.createWritable();
        await writable.write(dirent.content);
        await writable.close();

        syncedFiles.push(relativePath);
      }
    }

    return syncedFiles;
  }

  /**
   * Push files to GitHub repo (runs in the client with Octokit).
   * For safer usage, you might wrap this in a Server Action or an API route.
   */
  async pushToGitHub(repoName: string, githubUsername?: string, ghToken?: string) {
    try {
      const githubToken = ghToken || Cookies.get('githubToken');
      const owner = githubUsername || Cookies.get('githubUsername');

      if (!githubToken || !owner) {
        throw new Error('GitHub token or username is not set in cookies or provided.');
      }

      const octokit = new Octokit({ auth: githubToken });

      // Check if repo exists; if not, create it
      let repo: RestEndpointMethodTypes['repos']['get']['response']['data'];
      try {
        const resp = await octokit.repos.get({ owner, repo: repoName });
        repo = resp.data;
      } catch (error: any) {
        if (error.status === 404) {
          const { data: newRepo } = await octokit.repos.createForAuthenticatedUser({
            name: repoName,
            private: false,
            auto_init: true,
          });
          repo = newRepo;
        } else {
          throw error;
        }
      }

      const files = this.files.get();
      if (!files || Object.keys(files).length === 0) {
        throw new Error('No files found to push.');
      }

      // Create a blob for each file
      const blobs = await Promise.all(
        Object.entries(files).map(async ([filePath, dirent]) => {
          if (dirent?.type === 'file' && dirent.content) {
            const { data: blob } = await octokit.git.createBlob({
              owner: repo.owner.login,
              repo: repo.name,
              content: Buffer.from(dirent.content).toString('base64'),
              encoding: 'base64',
            });
            return { path: extractRelativePath(filePath), sha: blob.sha };
          }
          return null;
        }),
      );

      const validBlobs = blobs.filter(Boolean);
      if (validBlobs.length === 0) {
        throw new Error('No valid files to push.');
      }

      // Get the latest commit SHA on the default branch
      const { data: ref } = await octokit.git.getRef({
        owner: repo.owner.login,
        repo: repo.name,
        ref: `heads/${repo.default_branch || 'main'}`,
      });
      const latestCommitSha = ref.object.sha;

      // Create a new tree
      const { data: newTree } = await octokit.git.createTree({
        owner: repo.owner.login,
        repo: repo.name,
        base_tree: latestCommitSha,
        tree: validBlobs.map((blob) => ({
          path: blob!.path,
          mode: '100644',
          type: 'blob',
          sha: blob!.sha,
        })),
      });

      // Create a new commit
      const { data: newCommit } = await octokit.git.createCommit({
        owner: repo.owner.login,
        repo: repo.name,
        message: 'Initial commit from your app',
        tree: newTree.sha,
        parents: [latestCommitSha],
      });

      // Update the reference (push)
      await octokit.git.updateRef({
        owner: repo.owner.login,
        repo: repo.name,
        ref: `heads/${repo.default_branch || 'main'}`,
        sha: newCommit.sha,
      });

      alert(`Repository created/pushed: ${repo.html_url}`);
    } catch (error) {
      console.error('Error pushing to GitHub:', error);
      throw error;
    }
  }
}

export const workbenchStore = new WorkbenchStore();
