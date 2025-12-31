import Head from "next/head";
import { useState, useEffect } from "react";

import styles from "../styles/Home.module.css";

import axios from "axios";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [number, setNumber] = useState(1);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  // New state for model configuration
  const [model, setModel] = useState(null);
  const [availableModels, setAvailableModels] = useState([]);
  const [configError, setConfigError] = useState(null);
  const [configLoading, setConfigLoading] = useState(true);

  // Fetch server configuration on mount
  useEffect(() => {
    axios.get('/api/config')
      .then((res) => {
        setModel(res.data.model);
        setAvailableModels(res.data.availableModels);
        setConfigLoading(false);
      })
      .catch((err) => {
        if (err.response?.status === 500) {
          setConfigError(err.response.data);
        } else {
          setConfigError({
            error: 'Failed to connect to server',
            details: ['Please check if the server is running']
          });
        }
        setConfigLoading(false);
      });
  }, []);

  function getImages() {
    if (model == null || prompt === "") {
      setError(true);
      return;
    }

    setError(false);
    setLoading(true);

    // Build query parameters
    let queryParams = `p=${encodeURIComponent(prompt)}&n=${number}&q=${quality}&s=${size}&m=${encodeURIComponent(model)}`;
    // Only include style for dall-e-3
    if (model === 'dall-e-3') {
      queryParams += `&st=${style}`;
    }

    axios
      .post(`/api/images?${queryParams}`)
      .then((res) => {
        setResults(res.data.result);
        setLoading(false);
      })
      .catch((err) => {
        console.error('API error:', err);
        setLoading(false);
        setError(true);
      });
  }

  const [type, setType] = useState("webp");
  const [quality, setQuality] = useState("standard");
  const [size, setSize] = useState("1024x1024");
  const [style, setStyle] = useState("vivid");

  function download(url) {
    axios
      .post(`/api/download`, { url: url, type: type })
      .then((res) => {
        const link = document.createElement("a");
        link.href = res.data.result;
        link.download = `${prompt}.${type.toLowerCase()}`;
        link.click();
      })
      .catch((err) => {
        console.log(err);
      });
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>DALL-E 3 Web UI</title>
      </Head>

      {/* Configuration Error Dialog */}
      {configError && (
        <div className={styles.dialogOverlay}>
          <div className={styles.dialog}>
            <h2>Server Configuration Error</h2>
            <p>{configError.error}</p>
            <ul>
              {configError.details?.map((detail, i) => (
                <li key={i}>{detail}</li>
              ))}
            </ul>
            <button onClick={() => setConfigError(null)}>Dismiss</button>
          </div>
        </div>
      )}

      <main className={styles.main}>
        <h1 className={styles.title}>
          Create images with <span className={styles.titleColor}>GenAI</span>
        </h1>
        <p className={styles.description}>
          <input
            id="prompt"
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Prompt"
          />
          <input
            id="number"
            type="number"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="Number of images"
            max="10"
          />
          {"  "}
          <button onClick={getImages} disabled={configLoading || model == null}>
            Get {number} Images
          </button>
        </p>
        <small>
          Model:{" "}
          <select
            style={{ marginRight: '20px' }}
            id="model"
            value={model || ''}
            onChange={(e) => setModel(e.target.value)}
            disabled={configLoading}>
            {configLoading ? (
              <option>Loading...</option>
            ) : (
              availableModels.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))
            )}
          </select>

          Quality:{" "}
          <select
            style={{ marginRight: '20px' }}
            id="quality"
            value={quality}
            onChange={(e) => setQuality(e.target.value)}>
            <option value="standard">Standard</option>
            <option value="hd">HD</option>
          </select>

          Size:{" "}
          <select
            style={{ marginRight: '20px' }}
            id="size"
            value={size}
            onChange={(e) => setSize(e.target.value)}>
            <option value="1024x1024">1024x1024</option>
            <option value="1792x1024">1792x1024</option>
            <option value="1024x1792">1024x1792</option>
          </select>

          {/* Only show style for dall-e-3 */}
          {model === 'dall-e-3' && (
            <>
              Style:{" "}
              <select
                style={{ marginRight: '20px' }}
                id="style"
                value={style}
                onChange={(e) => setStyle(e.target.value)}>
                <option value="vivid">Vivid</option>
                <option value="natural">Natural</option>
              </select>
            </>
          )}

          Download as:{" "}
          <select
            style={{ marginRight: '20px' }}
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value)}>
            <option value="webp">Webp</option>
            <option value="png">Png</option>
            <option value="jpg">Jpg</option>
            <option value="gif">Gif</option>
            <option value="avif">Avif</option>
          </select>
        </small>
        <br />
        {error ? (<div className={styles.error}>Something went wrong. Try again.</div>) : (<></>)}
        {loading && <p>Loading...</p>}
        <div className={styles.grid}>
          {results.map((result, index) => {
            return (
              <div className={styles.card} key={index}>
                <img
                  className={styles.imgPreview}
                  src={result.url}
                  onClick={() => download(result.url)}
                  alt={`Generated image ${index + 1}`}
                />
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
