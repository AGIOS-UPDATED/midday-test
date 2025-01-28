import { useStore } from '@nanostores/react';
import { motion, type HTMLMotionProps, type Variants } from 'framer-motion';
import { computed } from 'nanostores';
import { memo, useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import {
  type OnChangeCallback as OnEditorChange,
  type OnScrollCallback as OnEditorScroll,
} from '@/components/chat-assistant/editor/codemirror/CodeMirrorEditor';
import { IconButton } from '@/components/chat-assistant/ui/IconButton';
import { PanelHeaderButton } from '@/components/chat-assistant/ui/PanelHeaderButton';
import { Slider, type SliderOptions } from '@/components/chat-assistant/ui/Slider';
import { workbenchStore, type WorkbenchViewType } from '@/lib/stores/workbench';
import { classNames } from '@/utils/chat-assistant/classNames';
import { cubicEasingFn } from '@/utils/chat-assistant/easings';
import { renderLogger } from '@/utils/chat-assistant/logger';
import { EditorPanel } from './EditorPanel';
import { Preview } from './Preview';
import useViewport from '@/lib/hooks';
import Cookies from 'js-cookie';

interface WorkspaceProps {
  chatStarted?: boolean;
  isStreaming?: boolean;
}

const [options, setOptions] = useState({
  title: {
    text: "Sales by Month",
  },
  data: getData(),
  series: [
    {
      type: "area",
      xKey: "month",
      yKey: "subscriptions",
      yName: "Subscriptions",
    },
    {
      type: "area",
      xKey: "month",
      yKey: "services",
      yName: "Services",
    },
    {
      type: "area",
      xKey: "month",
      yKey: "products",
      yName: "Products",
    },
  ],
});

const viewTransition = { ease: cubicEasingFn };

const sliderOptions: SliderOptions<WorkbenchViewType> = {
  left: {
    value: 'code',
    text: 'Code',
  },
  right: {
    value: 'preview',
    text: 'Preview',
  },
};

function getData() {
  return [
    { month: "Jan", subscriptions: 222, services: 250, products: 200 },
    { month: "Feb", subscriptions: 240, services: 255, products: 210 },
    { month: "Mar", subscriptions: 280, services: 245, products: 195 },
    { month: "Apr", subscriptions: 300, services: 260, products: 205 },
    { month: "May", subscriptions: 350, services: 235, products: 215 },
    { month: "Jun", subscriptions: 420, services: 270, products: 200 },
    { month: "Jul", subscriptions: 300, services: 255, products: 225 },
    { month: "Aug", subscriptions: 270, services: 305, products: 210 },
    { month: "Sep", subscriptions: 260, services: 280, products: 250 },
    { month: "Oct", subscriptions: 385, services: 250, products: 205 },
    { month: "Nov", subscriptions: 320, services: 265, products: 215 },
    { month: "Dec", subscriptions: 330, services: 255, products: 220 },
  ];
}

const workbenchVariants = {
  closed: {
    width: 0,
    transition: {
      duration: 0.2,
      ease: cubicEasingFn,
    },
  },
  open: {
    width: 'var(--workbench-width)',
    transition: {
      duration: 0.2,
      ease: cubicEasingFn,
    },
  },
} satisfies Variants;

export const Workbench = memo(({ chatStarted, isStreaming }: WorkspaceProps) => {
  renderLogger.trace('Workbench');

  const [isSyncing, setIsSyncing] = useState(false);

  const hasPreview = useStore(computed(workbenchStore.previews, (previews) => previews.length > 0));
  const showWorkbench = useStore(workbenchStore.showWorkbench);
  const selectedFile = useStore(workbenchStore.selectedFile);
  const currentDocument = useStore(workbenchStore.currentDocument);
  const unsavedFiles = useStore(workbenchStore.unsavedFiles);
  const files = useStore(workbenchStore.files);
  const selectedView = useStore(workbenchStore.currentView);

  const isSmallViewport = useViewport(1024);

  const setSelectedView = (view: WorkbenchViewType) => {
    workbenchStore.currentView.set(view);
  };

  useEffect(() => {
    if (hasPreview) {
      setSelectedView('preview');
    }
  }, [hasPreview]);

  useEffect(() => {
    workbenchStore.setDocuments(files);
  }, [files]);

  const onEditorChange = useCallback<OnEditorChange>((update) => {
    workbenchStore.setCurrentDocumentContent(update.content);
  }, []);

  const onEditorScroll = useCallback<OnEditorScroll>((position) => {
    workbenchStore.setCurrentDocumentScrollPosition(position);
  }, []);

  const onFileSelect = useCallback((filePath: string | undefined) => {
    workbenchStore.setSelectedFile(filePath);
  }, []);

  const onFileSave = useCallback(() => {
    workbenchStore.saveCurrentDocument().catch(() => {
      toast.error('Failed to update file content');
    });
  }, []);

  const onFileReset = useCallback(() => {
    workbenchStore.resetCurrentDocument();
  }, []);

  const handleSyncFiles = useCallback(async () => {
    setIsSyncing(true);

    try {
      const directoryHandle = await window.showDirectoryPicker();
      await workbenchStore.syncFiles(directoryHandle);
      toast.success('Files synced successfully');
    } catch (error) {
      console.error('Error syncing files:', error);
      toast.error('Failed to sync files');
    } finally {
      setIsSyncing(false);
    }
  }, []);

  return (
    chatStarted && (
      <motion.div
        initial="closed"
        animate={showWorkbench ? 'open' : 'closed'}
        variants={workbenchVariants}
        className="z-workbench"
      >
        <div
          className={classNames(
            'fixed top-[calc(var(--header-height)+1.5rem)] bottom-6 w-[var(--workbench-inner-width)] mr-4 z-0 transition-[left,width] duration-200 bolt-ease-cubic-bezier',
            {
              'w-full': isSmallViewport,
              'left-0': showWorkbench && isSmallViewport,
              'left-[var(--workbench-left)]': showWorkbench,
              'left-[100%]': !showWorkbench,
            },
          )}> 
          <AgCharts options={options} />
        </div>
      </motion.div>
    )
  );
});
interface ViewProps extends HTMLMotionProps<'div'> {
  children: JSX.Element;
}

const View = memo(({ children, ...props }: ViewProps) => {
  return (
    <motion.div className="absolute inset-0" transition={viewTransition} {...props}>
      {children}
    </motion.div>
  );
});
