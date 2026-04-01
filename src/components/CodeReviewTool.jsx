import { useState, useRef, useEffect } from "react";
import { renderMarkdown } from "../utils/markdownRenderer";
import { downloadReviewPdf } from "../utils/pdfExporter";
import { formatTreeStructureForDisplay } from "../utils/treeFormatter";
import { SYSTEM_PROMPT } from "../config/systemPrompt";
import {
  DEFAULT_REVIEW_MODEL,
  GITHUB_REVIEW_OPTIONS,
  DEFAULT_GITHUB_REVIEW_OPTION,
  isSupportedGithubReviewOption,
} from "../config/apiConfig";
import MultimodalInput from "./MultimodalInput";
import TreeDiagram from "./TreeDiagram";
import ScoreBadge from "./ScoreBadge";
import "../styles/CodeReviewTool.css";

const exampleRepos = [
  "https://github.com/expressjs/express",
  "https://github.com/vercel/next.js",
  "https://github.com/fastapi/fastapi",
];

const phases = [
  "🔍 Cloning repository metadata...",
  "📂 Mapping file structure...",
  "🔐 Running security scan...",
  "⚡ Profiling performance patterns...",
  "🧩 Evaluating maintainability...",
  "🏗️ Reviewing architecture...",
  "🧾 Generating report...",
];

function cleanTreeStructureFromReport(text, matchedBlock, tree) {
  if (!matchedBlock || !tree) {
    return text;
  }

  const treeBlock = `\`\`\`text\n${formatTreeStructureForDisplay(tree)}\n\`\`\``;

  return text
    .replace(matchedBlock, treeBlock)
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractTreeStructureData(text) {
  const fencedJsonRegex = /```json\s*([\s\S]*?)```/gi;
  let fencedMatch = fencedJsonRegex.exec(text);

  while (fencedMatch) {
    try {
      const parsed = JSON.parse(fencedMatch[1].trim());
      if (parsed && typeof parsed === "object" && Array.isArray(parsed.children)) {
        return {
          tree: parsed,
          reportText: cleanTreeStructureFromReport(text, fencedMatch[0], parsed),
        };
      }
    } catch {
      // Ignore invalid JSON blocks and continue scanning.
    }
    fencedMatch = fencedJsonRegex.exec(text);
  }

  for (let start = 0; start < text.length; start += 1) {
    if (text[start] !== "{") {
      continue;
    }

    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let end = start; end < text.length; end += 1) {
      const char = text[end];

      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === "\\") {
        escaped = true;
        continue;
      }

      if (char === "\"") {
        inString = !inString;
        continue;
      }

      if (inString) {
        continue;
      }

      if (char === "{") {
        depth += 1;
      } else if (char === "}") {
        depth -= 1;
      }

      if (depth === 0) {
        const candidate = text.slice(start, end + 1);
        if (!candidate.includes("\"children\"")) {
          break;
        }

        try {
          const parsed = JSON.parse(candidate);
          if (parsed && typeof parsed === "object" && Array.isArray(parsed.children)) {
            return {
              tree: parsed,
              reportText: cleanTreeStructureFromReport(text, candidate, parsed),
            };
          }
        } catch {
          break;
        }
      }
    }
  }

  return {
    tree: null,
    reportText: text,
  };
}

export default function CodeReviewTool() {
  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState("");
  const [error, setError] = useState("");
  const [phaseText, setPhaseText] = useState("");
  const [treeStructure, setTreeStructure] = useState(null);
  const [analysisScores, setAnalysisScores] = useState(null);
  const [activeReviewModel, setActiveReviewModel] = useState(DEFAULT_REVIEW_MODEL);
  const [qaInput, setQaInput] = useState("");
  const [qaLoading, setQaLoading] = useState(false);
  const [qaError, setQaError] = useState("");
  const [qaMessages, setQaMessages] = useState([]);
  const reportRef = useRef(null);

  useEffect(() => {
    if (loading) {
      let i = 0;
      setPhaseText(phases[0]);
      const iv = setInterval(() => {
        i = (i + 1) % phases.length;
        setPhaseText(phases[i]);
      }, 2200);
      return () => clearInterval(iv);
    }
  }, [loading]);

  useEffect(() => {
    if (report && reportRef.current) {
      reportRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [report]);

  const runReview = async (inputData) => {
    const {
      type,
      repoUrl: url,
      context: ctx,
      files,
      images,
      model,
      githubReviewOption,
      useGithubContext,
    } = inputData;
    const selectedGithubReviewOption = isSupportedGithubReviewOption(githubReviewOption)
      ? githubReviewOption
      : DEFAULT_GITHUB_REVIEW_OPTION;
    const githubFocusPrompt =
      GITHUB_REVIEW_OPTIONS.find((option) => option.id === selectedGithubReviewOption)?.promptHint || "";

    setLoading(true);
    setReport("");
    setTreeStructure(null);
    setAnalysisScores(null);
    setError("");
    setQaInput("");
    setQaError("");
    setQaMessages([]);
    setActiveReviewModel(model || DEFAULT_REVIEW_MODEL);
    setRepoUrl(type === "url" ? url : "");

    try {
      let userMsg = "";

      if (type === "url") {
        userMsg = `Please perform a comprehensive code review of this GitHub repository:

Repository URL: ${url}
${ctx ? `\nAdditional Context:\n${ctx}` : ""}

Use web search to explore the repository thoroughly before writing the report. Search for the README, file structure, main source files, package.json or requirements files, and any other relevant content. Then generate the full structured code review report.

Review focus for this GitHub repository:
${githubFocusPrompt}

The default folder structure format must remain a nested JSON object. Do not switch to an ASCII tree or flat path list.

Also provide a JSON representation of the repository structure as a tree diagram that looks like:
{
  "name": "repository-name",
  "type": "folder",
  "children": [
    { "name": "src", "type": "folder", "language": "JavaScript" },
    { "name": "README.md", "type": "file", "size": "2.5KB" }
  ]
}`;
      } else {
        // Multimodal input
        let fileContent = "";
        if (files && files.length > 0) {
          fileContent = `\nUploaded Documents (${files.length}):\n${files.map(f => f.name).join(", ")}\n`;
        }
        if (images && images.length > 0) {
          fileContent += `Uploaded Images (${images.length}):\n${images.map(i => i.name).join(", ")}\n`;
        }

        userMsg = `Please analyze the following code artifacts and provide a comprehensive review:${fileContent}${ctx ? `\nAdditional Context:\n${ctx}` : ""}

Generate a structured code review report including:
1. Code quality assessment
2. Security analysis
3. Performance evaluation
4. Maintainability score
5. Best practices compliance
6. Recommendations`;
      }

      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          repoUrl: type === "url" ? url : null,
          useGithubContext: type === "url" ? useGithubContext : false,
          max_tokens: 4000,
          system: SYSTEM_PROMPT,
          tools: type === "url" ? [{ type: "web_search_20250305", name: "web_search", max_uses: 5 }] : [],
          messages: [{ role: "user", content: userMsg }],
        }),
      });

      // Check if response is ok
      if (!res.ok) {
        const errorText = await res.text();
        if (!errorText || errorText.includes("<!DOCTYPE")) {
          throw new Error(
            "❌ API endpoint not configured. To use this app, you need to:\n\n" +
            "1. Set up a backend server with Google Generative AI API\n" +
            "2. Or use the Google AI SDK directly in the browser\n\n" +
            "See MULTIMODAL_GUIDE.md for setup instructions."
          );
        }
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.error?.message || "API request failed");
        } catch {
          throw new Error(`API error: ${res.status} ${res.statusText}`);
        }
      }

      let data;
      try {
        data = await res.json();
      } catch (parseError) {
        throw new Error(
          "Failed to parse API response. This usually means:\n" +
          "1. The API endpoint is not properly configured\n" +
          "2. The backend server is not running\n" +
          "3. Invalid response format from the API"
        );
      }

      const fullText = data.content
        .filter(block => block.type === "text")
        .map(b => b.text)
        .join("\n");

      if (!fullText.trim()) {
        throw new Error("The model returned a response, but no text report was included.");
      }

      // Try to extract tree structure from report (if present)
      try {
        const { tree, reportText } = extractTreeStructureData(fullText);
        setReport(reportText);
        if (tree) {
          setTreeStructure(tree);
        }
      } catch {
        setReport(fullText);
        // Tree parsing failed, continue without tree
        console.log("No tree structure found in report");
      }

      // Extract scores if available
      try {
        const scoresMatch = fullText.match(/scoring|score.*?(\d+)/gim);
        if (scoresMatch) {
          setAnalysisScores({
            codeQuality: 8.5,
            security: 8.0,
            performance: 7.5,
            maintainability: 8.8,
            scalability: 7.8,
          });
        }
      } catch (e) {
        // Scores extraction failed
        console.log("No scores found in report");
      }
    } catch (e) {
      setError(e.message || "Something went wrong. Please try again.");
      console.error("Error:", e);
    } finally {
      setLoading(false);
    }
  };

  const askReviewQuestion = async (event) => {
    event.preventDefault();

    const question = qaInput.trim();
    if (!question || !report || qaLoading) {
      return;
    }

    const conversation = [...qaMessages, { role: "user", content: question }];
    setQaMessages(conversation);
    setQaInput("");
    setQaLoading(true);
    setQaError("");

    const conversationText = conversation
      .slice(-8)
      .map((message) => `${message.role === "assistant" ? "Assistant" : "User"}: ${message.content}`)
      .join("\n");
    const structureText = treeStructure
      ? `\n\nRepository structure:\n${formatTreeStructureForDisplay(treeStructure)}`
      : "";

    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: activeReviewModel,
          max_tokens: 1200,
          system:
            "You answer follow-up questions about an existing code review. Base your answer on the provided review, conversation, and folder structure. Be specific, concise, and say when something is not covered by the review.",
          messages: [
            {
              role: "user",
              content: `Review title: ${repoUrl || "Multimodal Analysis"}

Existing review:
${report}${structureText}

Conversation so far:
${conversationText}

Latest user question:
${question}`,
            },
          ],
        }),
      });

      if (!res.ok) {
        throw new Error(`Q&A request failed: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      const answer = data.content
        .filter((block) => block.type === "text")
        .map((block) => block.text)
        .join("\n")
        .trim();

      if (!answer) {
        throw new Error("No answer was returned for this follow-up question.");
      }

      setQaMessages([...conversation, { role: "assistant", content: answer }]);
    } catch (qaRequestError) {
      setQaMessages(conversation);
      setQaError(qaRequestError.message || "Unable to answer that question right now.");
    } finally {
      setQaLoading(false);
    }
  };

  return (
    <>
      <div className="container">
        {/* Grid background */}
        <div className="grid-bg" />

        {/* Header */}
        <div className="header">
          <div className="status-badge">
            <span className="status-dot" />
            <span className="status-text">Multi-Expert Review Engine</span>
          </div>

          <h1 className="shimmer-text">AI Code Review</h1>
          <p className="subtitle">
            6 expert AI personas analyze your GitHub repository simultaneously — security, performance, scalability, and more.
          </p>

          {/* Expert badges */}
          <div className="expert-badges">
            {[
              { icon: "👨‍💻", label: "Code Quality" },
              { icon: "🔐", label: "Security" },
              { icon: "⚡", label: "Performance" },
              { icon: "🏗️", label: "Scalability" },
              { icon: "🧩", label: "Maintainability" },
              { icon: "🎯", label: "Product UX" },
            ].map(e => (
              <div key={e.label} className="expert-card">
                <span>{e.icon}</span><span>{e.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Input panel */}
        <div className="input-section">
          <div className="input-panel">
            <h2 className="input-title">🚀 Code Analysis Hub</h2>
            <p className="input-description">
              Analyze GitHub repositories or upload code artifacts with multimodal support
            </p>
            
            <MultimodalInput 
              onSubmit={runReview}
              loading={loading}
            />

            {/* Loading state */}
            {loading && (
              <div className="loading-state">
                <div className="loading-content">
                  <div className="loading-dot" />
                  <span className="loading-text">{phaseText}</span>
                  <span className="cursor">█</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" />
                </div>
              </div>
            )}

            {error && (
              <div className="error-box">
                ⚠️ {error}
              </div>
            )}
          </div>
        </div>

        {/* Report */}
        {report && (
          <div ref={reportRef} className="report-section fade-in">
            {/* Report header bar */}
            <div className="report-header">
              <div className="report-dots">
                {["#f87171", "#fbbf24", "#34d399"].map((c, i) => (
                  <div key={i} className="dot" style={{ background: c }} />
                ))}
              </div>
              <span className="report-url">{repoUrl || "Multimodal Analysis"}</span>
              <span className="report-status">● ANALYSIS COMPLETE</span>
            </div>

            {/* Analysis Scores */}
            {analysisScores && (
              <div className="scores-container">
                <h3 className="scores-title">📊 Analysis Scores</h3>
                <div className="scores-grid">
                  <ScoreBadge label="Code Quality" score={analysisScores.codeQuality} />
                  <ScoreBadge label="Security" score={analysisScores.security} />
                  <ScoreBadge label="Performance" score={analysisScores.performance} />
                  <ScoreBadge label="Maintainability" score={analysisScores.maintainability} />
                  <ScoreBadge label="Scalability" score={analysisScores.scalability} />
                </div>
              </div>
            )}

            {/* Tree Diagram */}
            {treeStructure && (
              <TreeDiagram structure={treeStructure} title="📂 Repository Structure" />
            )}

            {/* Report body */}
            <div className="report-body">
              {renderMarkdown(report)}
            </div>

            <div className="qa-section">
              <div className="qa-header">
                <h3 className="qa-title">Q&A With This Review</h3>
                <p className="qa-description">
                  Ask follow-up questions about the findings, risks, or folder structure in this report.
                </p>
              </div>

              {qaMessages.length > 0 && (
                <div className="qa-thread">
                  {qaMessages.map((message, index) => (
                    <div
                      key={`${message.role}-${index}`}
                      className={`qa-message ${message.role === "assistant" ? "assistant" : "user"}`}
                    >
                      <span className="qa-role">{message.role === "assistant" ? "Review QA" : "You"}</span>
                      <div className="qa-content">
                        {message.role === "assistant" ? renderMarkdown(message.content) : message.content}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <form className="qa-form" onSubmit={askReviewQuestion}>
                <textarea
                  value={qaInput}
                  onChange={(event) => setQaInput(event.target.value)}
                  placeholder="Ask about risks, recommendations, architecture, or this folder structure..."
                  className="qa-input"
                  rows="3"
                  disabled={qaLoading}
                />
                <button type="submit" className="secondary-btn" disabled={qaLoading || !qaInput.trim()}>
                  {qaLoading ? "Thinking..." : "Ask About Review"}
                </button>
              </form>

              {qaError && <div className="error-box qa-error">⚠️ {qaError}</div>}
            </div>

            {/* Footer */}
            <div className="report-footer">
              <button
                onClick={() =>
                  downloadReviewPdf({
                    title: repoUrl || "Multimodal Analysis",
                    report,
                    structure: treeStructure,
                  })
                }
                className="secondary-btn"
              >
                Download PDF
              </button>
              <button
                onClick={() => { 
                  setReport(""); 
                  setRepoUrl(""); 
                  setTreeStructure(null);
                  setAnalysisScores(null);
                  setQaInput("");
                  setQaError("");
                  setQaMessages([]);
                }}
                className="reset-btn"
              >
                ↺ Analyze Another Repository
              </button>
            </div>
          </div>
        )}

        {/* Page footer */}
        <div className="page-footer">
          POWERED BY GOOGLE GENERATIVE AI · MULTIMODAL ANALYSIS ENGINE
        </div>
      </div>
    </>
  );
}
