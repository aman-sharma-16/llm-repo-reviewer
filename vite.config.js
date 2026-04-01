import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import {
  DEFAULT_REVIEW_MODEL,
  isSupportedReviewModel,
} from "./src/config/apiConfig.js";

const GOOGLE_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const GITHUB_API_BASE_URL = "https://api.github.com";

function formatBytes(bytes) {
  if (typeof bytes !== "number" || Number.isNaN(bytes)) {
    return undefined;
  }

  if (bytes < 1024) {
    return `${bytes}B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)}KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function createGithubHeaders(token, raw = false) {
  const headers = {
    Accept: raw ? "application/vnd.github.raw+json" : "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "repo-reviewer",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

function parseGithubRepoUrl(repoUrl) {
  if (!repoUrl) {
    return null;
  }

  try {
    const parsedUrl = new URL(repoUrl);
    if (parsedUrl.hostname !== "github.com") {
      return null;
    }

    const [owner, repo] = parsedUrl.pathname
      .replace(/^\/+|\/+$/g, "")
      .split("/")
      .slice(0, 2);

    if (!owner || !repo) {
      return null;
    }

    return {
      owner,
      repo: repo.replace(/\.git$/, ""),
    };
  } catch {
    return null;
  }
}

async function fetchGithubJson(path, token) {
  const response = await fetch(`${GITHUB_API_BASE_URL}${path}`, {
    headers: createGithubHeaders(token),
  });

  if (!response.ok) {
    throw new Error(`GitHub API request failed (${response.status}).`);
  }

  return response.json();
}

async function fetchGithubText(path, token) {
  const response = await fetch(`${GITHUB_API_BASE_URL}${path}`, {
    headers: createGithubHeaders(token, true),
  });

  if (!response.ok) {
    throw new Error(`GitHub API request failed (${response.status}).`);
  }

  return response.text();
}

function buildNestedTreeFromGithub(flatTree, repoName, maxEntries = 250) {
  const root = { name: repoName, type: "folder", children: [] };
  const sortedTree = flatTree
    .filter((item) => item.path && (item.type === "tree" || item.type === "blob"))
    .sort((a, b) => a.path.localeCompare(b.path))
    .slice(0, maxEntries);

  const nodeMap = new Map([["", root]]);

  sortedTree.forEach((item) => {
    const parts = item.path.split("/");
    let currentPath = "";

    parts.forEach((part, index) => {
      const parentPath = currentPath;
      currentPath = currentPath ? `${currentPath}/${part}` : part;

      if (nodeMap.has(currentPath)) {
        return;
      }

      const isLeaf = index === parts.length - 1;
      const parentNode = nodeMap.get(parentPath) || root;
      const node = isLeaf && item.type === "blob"
        ? {
            name: part,
            type: "file",
            ...(item.size ? { size: formatBytes(item.size) } : {}),
          }
        : {
            name: part,
            type: "folder",
            children: [],
          };

      parentNode.children.push(node);
      nodeMap.set(currentPath, node);
    });
  });

  return root;
}

async function fetchGithubContext(repoUrl, token) {
  const parsedRepo = parseGithubRepoUrl(repoUrl);
  if (!parsedRepo) {
    return null;
  }

  const { owner, repo } = parsedRepo;
  const repoData = await fetchGithubJson(`/repos/${owner}/${repo}`, token);
  const languagesPromise = fetchGithubJson(`/repos/${owner}/${repo}/languages`, token).catch(() => null);
  const readmePromise = fetchGithubText(`/repos/${owner}/${repo}/readme`, token).catch(() => null);
  const treePromise = fetchGithubJson(
    `/repos/${owner}/${repo}/git/trees/${encodeURIComponent(repoData.default_branch)}?recursive=1`,
    token
  ).catch(() => null);

  const [languages, readme, treeData] = await Promise.all([languagesPromise, readmePromise, treePromise]);
  const nestedTree = treeData?.tree ? buildNestedTreeFromGithub(treeData.tree, repoData.name) : null;
  const readmeExcerpt = readme ? readme.slice(0, 6000) : null;

  return {
    repo: {
      fullName: repoData.full_name,
      description: repoData.description,
      defaultBranch: repoData.default_branch,
      visibility: repoData.private ? "private" : "public",
      stars: repoData.stargazers_count,
      forks: repoData.forks_count,
      openIssues: repoData.open_issues_count,
      primaryLanguage: repoData.language,
      topics: repoData.topics || [],
      license: repoData.license?.spdx_id || repoData.license?.name || null,
    },
    languages,
    readmeExcerpt,
    nestedTree,
    treeTruncated: Boolean(treeData?.truncated || (treeData?.tree?.length || 0) > 250),
  };
}

function formatGithubContextForPrompt(context) {
  if (!context) {
    return "";
  }

  const repoDetails = [
    `Full Name: ${context.repo.fullName}`,
    `Description: ${context.repo.description || "N/A"}`,
    `Default Branch: ${context.repo.defaultBranch}`,
    `Visibility: ${context.repo.visibility}`,
    `Stars: ${context.repo.stars}`,
    `Forks: ${context.repo.forks}`,
    `Open Issues: ${context.repo.openIssues}`,
    `Primary Language: ${context.repo.primaryLanguage || "N/A"}`,
    `License: ${context.repo.license || "N/A"}`,
    `Topics: ${context.repo.topics.length > 0 ? context.repo.topics.join(", ") : "N/A"}`,
  ].join("\n");

  const languages = context.languages
    ? `Languages:\n${JSON.stringify(context.languages, null, 2)}`
    : "Languages:\nUnavailable";
  const nestedTree = context.nestedTree
    ? `Nested JSON folder structure${context.treeTruncated ? " (truncated)" : ""}:\n${JSON.stringify(context.nestedTree, null, 2)}`
    : "Nested JSON folder structure:\nUnavailable";
  const readme = context.readmeExcerpt
    ? `README excerpt:\n${context.readmeExcerpt}`
    : "README excerpt:\nUnavailable";

  return `GitHub API Context:
${repoDetails}

${languages}

${nestedTree}

${readme}`;
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", chunk => {
      body += chunk;

      if (body.length > 1_000_000) {
        reject(new Error("Request body too large."));
        req.destroy();
      }
    });

    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

function createGoogleApiProxy(env) {
  const apiKey = env.VITE_GOOGLE_API_KEY;
  const githubToken = env.VITE_GITHUB_API_TOKEN;

  return async (req, res, next) => {
    // Check if this is the review API endpoint
    const url = req.url.split('?')[0]; // Remove query params
    if (url !== "/api/review") {
      return next();
    }

    if (req.method !== "POST") {
      sendJson(res, 405, { error: { message: "Method not allowed." } });
      return;
    }

    if (!apiKey) {
      console.error("❌ VITE_GOOGLE_API_KEY is not configured");
      sendJson(res, 500, {
        error: {
          message: "VITE_GOOGLE_API_KEY is not configured. Add it to your .env.local file and restart Vite.",
        },
      });
      return;
    }

    let body;

    try {
      body = await readRequestBody(req);
    } catch (error) {
      sendJson(res, 400, {
        error: {
          message: error instanceof Error ? error.message : "Unable to read request body.",
        },
      });
      return;
    }

    try {
      const parsedBody = JSON.parse(body);
      const requestedModel = parsedBody.model;
      const reviewModel = isSupportedReviewModel(requestedModel)
        ? requestedModel
        : DEFAULT_REVIEW_MODEL;
      let userContent = parsedBody.messages[0]?.content || "Please help me review this code.";

      if (parsedBody.useGithubContext && parsedBody.repoUrl) {
        try {
          const githubContext = await fetchGithubContext(parsedBody.repoUrl, githubToken);
          if (githubContext) {
            userContent += `\n\nUse this GitHub API context in addition to your own analysis.\n${formatGithubContextForPrompt(githubContext)}`;
          }
        } catch (githubError) {
          console.warn("⚠️ Unable to enrich review with GitHub API context:", githubError);
        }
      }
      
      // Convert the request format to Google's format
      const googleRequest = {
        ...(parsedBody.system
          ? {
              systemInstruction: {
                parts: [{ text: parsedBody.system }],
              },
            }
          : {}),
        contents: [
          {
            parts: [
              {
                text: userContent
              }
            ]
          }
        ],
        generationConfig: {
          maxOutputTokens: parsedBody.max_tokens || 4000,
          temperature: 0.7,
        },
      };

      console.log(`📤 Sending request to Google API with model: ${reviewModel}`);
      const upstreamResponse = await fetch(`${GOOGLE_API_BASE_URL}/${reviewModel}:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(googleRequest),
      });

      const responseText = await upstreamResponse.text();

      if (!upstreamResponse.ok) {
        console.error("❌ Google API Error:", upstreamResponse.status, responseText);
        res.statusCode = upstreamResponse.status;
        res.setHeader("Content-Type", "application/json");
        res.end(responseText);
        return;
      }

      // Parse Google's response and convert to expected format
      const googleResponse = JSON.parse(responseText);
      const content = googleResponse.candidates?.[0]?.content?.parts?.[0]?.text || "";

      if (!content) {
        console.error("❌ No content in Google response:", googleResponse);
        sendJson(res, 502, {
          error: {
            message: "Google API returned empty content",
          },
        });
        return;
      }

      console.log("✅ Successfully got response from Google API");

      // Send response in the expected format
      const convertedResponse = {
        content: [
          {
            type: "text",
            text: content
          }
        ]
      };

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(convertedResponse));
    } catch (error) {
      console.error("❌ Error in API proxy:", error);
      const statusCode = error instanceof SyntaxError ? 400 : 502;
      const message =
        error instanceof SyntaxError
          ? "Invalid JSON payload sent to /api/review."
          : error instanceof Error
            ? error.message
            : "Unable to reach Google API.";

      sendJson(res, statusCode, {
        error: {
          message,
        },
      });
    }
  };
}

const googleApiProxyPlugin = mode => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const middleware = createGoogleApiProxy(env);

  return {
    name: "google-review-proxy",
    configureServer(server) {
      // Use return to have Vite apply this middleware first
      return () => {
        server.middlewares.use(middleware);
      };
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
};

export default defineConfig(({ mode }) => ({
  plugins: [react(), googleApiProxyPlugin(mode)],
  server: {
    port: 5173,
    open: true,
    middlewareMode: false,
  },
  build: {
    outDir: "dist",
    sourcemap: false,
  },
}));
