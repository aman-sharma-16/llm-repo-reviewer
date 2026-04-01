function buildTreeLines(node, prefix = "", isLast = true, lines = []) {
  if (!node) {
    return lines;
  }

  const connector = prefix ? `${isLast ? "└── " : "├── "}` : "";
  const suffix = node.type === "folder" ? "/" : node.size ? ` (${node.size})` : "";
  lines.push(`${prefix}${connector}${node.name}${suffix}`);

  if (!Array.isArray(node.children) || node.children.length === 0) {
    return lines;
  }

  const nextPrefix = prefix ? `${prefix}${isLast ? "    " : "│   "}` : "";
  node.children.forEach((child, index) => {
    buildTreeLines(child, nextPrefix, index === node.children.length - 1, lines);
  });

  return lines;
}

export function formatTreeStructureForDisplay(structure) {
  return buildTreeLines(structure).join("\n");
}

export function formatTreeStructureForPdf(structure) {
  return buildTreeLines(structure)
    .map((line) =>
      line
        .replace(/│/g, "|")
        .replace(/├──/g, "|--")
        .replace(/└──/g, "`--")
    )
    .join("\n");
}
