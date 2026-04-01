/**
 * API Configuration with hardcoded endpoints
 * Tokens are read from environment variables only
 */

// API Endpoints (hardcoded - Google-based)
export const API_ENDPOINTS = {
  GITHUB: {
    baseUrl: "https://api.github.com",
    apiEndpoint: "https://api.github.com",
  },
  GOOGLE: {
    visionApi: "https://vision.googleapis.com/v1",
    generativeAiApi: "https://generativelanguage.googleapis.com/v1beta/models",
  },
};

export const REVIEW_MODEL_OPTIONS = [
  {
    id: "gemini-2.5-flash-lite",
    label: "Gemini 2.5 Flash-Lite",
    helperText: "Recommended for free-tier accounts. Fastest and most cost-friendly option.",
  },
  {
    id: "gemini-2.5-flash",
    label: "Gemini 2.5 Flash",
    helperText: "Balanced quality and speed with free-tier availability.",
  },
  {
    id: "gemini-2.5-pro",
    label: "Gemini 2.5 Pro",
    helperText: "Best for deeper reasoning, but free-tier rate limits are usually tighter.",
  },
];

export const DEFAULT_REVIEW_MODEL = REVIEW_MODEL_OPTIONS[0].id;

export const GITHUB_REVIEW_OPTIONS = [
  {
    id: "full",
    label: "Full repository review",
    helperText: "Covers code quality, security, performance, architecture, and maintainability.",
    promptHint: "Perform a balanced, end-to-end review across code quality, security, performance, architecture, and maintainability.",
  },
  {
    id: "security",
    label: "Security focus",
    helperText: "Prioritizes auth, secrets handling, unsafe patterns, and dependency risk.",
    promptHint: "Prioritize security review findings first, including auth flows, secrets exposure, unsafe input handling, dependency risk, and exploitability.",
  },
  {
    id: "performance",
    label: "Performance focus",
    helperText: "Looks harder at bottlenecks, inefficient patterns, and scaling risks.",
    promptHint: "Prioritize performance and scalability findings first, including hot paths, inefficient queries, render cost, network waste, and scaling risks.",
  },
  {
    id: "architecture",
    label: "Architecture focus",
    helperText: "Looks at module boundaries, design choices, coupling, and extensibility.",
    promptHint: "Prioritize architecture and system design feedback first, including module boundaries, coupling, extensibility, and operational complexity.",
  },
];

export const DEFAULT_GITHUB_REVIEW_OPTION = GITHUB_REVIEW_OPTIONS[0].id;

// Application Configuration (hardcoded)
export const APP_CONFIG = {
  // File size limit: 10MB
  MAX_FILE_SIZE: 10485760,
  
  // Supported document formats
  SUPPORTED_DOC_FORMATS: ["pdf", "docx", "md", "txt"],
  
  // Supported image formats
  SUPPORTED_IMAGE_FORMATS: ["jpg", "jpeg", "png", "gif", "webp", "svg"],
  
  // App name
  APP_NAME: "AI Code Review Tool - Multimodal",
};

// API Keys (read from environment variables)
export const getApiKeys = () => ({
  githubToken: import.meta.env.VITE_GITHUB_API_TOKEN,
  googleApiKey: import.meta.env.VITE_GOOGLE_API_KEY,
});

// Validate required Google API key
export const validateRequiredKeys = () => {
  const keys = getApiKeys();
  if (!keys.googleApiKey) {
    console.error("❌ Missing VITE_GOOGLE_API_KEY in .env.local");
    return false;
  }
  return true;
};

// Utility function to validate file format
export const isValidDocFormat = (filename) => {
  const ext = filename.split(".").pop().toLowerCase();
  return APP_CONFIG.SUPPORTED_DOC_FORMATS.includes(ext);
};

// Utility function to validate image format
export const isValidImageFormat = (filename) => {
  const ext = filename.split(".").pop().toLowerCase();
  return APP_CONFIG.SUPPORTED_IMAGE_FORMATS.includes(ext);
};

// Utility function to validate file size
export const isValidFileSize = (size) => {
  return size <= APP_CONFIG.MAX_FILE_SIZE;
};

// Format bytes for display
export const formatFileSize = (bytes) => {
  return (bytes / 1024 / 1024).toFixed(2);
};

export const isSupportedReviewModel = (modelId) => {
  return REVIEW_MODEL_OPTIONS.some((model) => model.id === modelId);
};

export const isSupportedGithubReviewOption = (optionId) => {
  return GITHUB_REVIEW_OPTIONS.some((option) => option.id === optionId);
};
