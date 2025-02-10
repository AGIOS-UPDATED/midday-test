"use client";

import { atom, computed, map, type MapStore, type WritableAtom } from 'nanostores';
import type { EditorDocument, ScrollPosition } from '@/components/editor/codemirror/CodeMirrorEditor';
import type { FileMap, FilesStore } from './files';

export type EditorDocuments = Record<string, EditorDocument>;

type SelectedFile = WritableAtom<string | undefined>;

export class EditorStore {
  #filesStore: FilesStore;

  // A writable atom that tracks which file is currently selected
  selectedFile: SelectedFile = atom<string | undefined>();

  // A Nanostore map holding EditorDocuments indexed by file path
  documents: MapStore<EditorDocuments> = map({});


  currentDocument = computed(
    [this.documents, this.selectedFile],
    (documents, selectedFile) => {
    
      if (!selectedFile) return undefined;
      
      return documents[selectedFile];
    }
  );

  constructor(filesStore: FilesStore) {
    this.#filesStore = filesStore;
  }

  setDocuments(files: FileMap) {
    const previousDocuments = this.documents.value;
    const nextEntries = Object.entries(files)
      .map(([filePath, dirent]) => {
        if (dirent === undefined || dirent.type === 'folder') {
          return undefined;
        }

        const previousDocument = previousDocuments?.[filePath];
       
        return [
          filePath,
          {
            value: dirent.content,
            filePath,
            scroll: previousDocument?.scroll,
          } as EditorDocument,
        ] as [string, EditorDocument];
      })
      .filter(Boolean) as [string, EditorDocument][];

    this.documents.set(Object.fromEntries(nextEntries));
  }

  setSelectedFile(filePath: string | undefined) {
    this.selectedFile.set(filePath);
  }

  updateScrollPosition(filePath: string, position: ScrollPosition) {
    const documents = this.documents.get();
    const documentState = documents[filePath];

    if (!documentState) return;

    this.documents.setKey(filePath, {
      ...documentState,
      scroll: position,
    });
  }

  updateFile(filePath: string, newContent: string) {
    const documents = this.documents.get();
    const documentState = documents[filePath];

    if (!documentState) return;

    // Only update if the content has actually changed
    if (documentState.value !== newContent) {
      this.documents.setKey(filePath, {
        ...documentState,
        value: newContent,
      });
    }
  }
}
