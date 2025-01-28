import { WebContainer } from '@webcontainer/api';
import { WORK_DIR_NAME } from '@/utils/chat-assistant/constants';
import { cleanStackTrace } from '@/utils/chat-assistant/stacktrace';

let webcontainer: Promise<WebContainer> | null = null;
const webcontainerContext = {
  loaded: false,
};

// This function initializes the WebContainer only on the client side
const initializeWebContainer = async (): Promise<WebContainer> => {
  if (webcontainer) return webcontainer; // Return the existing instance if already initialized

  const webcontainerInstance = await WebContainer.boot({
    workdirName: WORK_DIR_NAME,
    forwardPreviewErrors: true, // Enable error forwarding from iframes
  });

  webcontainerContext.loaded = true;

  const { workbenchStore } = await import('@/lib/stores/workbench');

  // Listen for preview errors
  webcontainerInstance.on('preview-message', (message) => {
    console.log('WebContainer preview message:', message);

    // Handle both uncaught exceptions and unhandled promise rejections
    if (message.type === 'PREVIEW_UNCAUGHT_EXCEPTION' || message.type === 'PREVIEW_UNHANDLED_REJECTION') {
      const isPromise = message.type === 'PREVIEW_UNHANDLED_REJECTION';
      workbenchStore.actionAlert.set({
        type: 'preview',
        title: isPromise ? 'Unhandled Promise Rejection' : 'Uncaught Exception',
        description: message.message,
        content: `Error occurred at ${message.pathname}${message.search}${message.hash}\nPort: ${message.port}\n\nStack trace:\n${cleanStackTrace(message.stack || '')}`,
        source: 'preview',
      });
    }
  });

  webcontainer = Promise.resolve(webcontainerInstance);
  return webcontainerInstance;
};

// Export a function to get the WebContainer instance
export const getWebContainer = async (): Promise<WebContainer | null> => {
  if (typeof window === 'undefined') {
    // WebContainer should not be initialized on the server
    return null;
  }

  return initializeWebContainer();
};
