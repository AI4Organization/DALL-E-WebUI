'use client';

import Head from 'next/head';
import { useState, useEffect, useCallback } from 'react';
import {
  Input,
  InputNumber,
  Button,
  Select,
  Card,
  Image,
  Alert,
  Spin,
  Space,
  Row,
  Col,
  Modal,
  message,
  Tooltip,
} from 'antd';
import {
  LoadingOutlined,
  DownloadOutlined,
  PictureOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  ThunderboltOutlined,
  StarOutlined,
} from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { ThemeToggle } from '../components/ThemeToggle';
import { ValidationDialog, createValidationIssue, type ValidationIssue } from '../components/ValidationDialog';
import { useTheme } from '../lib/theme';
import type {
  OpenAIImageResult,
  ModelOption,
  ImageQuality,
  ImageSize,
  ImageStyle,
  DownloadFormat,
} from '../types';
import { DALL_E_2_SIZES, DALL_E_3_SIZES } from '../types';

const { TextArea } = Input;

// ============ Constants ============
const QUALITY_OPTIONS: { value: ImageQuality; label: string }[] = [
  { value: 'standard', label: 'Standard' },
  { value: 'hd', label: 'HD' },
];

const getQualityOptions = (modelName: string | null): { value: ImageQuality; label: string }[] => {
  if (modelName === 'dall-e-2') {
    return [{ value: 'standard', label: 'Standard' }];
  }
  return QUALITY_OPTIONS;
};

const getSizeOptions = (modelName: string | null): { value: ImageSize; label: string }[] => {
  if (modelName === 'dall-e-2') {
    return DALL_E_2_SIZES.map((size) => ({
      value: size,
      label: size === '256x256' ? '256 x 256' :
             size === '512x512' ? '512 x 512' :
             size === '1024x1024' ? '1024 x 1024' :
             size.replace('x', ' x '),
    }));
  }
  return DALL_E_3_SIZES.map((size) => ({
    value: size,
    label: size === '1024x1024' ? '1024 x 1024 (Square)' :
           size === '1024x1792' ? '1024 x 1792 (Portrait)' :
           size === '1792x1024' ? '1792 x 1024 (Landscape)' :
           size === 'auto' ? 'Auto' :
           size.replace('x', ' x '),
  }));
};

const isSizeValidForModel = (size: ImageSize, modelName: string | null): boolean => {
  if (modelName === 'dall-e-2') {
    return DALL_E_2_SIZES.includes(size);
  }
  return DALL_E_3_SIZES.includes(size);
};

const getDefaultSizeForModel = (modelName: string | null): ImageSize => {
  if (modelName === 'dall-e-2') {
    return '1024x1024';
  }
  return 'auto';
};

const STYLE_OPTIONS: { value: ImageStyle; label: string }[] = [
  { value: 'vivid', label: 'Vivid' },
  { value: 'natural', label: 'Natural' },
];

const FORMAT_OPTIONS: { value: DownloadFormat; label: string }[] = [
  { value: 'webp', label: 'WebP' },
  { value: 'png', label: 'PNG' },
  { value: 'jpg', label: 'JPG' },
  { value: 'gif', label: 'GIF' },
  { value: 'avif', label: 'AVIF' },
];

// ============ Animation Variants ============
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 100, damping: 15 },
  },
};

const blobVariants = {
  animate: {
    scale: [1, 1.2, 1],
    rotate: [0, 90, 0],
    transition: {
      duration: 8,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// ============ Floating Blob Component ============
const FloatingBlob: React.FC<{ className?: string; color: string; delay?: number }> = ({ className, color, delay = 0 }) => (
  <motion.div
    className={`absolute rounded-full blur-3xl ${className}`}
    style={{
      background: color,
      opacity: 'var(--blob-opacity)'
    }}
    variants={blobVariants}
    animate="animate"
    initial={{ scale: 1, rotate: 0 }}
    transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay }}
  />
);

// ============ Main Component ============
export default function Home(): React.ReactElement {
  const { theme } = useTheme();

  // ============ State ============
  const [prompt, setPrompt] = useState<string>('');
  const [number, setNumber] = useState<number>(4);
  const [results, setResults] = useState<OpenAIImageResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
  const [showValidationDialog, setShowValidationDialog] = useState<boolean>(false);

  const [model, setModel] = useState<string | null>(null);
  const [availableModels, setAvailableModels] = useState<ModelOption[]>([]);
  const [configError, setConfigError] = useState<{ error: string; details?: string[] } | null>(null);
  const [configLoading, setConfigLoading] = useState<boolean>(true);

  const [quality, setQuality] = useState<ImageQuality>('standard');
  const [size, setSize] = useState<ImageSize>('auto');
  const [style, setStyle] = useState<ImageStyle>('vivid');
  const [type, setType] = useState<DownloadFormat>('webp');

  // ============ Effects ============
  useEffect(() => {
    if (model && !isSizeValidForModel(size, model)) {
      setSize(getDefaultSizeForModel(model));
    }
  }, [model, size]);

  useEffect(() => {
    if (model === 'dall-e-2') {
      setQuality('standard');
    } else if (model === 'dall-e-3') {
      setQuality('hd');
    }
  }, [model]);

  useEffect(() => {
    const fetchConfig = async (): Promise<void> => {
      try {
        const res = await axios.get('/api/config');
        setAvailableModels(res.data.availableModels);
        const defaultModel = res.data.availableModels.find((m: ModelOption) => m.value === 'dall-e-3')?.value ?? res.data.availableModels[0]?.value ?? null;
        setModel(defaultModel);
        setConfigLoading(false);
      } catch (err) {
        const axiosError = err as { response?: { data?: { error: string; details?: string[] }; status?: number } };
        if (axiosError.response?.status === 500 && axiosError.response.data) {
          setConfigError(axiosError.response.data);
        } else {
          setConfigError({
            error: 'Failed to connect to server',
            details: ['Please check if the server is running'],
          });
        }
        setConfigLoading(false);
      }
    };

    void fetchConfig();
  }, []);

  // ============ Handlers ============
  const getImages = useCallback(async (): Promise<void> => {
    // Clear previous errors
    setError(false);
    const issues: ValidationIssue[] = [];

    // Client-side validation
    if (!model) {
      issues.push(createValidationIssue(
        'error',
        'No Model Selected',
        'Please select an AI model to generate images.',
        'Choose a model from the "Model" dropdown above.',
        'model'
      ));
    }

    if (!prompt.trim()) {
      issues.push(createValidationIssue(
        'error',
        'Empty Prompt',
        'Please describe the image you want to create.',
        'Enter a detailed description in the "Your Prompt" text area.',
        'prompt'
      ));
    } else if (prompt.trim().length < 10) {
      issues.push(createValidationIssue(
        'warning',
        'Prompt Too Short',
        'Your prompt is quite short. More detailed prompts usually produce better results.',
        'Try describing your vision in more detail - include style, mood, objects, colors, etc.',
        'prompt'
      ));
    }

    if (number < 1) {
      issues.push(createValidationIssue(
        'error',
        'Invalid Number',
        'Number of images must be at least 1.',
        'Set the number between 1 and 10.',
        'number'
      ));
    }

    if (number > 10) {
      issues.push(createValidationIssue(
        'error',
        'Too Many Images',
        'You can generate up to 10 images at once.',
        'Reduce the number of images to 10 or less.',
        'number'
      ));
    }

    // Model-specific validation
    if (model === 'dall-e-3' && number > 1) {
      issues.push(createValidationIssue(
        'info',
        'Multiple Images with DALL-E 3',
        `You requested ${number} images. DALL-E 3 generates them one at a time, so this will take longer.`,
        'Consider reducing to 1-2 images for faster generation, or be patient while we create all your images.',
        'number'
      ));
    }

    if (model === 'dall-e-2' && quality === 'hd') {
      issues.push(createValidationIssue(
        'warning',
        'HD Quality Not Available',
        'DALL-E 2 does not support HD quality. It will use standard quality instead.',
        'Switch to DALL-E 3 for HD quality images, or keep standard quality for faster generation.',
        'quality'
      ));
    }

    if (model === 'dall-e-2' && !DALL_E_2_SIZES.includes(size)) {
      issues.push(createValidationIssue(
        'error',
        'Invalid Size for DALL-E 2',
        `The size "${size}" is not supported by DALL-E 2.`,
        'Choose a supported size: 256x256, 512x512, or 1024x1024.',
        'size'
      ));
    }

    if (model === 'dall-e-3' && !DALL_E_3_SIZES.includes(size)) {
      issues.push(createValidationIssue(
        'error',
        'Invalid Size for DALL-E 3',
        `The size "${size}" is not supported by DALL-E 3.`,
        'Choose a supported size: 1024x1024, 1792x1024, 1024x1792, or auto.',
        'size'
      ));
    }

    // If there are errors, show dialog
    const errors = issues.filter(i => i.type === 'error');
    if (errors.length > 0) {
      setValidationIssues(errors);
      setShowValidationDialog(true);
      return;
    }

    // If there are warnings, show them but proceed
    const warnings = issues.filter(i => i.type === 'warning' || i.type === 'info');
    if (warnings.length > 0) {
      setValidationIssues(warnings);
      setShowValidationDialog(true);
    }

    setLoading(true);

    const queryParams = new URLSearchParams({
      p: encodeURIComponent(prompt),
      n: String(number),
      q: quality,
      s: size,
      m: model,
    });

    if (model === 'dall-e-3') {
      queryParams.append('st', style);
    }

    try {
      const res = await axios.post(`/api/images?${queryParams}`);
      setResults(res.data.result);
    } catch (err) {
      console.error('API error:', err);
      setError(true);

      // Handle API errors with helpful messages
      const axiosError = err as { response?: { data?: { error: string; details?: string[] } } };
      if (axiosError.response?.data) {
        setValidationIssues([
          createValidationIssue(
            'error',
            'Generation Failed',
            axiosError.response.data.error || 'Failed to generate images.',
            axiosError.response.data.details?.join('\n') || 'Please try again with different settings.'
          )
        ]);
        setShowValidationDialog(true);
      } else {
        message.error('Failed to generate images. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [model, prompt, number, quality, size, style]);

  const download = useCallback(async (url: string): Promise<void> => {
    try {
      const res = await axios.post('/api/download', { url, type });
      const link = document.createElement('a');
      link.href = res.data.result;
      link.download = `${prompt}.${type}`;
      link.click();
      message.success('Image downloaded successfully');
    } catch (err) {
      console.error('Download error:', err);
      message.error('Failed to download image');
    }
  }, [prompt, type]);

  const handleGenerate = (): void => {
    void getImages();
  };

  // ============ Render ============
  return (
    <>
      <Head>
        <title>GenAI Studio - Create Images with AI</title>
        <meta name="description" content="Generate stunning images with DALL-E 3" />
      </Head>

      {/* Theme Toggle Button */}
      <ThemeToggle />

      {/* Validation Dialog */}
      <ValidationDialog
        visible={showValidationDialog}
        issues={validationIssues}
        onDismiss={() => setShowValidationDialog(false)}
        onFix={(field) => {
          // Auto-fix logic
          if (field === 'number' && number > 10) setNumber(Math.min(number, 10));
          if (field === 'number' && number < 1) setNumber(1);
          if (field === 'quality' && model === 'dall-e-2') setQuality('standard');
          if (field === 'size' && model === 'dall-e-2') setSize('1024x1024');
          if (field === 'size' && model === 'dall-e-3') setSize('auto');
        }}
      />

      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute inset-0 bg-gradient-mesh opacity-50" />
        <FloatingBlob color="rgba(168, 85, 247, 0.4)" className="w-96 h-96 top-0 left-1/4" delay={0} />
        <FloatingBlob color="rgba(236, 72, 153, 0.3)" className="w-80 h-80 top-1/3 right-1/4" delay={1} />
        <FloatingBlob color="rgba(34, 211, 211, 0.3)" className="w-72 h-72 bottom-1/4 left-1/3" delay={2} />
        <FloatingBlob color="rgba(168, 85, 247, 0.2)" className="w-64 h-64 bottom-0 right-1/3" delay={3} />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--color-background)]/50 to-[var(--color-background)]" />
      </div>

      {/* Configuration Error Modal */}
      <Modal
        open={configError !== null}
        title={
          <Space className="text-white">
            <ExclamationCircleOutlined className="text-red-400" />
            <span>Server Configuration Error</span>
          </Space>
        }
        onCancel={() => setConfigError(null)}
        footer={[
          <Button key="dismiss" onClick={() => setConfigError(null)} className="bg-accent-purple border-accent-purple text-white hover:bg-accent-purple/80">
            Dismiss
          </Button>,
        ]}
        className="glass-card"
      >
        <p className="text-white">{configError?.error}</p>
        {configError?.details && (
          <ul className="mt-4 pl-5 space-y-2">
            {configError.details.map((detail, i) => (
              <li key={i}>
                <span className="text-red-400">{detail}</span>
              </li>
            ))}
          </ul>
        )}
      </Modal>

      {/* Main Content */}
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-7xl mx-auto"
        >
          {/* Hero Section */}
          <motion.div variants={itemVariants} className="text-center mb-12">
            <div className="inline-flex items-center gap-3 mb-6 px-4 py-2 rounded-full bg-glass-light backdrop-blur-md border border-glass-border">
              <StarOutlined className="text-accent-cyan" />
              <span className="text-sm text-gray-300">Powered by DALL-E 3</span>
              <StarOutlined className="text-accent-pink" />
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold mb-4" style={{ fontFamily: "'Outfit', sans-serif" }}>
              <span className="text-white">Create </span>
              <span className="gradient-text">Breathtaking</span>
              <br />
              <span className="text-white">Images with </span>
              <span className="gradient-text">GenAI</span>
            </h1>

            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Transform your ideas into stunning visuals with the power of artificial intelligence.
              Simply describe what you imagine, and watch the magic happen.
            </p>
          </motion.div>

          {/* Main Generator Card */}
          <motion.div variants={itemVariants}>
            <div className="glass-card p-8 mb-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-xl bg-gradient-glow flex items-center justify-center">
                  <ThunderboltOutlined className="text-white text-xl" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
                    Image Generator
                  </h2>
                  <p className="text-gray-400 text-sm">Configure your prompt and settings</p>
                </div>
              </div>

              <Space direction="vertical" size="large" className="w-full">
                {/* Prompt Input with Floating Effect */}
                <motion.div
                  className="relative"
                  whileFocus={{ scale: 1.01 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                    <PictureOutlined className="text-accent-purple" />
                    Your Prompt
                  </label>
                  <TextArea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="A futuristic city at sunset, with flying cars and neon lights reflecting off glass buildings..."
                    rows={4}
                    maxLength={4000}
                    showCount
                    className="glass-input !min-h-[120px] !text-base resize-none"
                  />
                  <div className="absolute bottom-3 right-3 flex items-center gap-2 text-xs text-gray-500">
                    <StarOutlined className="text-accent-cyan" />
                    Be descriptive for best results
                  </div>
                </motion.div>

                {/* Settings Grid */}
                <Row gutter={[16, 16]}>
                  {/* Model Selection */}
                  <Col xs={24} sm={12} md={6}>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Model
                    </label>
                    <Select
                      value={model}
                      onChange={setModel}
                      loading={configLoading}
                      disabled={configLoading}
                      placeholder="Select model"
                      options={availableModels}
                      className="w-full"
                      popupClassName={theme === 'dark' ? 'dark-select-dropdown' : 'light-select-dropdown'}
                                          />
                  </Col>

                  {/* Quality */}
                  {model !== 'dall-e-2' && (
                    <Col xs={24} sm={12} md={6}>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Quality
                      </label>
                      <Select<ImageQuality>
                        value={quality}
                        onChange={setQuality}
                        options={getQualityOptions(model)}
                        className="w-full"
                        popupClassName={theme === 'dark' ? 'dark-select-dropdown' : 'light-select-dropdown'}
                                              />
                    </Col>
                  )}

                  {/* Size */}
                  <Col xs={24} sm={12} md={model !== 'dall-e-2' ? 6 : 8}>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Size
                    </label>
                    <Select<ImageSize>
                      value={size}
                      onChange={setSize}
                      options={getSizeOptions(model)}
                      className="w-full"
                      popupClassName={theme === 'dark' ? 'dark-select-dropdown' : 'light-select-dropdown'}
                                          />
                  </Col>

                  {/* Format */}
                  <Col xs={24} sm={12} md={model !== 'dall-e-2' ? 6 : 8}>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Format
                    </label>
                    <Select<DownloadFormat>
                      value={type}
                      onChange={setType}
                      options={FORMAT_OPTIONS}
                      className="w-full"
                      popupClassName={theme === 'dark' ? 'dark-select-dropdown' : 'light-select-dropdown'}
                                          />
                  </Col>

                  {/* Number of Images */}
                  <Col xs={24} sm={12} md={model !== 'dall-e-2' ? 6 : 8}>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Number of Images
                    </label>
                    <InputNumber
                      value={number}
                      onChange={(val) => setNumber(val ?? 1)}
                      min={1}
                      max={10}
                      className="w-full"
                    />
                  </Col>

                  {/* Style (DALL-E 3 only) */}
                  {model === 'dall-e-3' && (
                    <Col xs={24} sm={12} md={model !== 'dall-e-2' ? 6 : 8}>
                      <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                        Style
                        <Tooltip
                          title={
                            style === 'vivid'
                              ? 'Vivid: Generates hyper-real and dramatic images with intense details'
                              : 'Natural: Produces more natural, less hyper-real looking images'
                          }
                        >
                          <InfoCircleOutlined className="text-accent-cyan cursor-help" />
                        </Tooltip>
                      </label>
                      <Select<ImageStyle>
                        value={style}
                        onChange={setStyle}
                        options={STYLE_OPTIONS}
                        className="w-full"
                        popupClassName={theme === 'dark' ? 'dark-select-dropdown' : 'light-select-dropdown'}
                                              />
                    </Col>
                  )}
                </Row>

                {/* Generate Button */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    type="primary"
                    size="large"
                    icon={loading ? <LoadingOutlined /> : <PictureOutlined />}
                    onClick={handleGenerate}
                    loading={loading}
                    disabled={loading || configLoading}
                    block
                    className="glow-button !h-14 !text-lg !font-semibold"
                    style={{
                      background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #22d3d3 100%)',
                      border: 'none',
                      borderRadius: '12px',
                    }}
                  >
                    {loading ? 'Generating Magic...' : `Generate ${number} Image${number !== 1 ? 's' : ''}`}
                  </Button>
                </motion.div>
              </Space>
            </div>
          </motion.div>

          {/* Error Display */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-8"
              >
                <Alert
                  message="Generation Failed"
                  description="Something went wrong. Please try again."
                  type="error"
                  showIcon
                  closable
                  onClose={() => setError(false)}
                  className="!bg-red-500/10 !border-red-500/30"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading Display */}
          <AnimatePresence>
            {loading && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="glass-card p-12 mb-8 text-center"
              >
                <div className="relative inline-flex items-center justify-center">
                  <motion.div
                    className="w-20 h-20 rounded-full"
                    style={{
                      background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #22d3d3 100%)',
                    }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  />
                  <motion.div
                    className="absolute w-16 h-16 rounded-full"
                    style={{ backgroundColor: 'var(--color-background)' }}
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <LoadingOutlined className="absolute text-3xl text-white" />
                </div>
                <motion.p
                  className="mt-6 text-lg text-gray-300"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  Creating your masterpiece...
                </motion.p>
                <p className="text-sm text-gray-500 mt-2">This may take a moment</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results Grid */}
          <AnimatePresence>
            {results.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mb-8"
              >
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  <StarOutlined className="text-accent-cyan" />
                  Generated Images
                  <span className="text-sm font-normal text-gray-500">({results.length} result{results.length !== 1 ? 's' : ''})</span>
                </h3>

                <Row gutter={[16, 16]}>
                  {results.map((result, index) => (
                    <Col xs={24} sm={12} lg={8} key={index}>
                      <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1, type: 'spring', stiffness: 100 }}
                        whileHover={{ y: -8 }}
                      >
                        <Card
                          hoverable
                          className="glass-card overflow-hidden !border-0"
                          cover={
                            result.url ? (
                              <div className="relative overflow-hidden"
                                  style={{ backgroundColor: 'var(--color-card-bg)' }}>
                                <Image
                                  src={result.url}
                                  alt={`Generated image ${index + 1}`}
                                  preview
                                  className="!w-full"
                                  style={{ height: 280, objectFit: 'cover' }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-background)] via-transparent to-transparent opacity-60" />
                              </div>
                            ) : null
                          }
                          actions={[
                            <Button
                              key="download"
                              type="primary"
                              icon={<DownloadOutlined />}
                              disabled={!result.url}
                              onClick={() => result.url ? void download(result.url) : undefined}
                              className="!bg-accent-purple !border-accent-purple hover:!bg-accent-purple/80"
                            >
                              Download
                            </Button>,
                          ]}
                        >
                          <div className="text-white">
                            <h4 className="font-semibold text-lg mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
                              Image #{index + 1}
                            </h4>
                            <p className="text-gray-400 text-sm line-clamp-3">
                              {result.revised_prompt ?? prompt}
                            </p>
                          </div>
                        </Card>
                      </motion.div>
                    </Col>
                  ))}
                </Row>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty State - Show before first generation */}
          {results.length === 0 && !loading && !error && (
            <motion.div
              variants={itemVariants}
              className="glass-card p-12 text-center"
            >
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-glow flex items-center justify-center opacity-50">
                <PictureOutlined className="text-5xl text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
                Ready to Create
              </h3>
              <p className="text-gray-400 max-w-md mx-auto">
                Enter a prompt above and configure your settings to generate stunning AI-powered images.
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center py-8 text-gray-600 text-sm"
        >
          <p>GenAI Studio • Powered by OpenAI DALL-E 3</p>
        </motion.footer>
      </div>

      <style jsx global>{`
        .dark-dropdown .ant-select-dropdown {
          background: rgba(15, 15, 25, 0.95) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          backdrop-filter: blur(20px);
        }
        .dark-dropdown .ant-select-item {
          color: rgba(255, 255, 255, 0.85) !important;
        }
        .dark-dropdown .ant-select-item-option-selected {
          background: rgba(168, 85, 247, 0.2) !important;
        }
        .dark-dropdown .ant-select-item-option-active {
          background: rgba(168, 85, 247, 0.1) !important;
        }
        .dark-dropdown .ant-select-item-option:hover:not(.ant-select-item-option-disabled) {
          background: rgba(168, 85, 247, 0.15) !important;
        }

        .ant-image-preview-mask {
          background: rgba(10, 10, 18, 0.95) !important;
        }
        .ant-image-preview-wrap {
          backdrop-filter: blur(10px);
        }

        .ant-message {
          z-index: 9999 !important;
        }
        .ant-message-notice-content {
          background: rgba(15, 15, 25, 0.95) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          backdrop-filter: blur(20px);
          border-radius: 12px !important;
        }

        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </>
  );
}
