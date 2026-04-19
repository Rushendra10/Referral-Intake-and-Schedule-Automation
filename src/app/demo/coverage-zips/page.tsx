import { getCoveredZips } from "@/lib/server/store";

export const dynamic = "force-dynamic";

export default async function CoverageZipsPage() {
  const zips = await getCoveredZips();

  return (
    <html lang="en">
      <head>
        <title>Service Area ZIP Codes - Demo Agency</title>
        <meta name="description" content="List of ZIP codes covered by the demo home health agency." />
        <style>{`
          body { font-family: system-ui, sans-serif; background: #f8fafc; color: #1e293b; margin: 0; padding: 2rem; }
          h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem; }
          p { color: #64748b; margin-bottom: 1.5rem; }
          table { width: 100%; max-width: 600px; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
          th { background: #0f172a; color: white; padding: 0.75rem 1rem; text-align: left; font-size: 0.875rem; }
          td { padding: 0.625rem 1rem; font-size: 0.875rem; border-bottom: 1px solid #e2e8f0; font-family: monospace; }
          tr:last-child td { border-bottom: none; }
          .badge { display: inline-block; background: #dcfce7; color: #166534; border-radius: 4px; padding: 0.125rem 0.5rem; font-size: 0.75rem; font-weight: 600; }
        `}</style>
      </head>
      <body>
        <h1>Service Area ZIP Codes</h1>
        <p>The following ZIP codes are within the home health agency&apos;s service area.</p>
        <table id="coverage-zip-table">
          <thead>
            <tr>
              <th>#</th>
              <th>ZIP Code</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {[...new Set(zips)].map((zip, i) => (
              <tr key={zip} id={`zip-row-${zip}`}>
                <td>{i + 1}</td>
                <td className="zip-code">{zip}</td>
                <td><span className="badge">Covered</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </body>
    </html>
  );
}
