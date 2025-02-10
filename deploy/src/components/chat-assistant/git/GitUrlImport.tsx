'use client';

import { type FC, useState } from 'react';
import { FiGitBranch } from 'react-icons/fi';

interface GitUrlImportProps {
  onImport: (url: string) => Promise<void>;
}

export const GitUrlImport: FC<GitUrlImportProps> = ({ onImport }) => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    try {
      setIsLoading(true);
      setError(null);
      await onImport(url.trim());
      setUrl('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import repository');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="git-url"
            className="block text-sm font-medium text-gray-700"
          >
            Git Repository URL
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiGitBranch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              id="git-url"
              className="block w-full pl-10 pr-12 py-2 sm:text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://github.com/username/repo.git"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isLoading}
            />
          </div>
          {error && (
            <p className="mt-2 text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={!url.trim() || isLoading}
          className={`
            w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white
            ${
              !url.trim() || isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            }
          `}
        >
          {isLoading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Importing...
            </>
          ) : (
            'Import Repository'
          )}
        </button>
      </form>
    </div>
  );
};
