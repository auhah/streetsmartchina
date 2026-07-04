import type { OfficialSource } from "@/content/content-loader";

type OfficialSourcesProps = {
  sources: readonly OfficialSource[];
};

export function OfficialSources({ sources }: OfficialSourcesProps) {
  return (
    <aside aria-labelledby="official-sources-heading" className="source-box">
      <h2 id="official-sources-heading">Official sources checked</h2>
      <ul>
        {sources.map((source) => (
          <li key={source.url}>
            <a href={source.url} rel="noreferrer" target="_blank">
              {source.label}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}
