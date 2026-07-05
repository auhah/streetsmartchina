import type { ReactNode } from "react";

type MarkdownBodyProps = {
  markdown: string;
};

type MarkdownBlock =
  | {
      kind: "heading";
      level: 2 | 3;
      text: string;
    }
  | {
      kind: "list";
      items: string[];
    }
  | {
      kind: "paragraph";
      text: string;
    }
  | {
      kind: "quote";
      text: string;
    }
  | {
      headers: string[];
      kind: "table";
      rows: string[][];
    };

function parseMarkdown(markdown: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];
  let table: string[] = [];

  function flushParagraph() {
    if (paragraph.length > 0) {
      blocks.push({ kind: "paragraph", text: paragraph.join(" ") });
      paragraph = [];
    }
  }

  function flushList() {
    if (list.length > 0) {
      blocks.push({ kind: "list", items: list });
      list = [];
    }
  }

  function flushTable() {
    if (table.length > 0) {
      const parsedTable = parseMarkdownTable(table);
      if (parsedTable) {
        blocks.push(parsedTable);
      } else {
        for (const line of table) {
          blocks.push({ kind: "paragraph", text: line });
        }
      }
      table = [];
    }
  }

  for (const rawLine of markdown.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (line.length === 0) {
      flushParagraph();
      flushList();
      flushTable();
      continue;
    }

    if (line.startsWith("<!--") && line.endsWith("-->")) {
      flushParagraph();
      flushList();
      flushTable();
      continue;
    }

    if (isMarkdownTableLine(line)) {
      flushParagraph();
      flushList();
      table.push(line);
      continue;
    }

    if (line.startsWith("### ")) {
      flushParagraph();
      flushList();
      flushTable();
      blocks.push({ kind: "heading", level: 3, text: line.slice(4).trim() });
      continue;
    }

    if (line.startsWith("## ")) {
      flushParagraph();
      flushList();
      flushTable();
      blocks.push({ kind: "heading", level: 2, text: line.slice(3).trim() });
      continue;
    }

    if (line.startsWith("- ")) {
      flushParagraph();
      flushTable();
      list.push(line.slice(2).trim());
      continue;
    }

    if (line.startsWith("> ")) {
      flushParagraph();
      flushList();
      flushTable();
      blocks.push({ kind: "quote", text: line.slice(2).trim() });
      continue;
    }

    flushList();
    flushTable();
    paragraph.push(line);
  }

  flushParagraph();
  flushList();
  flushTable();
  return blocks;
}

function isMarkdownTableLine(line: string): boolean {
  return line.startsWith("|") && line.endsWith("|");
}

function parseTableCells(line: string): string[] {
  return line
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function isTableSeparator(cells: readonly string[]): boolean {
  return cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function parseMarkdownTable(lines: readonly string[]):
  | Extract<MarkdownBlock, { kind: "table" }>
  | undefined {
  if (lines.length < 2) {
    return undefined;
  }

  const headers = parseTableCells(lines[0] ?? "");
  const separator = parseTableCells(lines[1] ?? "");
  if (!isTableSeparator(separator)) {
    return undefined;
  }

  const rows = lines.slice(2).map(parseTableCells);
  return {
    headers,
    kind: "table",
    rows,
  };
}

function renderInlineMarkdown(text: string): ReactNode {
  const parts: ReactNode[] = [];
  const linkPattern = /\[([^\]]+)\]\((\/[^)\s]*\/)\)/g;
  let lastIndex = 0;

  for (const match of text.matchAll(linkPattern)) {
    const [fullMatch, label, href] = match;
    const matchIndex = match.index ?? 0;
    const linkHref = href ?? "/";
    const linkLabel = label ?? "";
    if (matchIndex > lastIndex) {
      parts.push(text.slice(lastIndex, matchIndex));
    }

    parts.push(
      <a href={linkHref} key={`${linkHref}-${matchIndex}`}>
        {linkLabel}
      </a>,
    );
    lastIndex = matchIndex + fullMatch.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

export function MarkdownBody({ markdown }: MarkdownBodyProps) {
  const blocks = parseMarkdown(markdown);

  return (
    <div className="markdown-body">
      {blocks.map((block, index) => {
        if (block.kind === "heading") {
          const key = `${block.text}-${index}`;
          return block.level === 2 ? (
            <h2 key={key}>{renderInlineMarkdown(block.text)}</h2>
          ) : (
            <h3 key={key}>{renderInlineMarkdown(block.text)}</h3>
          );
        }

        if (block.kind === "list") {
          return (
            <ul key={`list-${index}`}>
              {block.items.map((item) => (
                <li key={item}>{renderInlineMarkdown(item)}</li>
              ))}
            </ul>
          );
        }

        if (block.kind === "quote") {
          return (
            <blockquote key={`${block.text}-${index}`}>
              {renderInlineMarkdown(block.text)}
            </blockquote>
          );
        }

        if (block.kind === "table") {
          return (
            <div className="table-wrap" key={`table-${index}`}>
              <table className="content-table">
                <thead>
                  <tr>
                    {block.headers.map((header, headerIndex) => (
                      <th key={`${header}-${headerIndex}`} scope="col">
                        {renderInlineMarkdown(header)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {block.rows.map((row) => (
                    <tr key={row.join("|")}>
                      {block.headers.map((header, cellIndex) => (
                        <td key={`${header}-${cellIndex}`}>
                          {renderInlineMarkdown(row[cellIndex] ?? "")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        return (
          <p key={`${block.text}-${index}`}>{renderInlineMarkdown(block.text)}</p>
        );
      })}
    </div>
  );
}
