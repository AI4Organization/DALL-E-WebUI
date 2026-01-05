import { InfoCircleOutlined } from '@ant-design/icons';
import {
  InputNumber,
  Select,
  Row,
  Col,
  Tooltip,
  Divider,
} from 'antd';
import { memo } from 'react';
import React from 'react';

import type {
  ModelOption,
  ImageQuality,
  ImageSize,
  ImageStyle,
  ImageOutputFormat,
  GPTImageQuality,
  GPTImageBackground,
} from '../../types';
import { DALL_E_2_SIZES, DALL_E_3_SIZES, GPT_IMAGE_1_5_SIZES } from '../../types';
import { useTheme } from '../lib/theme';

// ============ Constants ============

const DALL_E_3_QUALITY_OPTIONS: { value: ImageQuality; label: string }[] = [
  { value: 'standard', label: 'Standard' },
  { value: 'hd', label: 'HD' },
];

const DALL_E_2_QUALITY_OPTIONS: { value: ImageQuality; label: string }[] = [
  { value: 'standard', label: 'Standard' },
];

const GPT_IMAGE_1_5_QUALITY_OPTIONS: { value: GPTImageQuality; label: string }[] = [
  { value: 'auto', label: 'Auto' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const STYLE_OPTIONS: { value: ImageStyle; label: string }[] = [
  { value: 'vivid', label: 'Vivid' },
  { value: 'natural', label: 'Natural' },
];

const OUTPUT_FORMAT_OPTIONS: { value: ImageOutputFormat; label: string }[] = [
  { value: 'webp', label: 'WebP' },
  { value: 'png', label: 'PNG' },
  { value: 'jpeg', label: 'JPEG' },
];

const GPT_IMAGE_1_5_BACKGROUND_OPTIONS: { value: GPTImageBackground; label: string }[] = [
  { value: 'auto', label: 'Auto' },
  { value: 'transparent', label: 'Transparent' },
  { value: 'opaque', label: 'Opaque' },
];

// Style info tooltips
const STYLE_INFO: Record<ImageStyle, string> = {
  vivid: 'Vivid: Generates hyper-real and dramatic images with intense details',
  natural: 'Natural: Produces more natural, less hyper-real looking images',
};

// ============ Helper Components ============

interface SelectLabelProps {
  label: string;
  tooltip?: string;
}

function SelectLabel({ label, tooltip }: SelectLabelProps) {
  return (
    <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
      <span>{label}</span>
      {tooltip && (
        <Tooltip title={tooltip}>
          <InfoCircleOutlined className="text-accent-cyan cursor-help" />
        </Tooltip>
      )}
    </label>
  );
}

interface DisabledControlProps {
  disabled: boolean;
  disabledReason?: string;
  children: React.ReactElement;
}

function DisabledControl({ disabled, disabledReason, children }: DisabledControlProps) {
  const newProps = { ...(children.props ?? {}), disabled };
  if (disabled && disabledReason) {
    return (
      <Tooltip title={disabledReason}>
        {React.cloneElement(children, newProps)}
      </Tooltip>
    );
  }
  return React.cloneElement(children, newProps);
}

interface SelectControlItemProps {
  label: string;
  tooltip?: string;
  disabled?: boolean;
  disabledReason?: string;
  children: React.ReactElement;
}

function SelectControlItem({ label, tooltip, disabled, disabledReason, children }: SelectControlItemProps) {
  return (
    <Col xs={24} sm={12} md={6}>
      <SelectLabel label={label} tooltip={tooltip} />
      <DisabledControl disabled={disabled ?? false} disabledReason={disabledReason}>
        {children}
      </DisabledControl>
    </Col>
  );
}

// ============ Helper Functions ============

const getQualityOptions = (modelName: string | null): { value: ImageQuality | GPTImageQuality; label: string }[] => {
  if (modelName === 'gpt-image-1.5') {
    return GPT_IMAGE_1_5_QUALITY_OPTIONS;
  }
  if (modelName === 'dall-e-2') {
    return DALL_E_2_QUALITY_OPTIONS;
  }
  return DALL_E_3_QUALITY_OPTIONS;
};

const getSizeOptions = (modelName: string | null): { value: ImageSize; label: string }[] => {
  if (modelName === 'gpt-image-1.5') {
    return GPT_IMAGE_1_5_SIZES.map((size) => ({
      value: size,
      label: size === 'auto' ? 'Auto' :
             size === '1024x1024' ? '1024 x 1024 (Square)' :
             size === '1536x1024' ? '1536 x 1024 (Landscape)' :
             size === '1024x1536' ? '1024 x 1536 (Portrait)' :
             size.replace('x', ' x '),
    }));
  }
  if (modelName === 'dall-e-2') {
    return DALL_E_2_SIZES.map((size) => ({
      value: size,
      label: size === '256x256' ? '256 x 256' :
             size === '512x512' ? '512 x 512' :
             size === '1024x1024' ? '1024 x 1024 (Square)' :
             size.replace('x', ' x '),
    }));
  }
  return DALL_E_3_SIZES.map((size) => ({
    value: size,
    label: size === '1024x1024' ? '1024 x 1024 (Square)' :
           size === '1024x1792' ? '1024 x 1792 (Portrait)' :
           size === '1792x1024' ? '1792 x 1024 (Landscape)' :
           size.replace('x', ' x '),
  }));
};

const getMaxImages = (modelName: string | null): number => {
  if (modelName === 'gpt-image-1.5') return 10;
  if (modelName === 'dall-e-3') return 10;
  if (modelName === 'dall-e-2') return 10;
  return 10;
};

const shouldShowQuality = (model: string | null): boolean => {
  return model === 'dall-e-2' || model === 'dall-e-3' || model === 'gpt-image-1.5';
};

const shouldShowStyle = (model: string | null): boolean => {
  return model === 'dall-e-3';
};

const shouldShowBackground = (model: string | null): boolean => {
  return model === 'gpt-image-1.5';
};

// ============ Main Component ============

export interface SettingsGridProps {
  /** Currently selected model */
  model: string | null;
  /** Callback when model changes */
  onModelChange: (value: string) => void;
  /** Available models from API */
  availableModels: ModelOption[];
  /** Whether config is loading */
  configLoading: boolean;
  /** Currently selected quality */
  quality: ImageQuality | GPTImageQuality;
  /** Callback when quality changes */
  onQualityChange: (value: ImageQuality | GPTImageQuality) => void;
  /** Currently selected size */
  size: ImageSize;
  /** Callback when size changes */
  onSizeChange: (value: ImageSize) => void;
  /** Number of images to generate */
  number: number;
  /** Callback when number changes */
  onNumberChange: (value: number) => void;
  /** Currently selected style (DALL-E 3 only) */
  style: ImageStyle;
  /** Callback when style changes */
  onStyleChange: (value: ImageStyle) => void;
  /** Currently selected output format */
  outputFormat: ImageOutputFormat;
  /** Callback when output format changes */
  onOutputFormatChange: (value: ImageOutputFormat) => void;
  /** Currently selected background (GPT Image 1.5 only) */
  background: GPTImageBackground;
  /** Callback when background changes */
  onBackgroundChange: (value: GPTImageBackground) => void;
  /** Whether generation is in progress */
  isGenerationInProgress: boolean;
}

/**
 * SettingsGrid - Configuration controls for image generation
 *
 * Displays model-specific settings with conditional rendering based on selected model.
 * Uses consistent 4-column grid layout for tidy appearance.
 * Memoized to prevent unnecessary re-renders.
 */
export const SettingsGrid = memo<SettingsGridProps>(({
  model,
  onModelChange,
  availableModels,
  configLoading,
  quality,
  onQualityChange,
  size,
  onSizeChange,
  number,
  onNumberChange,
  style,
  onStyleChange,
  outputFormat,
  onOutputFormatChange,
  background,
  onBackgroundChange,
  isGenerationInProgress,
}) => {
  const { theme } = useTheme();
  const selectPopupClassName = theme === 'dark' ? 'dark-select-dropdown' : 'light-select-dropdown';
  const disabledTooltip = 'Please wait for current generation to complete';

  // Common select props
  const selectProps = {
    className: 'w-full',
    popupClassName: selectPopupClassName,
  };

  return (
    <div className="space-y-4">
      {/* Primary Settings Row */}
      <Row gutter={[16, 16]}>
        {/* Model Selection */}
        <Col xs={24} sm={12} md={6}>
          <SelectLabel label="Model" />
          {configLoading ? (
            <Select
              disabled
              placeholder="Loading models..."
              {...selectProps}
            />
          ) : model ? (
            <DisabledControl
              disabled={isGenerationInProgress}
              disabledReason={disabledTooltip}
            >
              <Select
                value={model}
                onChange={onModelChange}
                options={availableModels}
                placeholder="Select a model"
                {...selectProps}
              />
            </DisabledControl>
          ) : (
            <Select
              disabled
              placeholder="Select a model"
              {...selectProps}
            />
          )}
        </Col>

        {/* Quality (conditional) */}
        {shouldShowQuality(model) && (
          <SelectControlItem
            label="Quality"
            disabled={isGenerationInProgress}
            disabledReason={disabledTooltip}
          >
            <Select
              value={quality}
              onChange={onQualityChange}
              options={getQualityOptions(model)}
              {...selectProps}
            />
          </SelectControlItem>
        )}

        {/* Size */}
        <SelectControlItem
          label="Size"
          disabled={isGenerationInProgress}
          disabledReason={disabledTooltip}
        >
          <Select<ImageSize>
            value={size}
            onChange={onSizeChange}
            options={getSizeOptions(model)}
            {...selectProps}
          />
        </SelectControlItem>

        {/* Number of Images */}
        <SelectControlItem
          label="Number of Images"
          disabled={isGenerationInProgress}
          disabledReason={disabledTooltip}
        >
          <InputNumber
            value={number}
            onChange={(val) => onNumberChange(val ?? 1)}
            min={1}
            max={getMaxImages(model)}
            className="w-full"
          />
        </SelectControlItem>
      </Row>

      {/* Model-Specific Options Row */}
      {(shouldShowStyle(model) || shouldShowBackground(model)) && (
        <>
          <Divider className="my-4 border-gray-700" />
          <Row gutter={[16, 16]}>
            {/* Style (DALL-E 3 only) */}
            {shouldShowStyle(model) && (
              <SelectControlItem
                label="Style"
                tooltip={STYLE_INFO[style]}
                disabled={isGenerationInProgress}
                disabledReason={disabledTooltip}
              >
                <Select<ImageStyle>
                  value={style}
                  onChange={onStyleChange}
                  options={STYLE_OPTIONS}
                  {...selectProps}
                />
              </SelectControlItem>
            )}

            {/* Background (GPT Image 1.5 only) */}
            {shouldShowBackground(model) && (
              <SelectControlItem
                label="Background"
                tooltip="Control the transparency of the generated image background"
                disabled={isGenerationInProgress}
                disabledReason={disabledTooltip}
              >
                <Select<GPTImageBackground>
                  value={background}
                  onChange={onBackgroundChange}
                  options={GPT_IMAGE_1_5_BACKGROUND_OPTIONS}
                  {...selectProps}
                />
              </SelectControlItem>
            )}

            {/* Output Format */}
            <SelectControlItem
              label="Output Format"
              tooltip="Format of the generated image"
              disabled={isGenerationInProgress}
              disabledReason={disabledTooltip}
            >
              <Select<ImageOutputFormat>
                value={outputFormat}
                onChange={onOutputFormatChange}
                options={OUTPUT_FORMAT_OPTIONS}
                {...selectProps}
              />
            </SelectControlItem>
          </Row>
        </>
      )}

      {/* Output Format (when no model-specific options) */}
      {!shouldShowStyle(model) && !shouldShowBackground(model) && (
        <Row gutter={[16, 16]}>
          <SelectControlItem
            label="Output Format"
            tooltip="Format of the generated image"
            disabled={isGenerationInProgress}
            disabledReason={disabledTooltip}
          >
            <Select<ImageOutputFormat>
              value={outputFormat}
              onChange={onOutputFormatChange}
              options={OUTPUT_FORMAT_OPTIONS}
              {...selectProps}
            />
          </SelectControlItem>
        </Row>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for memoization
  return (
    prevProps.model === nextProps.model &&
    prevProps.quality === nextProps.quality &&
    prevProps.size === nextProps.size &&
    prevProps.number === nextProps.number &&
    prevProps.style === nextProps.style &&
    prevProps.outputFormat === nextProps.outputFormat &&
    prevProps.background === nextProps.background &&
    prevProps.isGenerationInProgress === nextProps.isGenerationInProgress &&
    prevProps.configLoading === nextProps.configLoading
  );
});

SettingsGrid.displayName = 'SettingsGrid';
