import React from "react";

export function renderMarkdown(text) {
  const lines = text.split("\n");
  const elements = [];
  let tableBuffer = [];
  let inTable = false;
  let inCodeBlock = false;
  let codeBlockBuffer = [];
  let key = 0;

  const scoreColor = (s) => {
    const n = parseFloat(s);
    if (isNaN(n)) return "#94a3b8";
    if (n >= 8) return "#34d399";
    if (n >= 6) return "#fbbf24";
    return "#f87171";
  };

  const flushTable = () => {
    if (tableBuffer.length < 2) {
      tableBuffer = [];
      inTable = false;
      return;
    }
    const headers = tableBuffer[0]
      .split("|")
      .map(h => h.trim())
      .filter(Boolean);
    const rows = tableBuffer
      .slice(2)
      .map(r =>
        r
          .split("|")
          .map(c => c.trim())
          .filter(Boolean)
      );

    elements.push(
      <div key={key++} style={{ overflowX: "auto", margin: "16px 0" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "13px",
          }}
        >
          <thead>
            <tr>
              {headers.map((h, i) => (
                <th
                  key={i}
                  style={{
                    padding: "8px 12px",
                    borderBottom: "1px solid #2a2a3a",
                    textAlign: "left",
                    color: "#a78bfa",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, ri) => (
              <tr key={ri} style={{ borderBottom: "1px solid #1a1a2e" }}>
                {r.map((c, ci) => (
                  <td
                    key={ci}
                    style={{
                      padding: "8px 12px",
                      color:
                        ci === 0
                          ? "#e2e8f0"
                          : ci === 1
                            ? scoreColor(c)
                            : "#94a3b8",
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "13px",
                    }}
                  >
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    tableBuffer = [];
    inTable = false;
  };

  const flushCodeBlock = () => {
    elements.push(
      <pre
        key={key++}
        style={{
          margin: "16px 0",
          padding: "14px 16px",
          borderRadius: "10px",
          background: "#050510",
          border: "1px solid #1a1a3a",
          color: "#cbd5e1",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "12px",
          lineHeight: "1.7",
          overflowX: "auto",
          whiteSpace: "pre-wrap",
        }}
      >
        <code>{codeBlockBuffer.join("\n")}</code>
      </pre>
    );

    inCodeBlock = false;
    codeBlockBuffer = [];
  };

  const inlineFormat = (str) => {
    const parts = str.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
    return parts.map((p, i) => {
      if (p.startsWith("`") && p.endsWith("`")) {
        return (
          <code
            key={i}
            style={{
              background: "#1e1e2e",
              color: "#7dd3fc",
              padding: "1px 6px",
              borderRadius: "4px",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "12px",
            }}
          >
            {p.slice(1, -1)}
          </code>
        );
      }
      if (p.startsWith("**") && p.endsWith("**")) {
        return (
          <strong key={i} style={{ color: "#e2e8f0" }}>
            {p.slice(2, -2)}
          </strong>
        );
      }
      return p;
    });
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim().startsWith("```")) {
      if (inTable) {
        flushTable();
      }

      if (inCodeBlock) {
        flushCodeBlock();
      } else {
        inCodeBlock = true;
        codeBlockBuffer = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockBuffer.push(line);
      continue;
    }

    if (line.includes("|") && line.trim().startsWith("|")) {
      inTable = true;
      tableBuffer.push(line);
      continue;
    } else if (inTable) {
      flushTable();
    }

    if (!line.trim()) {
      elements.push(<div key={key++} style={{ height: "8px" }} />);
      continue;
    }
    if (line.startsWith("---")) {
      elements.push(
        <hr
          key={key++}
          style={{
            border: "none",
            borderTop: "1px solid #1e293b",
            margin: "16px 0",
          }}
        />
      );
      continue;
    }

    if (line.startsWith("# ")) {
      elements.push(
        <h1
          key={key++}
          style={{
            fontSize: "22px",
            fontWeight: 800,
            color: "#f1f5f9",
            fontFamily: "'Syne', sans-serif",
            margin: "24px 0 16px",
            letterSpacing: "-0.5px",
          }}
        >
          {line.slice(2)}
        </h1>
      );
    } else if (line.startsWith("## ")) {
      elements.push(
        <h2
          key={key++}
          style={{
            fontSize: "16px",
            fontWeight: 700,
            color: "#a78bfa",
            fontFamily: "'Syne', sans-serif",
            margin: "24px 0 10px",
            textTransform: "uppercase",
            letterSpacing: "1px",
            borderLeft: "3px solid #7c3aed",
            paddingLeft: "12px",
          }}
        >
          {line.slice(3)}
        </h2>
      );
    } else if (line.startsWith("### ")) {
      elements.push(
        <h3
          key={key++}
          style={{
            fontSize: "14px",
            fontWeight: 700,
            color: "#7dd3fc",
            fontFamily: "'JetBrains Mono', monospace",
            margin: "16px 0 8px",
          }}
        >
          {line.slice(4)}
        </h3>
      );
    } else if (line.match(/^\d+\.\s/)) {
      const content = line.replace(/^\d+\.\s/, "");
      const num = line.match(/^(\d+)/)[1];
      elements.push(
        <div
          key={key++}
          style={{
            display: "flex",
            gap: "10px",
            margin: "4px 0",
            alignItems: "flex-start",
          }}
        >
          <span
            style={{
              color: "#7c3aed",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "12px",
              minWidth: "20px",
              paddingTop: "2px",
            }}
          >
            {num}.
          </span>
          <span style={{ color: "#cbd5e1", fontSize: "14px", lineHeight: "1.6" }}>
            {inlineFormat(content)}
          </span>
        </div>
      );
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      const content = line.slice(2);
      elements.push(
        <div
          key={key++}
          style={{
            display: "flex",
            gap: "10px",
            margin: "3px 0",
            alignItems: "flex-start",
          }}
        >
          <span
            style={{
              color: "#7c3aed",
              fontSize: "16px",
              lineHeight: "1",
              paddingTop: "2px",
            }}
          >
            ›
          </span>
          <span style={{ color: "#cbd5e1", fontSize: "14px", lineHeight: "1.6" }}>
            {inlineFormat(content)}
          </span>
        </div>
      );
    } else if (line.startsWith("**") && line.includes(":**")) {
      elements.push(
        <p
          key={key++}
          style={{ margin: "4px 0", color: "#cbd5e1", fontSize: "14px", lineHeight: "1.6" }}
        >
          {inlineFormat(line)}
        </p>
      );
    } else {
      elements.push(
        <p
          key={key++}
          style={{
            margin: "4px 0",
            color: "#94a3b8",
            fontSize: "14px",
            lineHeight: "1.7",
          }}
        >
          {inlineFormat(line)}
        </p>
      );
    }
  }
  if (inTable) flushTable();
  if (inCodeBlock) flushCodeBlock();
  return elements;
}
