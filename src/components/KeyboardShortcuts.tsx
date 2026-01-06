import { Modal } from 'antd';
import { useEffect, useState } from 'react';

const SHORTCUTS = [
  { key: '⌘/Ctrl + K', action: 'Focus prompt input' },
  { key: '⌘/Ctrl + Enter', action: 'Generate images' },
  { key: 'Esc', action: 'Close modal / cancel' },
  { key: '← →', action: 'Navigate images in preview' },
  { key: '+ / -', action: 'Zoom in / out' },
  { key: 'F', action: 'Cycle fit modes' },
  { key: '?', action: 'Show shortcuts' },
];

/**
 * KeyboardShortcuts - Modal displaying keyboard shortcuts
 *
 * Press '?' to open the modal and see all available keyboard shortcuts.
 */
export const KeyboardShortcuts = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Show modal when '?' is pressed without modifiers
      if (e.key === '?' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setIsVisible(true);
      }
      // Close modal on Escape
      if (e.key === 'Escape' && isVisible) {
        setIsVisible(false);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isVisible]);

  return (
    <Modal
      title="Keyboard Shortcuts"
      open={isVisible}
      onCancel={() => setIsVisible(false)}
      footer={null}
      width={500}
    >
      <div className="grid grid-cols-2 gap-4 py-4">
        {SHORTCUTS.map((shortcut) => (
          <div key={shortcut.key} className="flex items-center gap-3">
            <kbd className="px-3 py-1.5 rounded bg-gray-800 text-gray-300 text-sm font-mono border border-gray-700">
              {shortcut.key}
            </kbd>
            <span className="text-gray-400">{shortcut.action}</span>
          </div>
        ))}
      </div>
      <div className="text-center text-gray-500 text-sm mt-4">
        Press <kbd className="px-2 py-1 rounded bg-gray-800 text-gray-300 text-xs font-mono border border-gray-700 mx-1">?</kbd> to open this modal
      </div>
    </Modal>
  );
};
