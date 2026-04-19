import { getNurses } from "@/lib/server/store";

export const dynamic = "force-dynamic";

export default async function NurseSchedulesPage() {
  const nurses = await getNurses();

  return (
    <html lang="en">
      <head>
        <title>Nurse Schedules - Demo Agency</title>
        <meta name="description" content="Nurse availability and scheduling slots at the demo home health agency." />
        <style>{`
          body { font-family: system-ui, sans-serif; background: #f8fafc; color: #1e293b; margin: 0; padding: 2rem; }
          h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem; }
          p { color: #64748b; margin-bottom: 1.5rem; }
          table { width: 100%; max-width: 800px; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
          th { background: #0f172a; color: white; padding: 0.75rem 1rem; text-align: left; font-size: 0.875rem; }
          td { padding: 0.625rem 1rem; font-size: 0.875rem; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
          tr:last-child td { border-bottom: none; }
          .name { font-weight: 600; }
          .slot-tag { display: inline-block; background: #f0fdf4; color: #166534; border-radius: 4px; padding: 0.125rem 0.5rem; font-size: 0.75rem; font-weight: 500; margin: 0.125rem; font-family: monospace; }
        `}</style>
      </head>
      <body>
        <h1>Nurse Availability Schedules</h1>
        <p>Available time slots for each nurse over the next 7 days.</p>
        <table id="nurse-schedules-table">
          <thead>
            <tr>
              <th>Nurse</th>
              <th>ID</th>
              <th>Available Slots</th>
            </tr>
          </thead>
          <tbody>
            {nurses.map((nurse) => (
              <tr key={nurse.id} id={`schedule-row-${nurse.id}`}>
                <td className="name nurse-name">{nurse.name}</td>
                <td className="nurse-id">{nurse.id}</td>
                <td className="nurse-slots">
                  {nurse.availableSlots.map((slot) => (
                    <span key={slot} className="slot-tag">{slot}</span>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </body>
    </html>
  );
}
