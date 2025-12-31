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
  Typography,
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
} from '@ant-design/icons';
import axios from 'axios';
import type {
  OpenAIImageResult,
  ModelOption,
  ImageQuality,
  ImageSize,
  ImageStyle,
  DownloadFormat,
} from '../types';
import { DALL_E_2_SIZES, DALL_E_3_SIZES } from '../types';

const { Title, Text } = Typography;
const { TextArea } = Input;

// ============ Constants ============
const QUALITY_OPTIONS: { value: ImageQuality; label: string }[] = [
  { value: 'standard', label: 'Standard' },
  { value: 'hd', label: 'HD' },
];

// Helper to get quality options based on model (DALL-E 2 doesn't support HD)
const getQualityOptions = (modelName: string | null): { value: ImageQuality; label: string }[] => {
  if (modelName === 'dall-e-2') {
    return [{ value: 'standard', label: 'Standard' }];
  }
  return QUALITY_OPTIONS;
};

// Helper to get size options based on model
const getSizeOptions = (modelName: string | null): { value: ImageSize; label: string }[] => {
  if (modelName === 'dall-e-2') {
    return DALL_E_2_SIZES.map((size) => ({
      value: size,
      label: size === '256x256' ? '256 x 256' :
             size === '512x512' ? '512 x 512' :
             size === '1024x1536' ? '1024 x 1536 (Portrait)' :
             size === '1536x1024' ? '1536 x 1024 (Landscape)' :
             size === 'auto' ? 'Auto' :
             size.replace('x', ' x '),
    }));
  }
  // Default to DALL-E 3 sizes
  return DALL_E_3_SIZES.map((size) => ({
    value: size,
    label: size === '1024x1024' ? '1024 x 1024' :
           size === '1024x1536' ? '1024 x 1536 (Portrait)' :
           size === '1536x1024' ? '1536 x 1024 (Landscape)' :
           size === 'auto' ? 'Auto' :
           size.replace('x', ' x '),
  }));
};

// Helper to check if a size is valid for a model
const isSizeValidForModel = (size: ImageSize, modelName: string | null): boolean => {
  if (modelName === 'dall-e-2') {
    return DALL_E_2_SIZES.includes(size);
  }
  return DALL_E_3_SIZES.includes(size);
};

// Helper to get a default size for a model
const getDefaultSizeForModel = (modelName: string | null): ImageSize => {
  if (modelName === 'dall-e-2') {
    return '1024x1024';
  }
  return '1024x1024';
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

// ============ Main Component ============
export default function Home(): React.ReactElement {
  // ============ State ============
  const [prompt, setPrompt] = useState<string>('');
  const [number, setNumber] = useState<number>(1);
  const [results, setResults] = useState<OpenAIImageResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);

  const [model, setModel] = useState<string | null>(null);
  const [availableModels, setAvailableModels] = useState<ModelOption[]>([]);
  const [configError, setConfigError] = useState<{ error: string; details?: string[] } | null>(null);
  const [configLoading, setConfigLoading] = useState<boolean>(true);

  const [quality, setQuality] = useState<ImageQuality>('standard');
  const [size, setSize] = useState<ImageSize>('1024x1024');
  const [style, setStyle] = useState<ImageStyle>('vivid');
  const [type, setType] = useState<DownloadFormat>('webp');

  // ============ Effects ============
  // Reset size to valid option when model changes
  useEffect(() => {
    if (model && !isSizeValidForModel(size, model)) {
      setSize(getDefaultSizeForModel(model));
    }
  }, [model, size]);

  // Reset quality to standard when switching to DALL-E 2 (no HD support)
  useEffect(() => {
    if (model === 'dall-e-2' && quality === 'hd') {
      setQuality('standard');
    }
  }, [model, quality]);

  useEffect(() => {
    const fetchConfig = async (): Promise<void> => {
      try {
        const res = await axios.get('/api/config');
        setModel(res.data.model);
        setAvailableModels(res.data.availableModels);
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
    if (model === null || prompt.trim() === '') {
      setError(true);
      message.error('Please enter a prompt and select a model');
      return;
    }

    setError(false);
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
      message.error('Failed to generate images. Please try again.');
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
        <title>DALL-E 3 Web UI</title>
        <meta name="description" content="Generate images with DALL-E 3" />
      </Head>

      {/* Configuration Error Modal */}
      <Modal
        open={configError !== null}
        title={<Space><ExclamationCircleOutlined /> Server Configuration Error</Space>}
        onCancel={() => setConfigError(null)}
        footer={[
          <Button key="dismiss" onClick={() => setConfigError(null)}>
            Dismiss
          </Button>,
        ]}
      >
        <Text>{configError?.error}</Text>
        {configError?.details && (
          <ul style={{ marginTop: 16, paddingLeft: 20 }}>
            {configError.details.map((detail, i) => (
              <li key={i}>
                <Text type="danger">{detail}</Text>
              </li>
            ))}
          </ul>
        )}
      </Modal>

      {/* Main Content */}
      <div style={{ padding: '24px 48px', minHeight: '100vh' }}>
        <Row justify="center" align="middle" style={{ marginBottom: 32 }}>
          <Col>
            <Title level={1}>
              Create images with <span style={{ color: '#5f9ea0' }}>GenAI</span>
            </Title>
          </Col>
        </Row>

        {/* Input Form */}
        <Card
          title={<Space><PictureOutlined /> Image Generation</Space>}
          style={{ maxWidth: 1200, margin: '0 auto', marginBottom: 32 }}
        >
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* Prompt Input */}
            <div>
              <Text strong>Prompt:</Text>
              <TextArea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter your image description..."
                rows={3}
                maxLength={4000}
                showCount
                style={{ marginTop: 8 }}
              />
            </div>

            {/* Number of Images */}
            <div>
              <Text strong>Number of images:</Text>
              <InputNumber
                value={number}
                onChange={(val) => setNumber(val ?? 1)}
                min={1}
                max={10}
                style={{ marginLeft: 8, width: 100 }}
              />
            </div>

            {/* Model, Quality, Size, Format Selection */}
            <Row gutter={16}>
              <Col xs={24} sm={12} md={6}>
                <Text strong>Model:</Text>
                <Select
                  value={model}
                  onChange={setModel}
                  loading={configLoading}
                  disabled={configLoading}
                  style={{ width: '100%', marginTop: 4 }}
                  placeholder="Select model"
                  options={availableModels}
                />
              </Col>

              <Col xs={24} sm={12} md={6}>
                <Text strong>Quality:</Text>
                <Select<ImageQuality>
                  value={quality}
                  onChange={setQuality}
                  style={{ width: '100%', marginTop: 4 }}
                  options={getQualityOptions(model)}
                />
              </Col>

              <Col xs={24} sm={12} md={6}>
                <Text strong>Size:</Text>
                <Select<ImageSize>
                  value={size}
                  onChange={setSize}
                  style={{ width: '100%', marginTop: 4 }}
                  options={getSizeOptions(model)}
                />
              </Col>

              <Col xs={24} sm={12} md={6}>
                <Text strong>Format:</Text>
                <Select<DownloadFormat>
                  value={type}
                  onChange={setType}
                  style={{ width: '100%', marginTop: 4 }}
                  options={FORMAT_OPTIONS}
                />
              </Col>
            </Row>

            {/* Style (dall-e-3 only) */}
            {model === 'dall-e-3' && (
              <div>
                <Text strong>Style:</Text>
                <Select<ImageStyle>
                  value={style}
                  onChange={setStyle}
                  style={{ width: 200, marginLeft: 8 }}
                  options={STYLE_OPTIONS}
                />
                <Tooltip
                  title={
                    style === 'vivid'
                      ? 'Vivid style causes the model to lean towards generating hyper-real and dramatic images'
                      : 'Natural style causes the model to produce more natural, less hyper-real looking images'
                  }
                >
                  <InfoCircleOutlined style={{ marginLeft: 8, color: '#5f9ea0', cursor: 'help' }} />
                </Tooltip>
              </div>
            )}

            {/* Generate Button */}
            <Button
              type="primary"
              size="large"
              icon={<PictureOutlined />}
              onClick={handleGenerate}
              loading={loading}
              disabled={configLoading || model === null || prompt.trim() === ''}
              block
            >
              Generate {number} Image{number !== 1 ? 's' : ''}
            </Button>
          </Space>
        </Card>

        {/* Error Display */}
        {error && (
          <Alert
            message="Generation Failed"
            description="Something went wrong. Please try again."
            type="error"
            showIcon
            closable
            style={{ maxWidth: 1200, margin: '0 auto 32px' }}
            onClose={() => setError(false)}
          />
        )}

        {/* Loading Display */}
        {loading && (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
            <div style={{ marginTop: 16 }}>
              <Text>Generating images... This may take a moment.</Text>
            </div>
          </div>
        )}

        {/* Results Grid */}
        {results.length > 0 && (
          <Row gutter={[16, 16]} justify="center" style={{ maxWidth: 1400, margin: '0 auto' }}>
            {results.map((result, index) => (
              <Col xs={24} sm={12} md={8} key={index}>
                <Card
                  hoverable
                  cover={
                    result.url ? (
                      <Image
                        src={result.url}
                        alt={`Generated image ${index + 1}`}
                        preview
                        style={{ height: 300, objectFit: 'cover' }}
                      />
                    ) : null
                  }
                  actions={[
                    <Button
                      key="download"
                      type="primary"
                      icon={<DownloadOutlined />}
                      disabled={!result.url}
                      onClick={() => result.url ? void download(result.url) : undefined}
                    >
                      Download as {type.toUpperCase()}
                    </Button>,
                  ]}
                >
                  <Card.Meta
                    title={`Image ${index + 1}`}
                    description={result.revised_prompt ?? prompt}
                  />
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </div>
    </>
  );
}
