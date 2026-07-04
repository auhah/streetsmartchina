import type { TroubleshootingRow } from "@/content/content-loader";

type TroubleshootingTableProps = {
  rows: readonly TroubleshootingRow[];
};

export function TroubleshootingTable({ rows }: TroubleshootingTableProps) {
  if (rows.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="troubleshooting-heading" className="guide-section">
      <h2 id="troubleshooting-heading">Troubleshooting</h2>
      <div className="table-wrap">
        <table className="troubleshooting-table">
          <thead>
            <tr>
              <th scope="col">Problem</th>
              <th scope="col">Likely cause</th>
              <th scope="col">Fix</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.problem}>
                <th scope="row">{row.problem}</th>
                <td>{row.cause}</td>
                <td>{row.fix}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
