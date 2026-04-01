import { useState, useRef } from "react";
import {
  APP_CONFIG,
  DEFAULT_GITHUB_REVIEW_OPTION,
  DEFAULT_REVIEW_MODEL,
  GITHUB_REVIEW_OPTIONS,
  REVIEW_MODEL_OPTIONS,
  isValidDocFormat,
  isValidImageFormat,
  isValidFileSize,
  formatFileSize,
} from "../config/apiConfig";
import "../styles/MultimodalInput.css";

export default function MultimodalInput({ onSubmit, loading }) {
  const [inputType, setInputType] = useState("url");
  const [repoUrl, setRepoUrl] = useState("");
  const [context, setContext] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [selectedModel, setSelectedModel] = useState(DEFAULT_REVIEW_MODEL);
  const [githubReviewOption, setGithubReviewOption] = useState(DEFAULT_GITHUB_REVIEW_OPTION);
  const [useGithubContext, setUseGithubContext] = useState(true);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const selectedModelMeta =
    REVIEW_MODEL_OPTIONS.find((model) => model.id === selectedModel) || REVIEW_MODEL_OPTIONS[0];
  const selectedGithubOptionMeta =
    GITHUB_REVIEW_OPTIONS.find((option) => option.id === githubReviewOption) || GITHUB_REVIEW_OPTIONS[0];

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter((file) => {
      if (!isValidDocFormat(file.name)) {
        const ext = file.name.split(".").pop().toLowerCase();
        alert(`${ext} format not supported. Supported: ${APP_CONFIG.SUPPORTED_DOC_FORMATS.join(", ")}`);
        return false;
      }
      if (!isValidFileSize(file.size)) {
        alert(`File ${file.name} is too large. Max: ${formatFileSize(APP_CONFIG.MAX_FILE_SIZE)}MB`);
        return false;
      }
      return true;
    });
    setUploadedFiles([...uploadedFiles, ...validFiles]);
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files || []);
    const validImages = files.filter((file) => {
      if (!isValidImageFormat(file.name)) {
        const ext = file.name.split(".").pop().toLowerCase();
        alert(`${ext} format not supported. Supported: ${APP_CONFIG.SUPPORTED_IMAGE_FORMATS.join(", ")}`);
        return false;
      }
      if (!isValidFileSize(file.size)) {
        alert(`File ${file.name} is too large. Max: ${formatFileSize(APP_CONFIG.MAX_FILE_SIZE)}MB`);
        return false;
      }
      return true;
    });
    setUploadedImages([...uploadedImages, ...validImages]);
  };

  const removeFile = (index, type = "file") => {
    if (type === "file") {
      setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
    } else {
      setUploadedImages(uploadedImages.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (inputType === "url" && !repoUrl.trim()) {
      alert("Please enter a repository URL");
      return;
    }

    if (inputType === "multimodal" && uploadedFiles.length === 0 && uploadedImages.length === 0) {
      alert("Please upload at least one file or image");
      return;
    }

    onSubmit({
      type: inputType,
      repoUrl: inputType === "url" ? repoUrl : null,
      context,
      files: uploadedFiles,
      images: uploadedImages,
      model: selectedModel,
      githubReviewOption,
      useGithubContext,
    });
  };

  return (
    <form className="multimodal-input-form" onSubmit={handleSubmit}>
      <div className="input-type-selector">
        <label>
          <input
            type="radio"
            value="url"
            checked={inputType === "url"}
            onChange={(e) => setInputType(e.target.value)}
            disabled={loading}
          />
          <span>Repository URL</span>
        </label>
        <label>
          <input
            type="radio"
            value="multimodal"
            checked={inputType === "multimodal"}
            onChange={(e) => setInputType(e.target.value)}
            disabled={loading}
          />
          <span>Multimodal (Files & Images)</span>
        </label>
      </div>

      <div className="model-selector-section">
        <label htmlFor="review-model" className="model-selector-label">
          Review model
        </label>
        <select
          id="review-model"
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          disabled={loading}
          className="model-selector"
        >
          {REVIEW_MODEL_OPTIONS.map((model) => (
            <option key={model.id} value={model.id}>
              {model.label}
            </option>
          ))}
        </select>
        <p className="model-selector-help">{selectedModelMeta.helperText}</p>
      </div>

      {inputType === "url" ? (
        <div className="url-input-section">
          <div className="model-selector-section">
            <label htmlFor="github-review-option" className="model-selector-label">
              GitHub review focus
            </label>
            <select
              id="github-review-option"
              value={githubReviewOption}
              onChange={(e) => setGithubReviewOption(e.target.value)}
              disabled={loading}
              className="model-selector"
            >
              {GITHUB_REVIEW_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="model-selector-help">{selectedGithubOptionMeta.helperText}</p>
          </div>

          <label className="toggle-option">
            <input
              type="checkbox"
              checked={useGithubContext}
              onChange={(e) => setUseGithubContext(e.target.checked)}
              disabled={loading}
            />
            <span>Use GitHub API context when reviewing this repository</span>
          </label>
          <p className="toggle-option-help">
            Uses your configured GitHub token on the server when available to enrich the review with repo metadata, README content, and folder structure.
          </p>

          <input
            type="url"
            placeholder="https://github.com/username/repository"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            disabled={loading}
            className="repo-url-input"
          />
        </div>
      ) : (
        <div className="multimodal-input-section">
          <div className="upload-area">
            <div className="upload-box">
              <button
                type="button"
                className="upload-button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
              >
                📄 Upload Documents
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={APP_CONFIG.SUPPORTED_DOC_FORMATS.map((f) => `.${f}`).join(",")}
                onChange={handleFileSelect}
                hidden
                disabled={loading}
              />
              <p className="upload-hint">Supported: {APP_CONFIG.SUPPORTED_DOC_FORMATS.join(", ")}</p>
            </div>

            <div className="upload-box">
              <button
                type="button"
                className="upload-button"
                onClick={() => imageInputRef.current?.click()}
                disabled={loading}
              >
                🖼️ Upload Images
              </button>
              <input
                ref={imageInputRef}
                type="file"
                multiple
                accept={APP_CONFIG.SUPPORTED_IMAGE_FORMATS.map((f) => `.${f}`).join(",")}
                onChange={handleImageSelect}
                hidden
                disabled={loading}
              />
              <p className="upload-hint">Supported: {APP_CONFIG.SUPPORTED_IMAGE_FORMATS.join(", ")}</p>
            </div>
          </div>

          {uploadedFiles.length > 0 && (
            <div className="uploaded-files-list">
              <h4>Documents:</h4>
              {uploadedFiles.map((file, idx) => (
                <div key={`file-${idx}`} className="file-item">
                  <span>📄 {file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(idx, "file")}
                    className="remove-button"
                    disabled={loading}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {uploadedImages.length > 0 && (
            <div className="uploaded-images-list">
              <h4>Images:</h4>
              <div className="images-grid">
                {uploadedImages.map((image, idx) => (
                  <div key={`image-${idx}`} className="image-item">
                    <img src={URL.createObjectURL(image)} alt={image.name} />
                    <button
                      type="button"
                      onClick={() => removeFile(idx, "image")}
                      className="remove-button"
                      disabled={loading}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <textarea
        placeholder="Add additional context for the review (optional)..."
        value={context}
        onChange={(e) => setContext(e.target.value)}
        disabled={loading}
        className="context-textarea"
        rows="3"
      />

      <button type="submit" disabled={loading} className="submit-button">
        {loading ? "Processing..." : "Analyze & Review"}
      </button>
    </form>
  );
}
