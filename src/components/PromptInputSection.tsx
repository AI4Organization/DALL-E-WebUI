import { PictureOutlined, StarOutlined } from '@ant-design/icons';
import { Input } from 'antd';
import { motion } from 'framer-motion';
import { memo } from 'react';

import { useAutoResizeTextArea } from '../hooks/useAutoResizeTextArea';

const { TextArea: AntTextArea } = Input;

export interface PromptInputSectionProps {
  /** Current prompt value */
  prompt: string;
  /** Callback when prompt changes */
  onPromptChange: (value: string) => void;
  /** Maximum character limit */
  maxLength: number;
  /** Currently selected model name */
  model: string | null;
}

/**
 * PromptInputSection - Textarea for entering image generation prompts
 *
 * Features:
 * - Auto-resizing textarea (expands with content up to max height)
 * - Character counter showing current/max
 * - Visual feedback on focus (subtle scale animation)
 *
 * Memoized to prevent unnecessary re-renders when only model changes.
 */
export const PromptInputSection = memo<PromptInputSectionProps>(({
  prompt,
  onPromptChange,
  maxLength,
  model: _model,
}) => {
  const { ref, height } = useAutoResizeTextArea(prompt);

  return (
    <motion.div
      className="relative"
      whileFocus={{ scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
        <PictureOutlined className="text-accent-purple" />
        Your Prompt
      </label>
      <AntTextArea
        ref={ref}
        value={prompt}
        onChange={(e) => onPromptChange(e.target.value)}
        placeholder="A futuristic city at sunset, with flying cars and neon lights reflecting off glass buildings..."
        autoSize={false}
        maxLength={maxLength}
        style={{ height, overflowY: 'auto' }}
        className="glass-input text-base! resize-none"
      />
      {/* Custom character count display */}
      <div className="absolute bottom-3 right-3 flex items-center gap-2 text-xs text-gray-500">
        <span>{prompt.length} / {maxLength} characters</span>
        <StarOutlined className="text-accent-cyan ml-2" />
      </div>
    </motion.div>
  );
}, (prevProps, nextProps) => {
  // Only re-render if prompt, maxLength, or onPromptChange changes
  return (
    prevProps.prompt === nextProps.prompt &&
    prevProps.maxLength === nextProps.maxLength &&
    prevProps.onPromptChange === nextProps.onPromptChange
  );
});

PromptInputSection.displayName = 'PromptInputSection';
