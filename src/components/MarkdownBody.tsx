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
    };

function parseMarkdown(markdown: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];

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

  for (const rawLine of markdown.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (line.length === 0) {
      flushParagraph();
      flushList();
      continue;
    }

    if (line.startsWith("### ")) {
      flushParagraph();
      flushList();
      blocks.push({ kind: "heading", level: 3, text: line.slice(4).trim() });
      continue;
    }

    if (line.startsWith("## ")) {
      flushParagraph();
      flushList();
      blocks.push({ kind: "heading", level: 2, text: line.slice(3).trim() });
      continue;
    }

    if (line.startsWith("- ")) {
      flushParagraph();
      list.push(line.slice(2).trim());
      continue;
    }

    if (line.startsWith("> ")) {
      flushParagraph();
      flushList();
      blocks.push({ kind: "quote", text: line.slice(2).trim() });
      continue;
    }

    flushList();
    paragraph.push(line);
  }

  flushParagraph();
  flushList();
  return blocks;
}

export function MarkdownBody({ markdown }: MarkdownBodyProps) {
  const blocks = parseMarkdown(markdown);

  return (
    <div className="markdown-body">
      {blocks.map((block, index) => {
        if (block.kind === "heading") {
          const key = `${block.text}-${index}`;
          return block.level === 2 ? (
            <h2 key={key}>{block.text}</h2>
          ) : (
            <h3 key={key}>{block.text}</h3>
          );
        }

        if (block.kind === "list") {
          return (
            <ul key={`list-${index}`}>
              {block.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          );
        }

        if (block.kind === "quote") {
          return <blockquote key={`${block.text}-${index}`}>{block.text}</blockquote>;
        }

        return <p key={`${block.text}-${index}`}>{block.text}</p>;
      })}
    </div>
  );
}
