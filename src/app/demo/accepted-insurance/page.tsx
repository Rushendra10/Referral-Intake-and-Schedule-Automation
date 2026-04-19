import { getAcceptedInsurancePlans } from "@/lib/server/store";

export const dynamic = "force-dynamic";

export default async function AcceptedInsurancePage() {
  const plans = await getAcceptedInsurancePlans();

  return (
    <html lang="en">
      <head>
        <title>Accepted Insurance Plans - Demo Agency</title>
        <meta name="description" content="List of insurance plans accepted by the demo home health agency." />
        <style>{`
          body { font-family: system-ui, sans-serif; background: #f8fafc; color: #1e293b; margin: 0; padding: 2rem; }
          h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem; }
          p { color: #64748b; margin-bottom: 1.5rem; }
          table { width: 100%; max-width: 700px; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
          th { background: #0f172a; color: white; padding: 0.75rem 1rem; text-align: left; font-size: 0.875rem; }
          td { padding: 0.625rem 1rem; font-size: 0.875rem; border-bottom: 1px solid #e2e8f0; }
          tr:last-child td { border-bottom: none; }
          .badge { display: inline-block; background: #dcfce7; color: #166534; border-radius: 4px; padding: 0.125rem 0.5rem; font-size: 0.75rem; font-weight: 600; }
          .payer { font-weight: 500; }
        `}</style>
      </head>
      <body>
        <h1>Accepted Insurance Plans</h1>
        <p>The following insurance plans are currently accepted by the home health agency.</p>
        <table id="accepted-insurance-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Insurance Plan</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((plan, i) => (
              <tr key={plan} id={`insurance-row-${i}`}>
                <td>{i + 1}</td>
                <td className="payer insurance-plan">{plan}</td>
                <td><span className="badge">Accepted</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </body>
    </html>
  );
}
