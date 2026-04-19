import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

/* ─── All styles scoped to .cf-landing — nothing bleeds into other pages ─── */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

  .cf-landing {
    min-height: 100vh;
    background: #ffffff;
    color: #0f172a;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 15px;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;

    /* Design tokens scoped to this page only */
    --cf-bg-base: #ffffff;
    --cf-bg-surface: #f8f9fb;
    --cf-bg-card: #ffffff;
    --cf-bg-muted: #f1f5f9;
    --cf-border: #e2e8f0;
    --cf-border-strong: #cbd5e1;
    --cf-brand: #0f172a;
    --cf-brand-blue: #2563eb;
    --cf-brand-blue-light: #eff6ff;
    --cf-brand-blue-border: #bfdbfe;
    --cf-green: #16a34a;
    --cf-text-primary: #0f172a;
    --cf-text-secondary: #475569;
    --cf-text-muted: #94a3b8;
    --cf-radius-sm: 6px;
    --cf-radius: 10px;
    --cf-radius-lg: 14px;
    --cf-radius-xl: 20px;
    --cf-shadow-xs: 0 1px 2px rgba(0,0,0,0.05);
    --cf-transition: all 0.15s cubic-bezier(0.4,0,0.2,1);
  }

  /* Nav */
  .cf-nav {
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 32px;
    background: rgba(255,255,255,0.9);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--cf-border);
    position: sticky;
    top: 0;
    z-index: 100;
  }
  .cf-logo-mark {
    width: 28px; height: 28px;
    background: var(--cf-brand);
    border-radius: 7px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .cf-logo-mark svg { width: 14px; height: 14px; }

  /* Buttons */
  .cf-btn {
    display: inline-flex; align-items: center; justify-content: center;
    gap: 6px; padding: 7px 14px;
    border-radius: var(--cf-radius-sm);
    font-size: 13.5px; font-weight: 500;
    font-family: 'Inter', sans-serif;
    cursor: pointer; border: 1px solid transparent;
    transition: var(--cf-transition);
    white-space: nowrap; line-height: 1; letter-spacing: -0.1px;
    background: none;
  }
  .cf-btn:active { transform: scale(0.98); }

  .cf-btn-primary {
    background: var(--cf-brand) !important;
    color: #fff !important;
    border-color: var(--cf-brand) !important;
    box-shadow: var(--cf-shadow-xs);
  }
  .cf-btn-primary:hover { background: #1e293b !important; }

  .cf-btn-secondary {
    background: var(--cf-bg-base) !important;
    color: var(--cf-text-secondary) !important;
    border-color: var(--cf-border) !important;
    box-shadow: var(--cf-shadow-xs);
  }
  .cf-btn-secondary:hover {
    background: var(--cf-bg-surface) !important;
    color: var(--cf-text-primary) !important;
    border-color: var(--cf-border-strong) !important;
  }

  .cf-btn-xl { padding: 13px 28px !important; font-size: 15px !important; font-weight: 600 !important; border-radius: var(--cf-radius) !important; }

  @keyframes cf-blink { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
  .cf-blink { animation: cf-blink 1.5s ease infinite; }
`

/* ─── Data ──────────────────────────────────────────────────────────────────── */
const stats = [
  { value: "$5.4T", label: "US Healthcare Economy", sub: "World's largest — growing 5.4% annually" },
  { value: "$170B", label: "Home Health Market", sub: "Fastest-growing segment in post-acute care" },
  { value: "12M+", label: "Referrals Per Year", sub: "Across 11,000+ home health agencies nationally" },
  { value: "40%", label: "Referrals Delayed", sub: "Stuck in manual intake queues for 3–7 days" },
  { value: "$2.8B", label: "Annual Revenue Lost", sub: "From referral leakage and processing backlogs" },
  { value: "72 hrs", label: "Avg. Processing Time", sub: "Industry average for a single referral intake" },
]

const beforeItems = [
  "Faxed documents with missing fields",
  "Manual data entry into outdated portals",
  "Insurance verified over the phone",
  "Nurse scheduling managed via spreadsheets",
  "Patients waiting days for their first visit",
]

const afterItems = [
  "Document ingested and parsed automatically",
  "Insurance eligibility verified in real-time",
  "ZIP code service area validated instantly",
  "6 parallel agents extract all required fields",
  "Referral placed and nurse scheduled under 90s",
]

const pipeline = [
  { step: "01", label: "Referral ingested", sub: "Fax / EMR / Upload", color: "#0f172a" },
  { step: "02", label: "Insurance check", sub: "Real-time eligibility", color: "#0f172a" },
  { step: "03", label: "Coverage check", sub: "ZIP code validation", color: "#2563eb" },
  { step: "04", label: "Data extraction", sub: "6 parallel agents", color: "#2563eb" },
  { step: "05", label: "Referral placed", sub: "97% confidence", color: "#16a34a" },
  { step: "06", label: "Visit scheduled", sub: "Nurse matched", color: "#16a34a" },
]

/* ─── Component ─────────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const navigate = useNavigate()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60)
    return () => clearTimeout(t)
  }, [])

  // Shorthand inline style helpers using scoped vars
  const S = {
    border: "1px solid var(--cf-border)",
    borderBlue: "1px solid var(--cf-brand-blue-border)",
  }

  return (
    <>
      <style>{css}</style>

      <div className="cf-landing">

        {/* ── Nav ── */}
        <nav className="cf-nav">
          <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
            <div className="cf-logo-mark">
              <svg viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 2L14 5.5V10.5L8 14L2 10.5V5.5L8 2Z" />
                <path d="M8 7V10" />
                <circle cx="8" cy="5.5" r="0.75" fill="white" stroke="none" />
              </svg>
            </div>
            <span style={{ fontSize: "15px", fontWeight: 700, letterSpacing: "-0.3px", color: "var(--cf-text-primary)" }}>
              RISA AI
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "12px", color: "var(--cf-text-muted)", background: "var(--cf-bg-muted)", border: S.border, padding: "3px 10px", borderRadius: "100px" }}>
              Hackathon Demo
            </span>
            <button className="cf-btn cf-btn-primary" onClick={() => navigate("/portal")}>
              View Demo
            </button>
          </div>
        </nav>

        {/* ── Hero ── */}
        <section style={{
          padding: "88px 32px 72px", maxWidth: "760px", margin: "0 auto", textAlign: "center",
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(12px)",
          transition: "all 0.5s ease",
        }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "var(--cf-brand-blue-light)", border: S.borderBlue, color: "var(--cf-brand-blue)", borderRadius: "100px", padding: "4px 12px", fontSize: "12.5px", fontWeight: 500, marginBottom: "28px" }}>
            <span className="cf-blink" style={{ width: "5px", height: "5px", borderRadius: "50%", background: "var(--cf-brand-blue)", display: "inline-block" }} />
            Powered by TinyFish Agentic Orchestration
          </div>

          <h1 style={{ fontSize: "clamp(36px, 5.5vw, 62px)", fontWeight: 800, lineHeight: 1.08, letterSpacing: "-1.5px", color: "var(--cf-text-primary)", marginBottom: "22px" }}>
            Home health referrals,<br />
            <span style={{ color: "var(--cf-brand-blue)" }}>processed in seconds.</span>
          </h1>

          <p style={{ fontSize: "17px", color: "var(--cf-text-secondary)", lineHeight: 1.65, maxWidth: "520px", margin: "0 auto 40px" }}>
            RISA deploys a coordinated swarm of AI agents to extract, validate,
            and route home health referrals — eliminating the 72-hour backlog that
            costs agencies billions and delays patient care.
          </p>

          <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
            <button className="cf-btn cf-btn-primary cf-btn-xl" onClick={() => navigate("/portal")}>See the demo</button>
            <button className="cf-btn cf-btn-secondary cf-btn-xl" onClick={() => { }}>View architecture</button>
          </div>
        </section>

        {/* ── Divider ── */}
        <div style={{ maxWidth: "960px", margin: "0 auto 64px", padding: "0 32px" }}>
          <hr style={{ border: "none", height: "1px", background: "var(--cf-border)" }} />
        </div>

        {/* ── Stats ── */}
        <section style={{ maxWidth: "1120px", margin: "0 auto 80px", padding: "0 32px" }}>
          <div style={{ marginBottom: "36px" }}>
            <h2 style={{ fontSize: "22px", fontWeight: 700, letterSpacing: "-0.4px", marginBottom: "6px", color: "var(--cf-text-primary)" }}>
              The referral problem, in numbers
            </h2>
            <p style={{ color: "var(--cf-text-muted)", fontSize: "14px" }}>Why manual referral processing is costing agencies — and patients</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1px", background: "var(--cf-border)", border: S.border, borderRadius: "var(--cf-radius-lg)", overflow: "hidden" }}>
            {stats.map((s, i) => (
              <div key={s.label} style={{ background: "var(--cf-bg-card)", padding: "28px 24px", opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(8px)", transition: `all 0.4s ease ${i * 60}ms` }}>
                <div style={{ fontSize: "28px", fontWeight: 800, letterSpacing: "-1px", color: "var(--cf-text-primary)", marginBottom: "4px", fontVariantNumeric: "tabular-nums" }}>{s.value}</div>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--cf-text-secondary)", marginBottom: "3px" }}>{s.label}</div>
                <div style={{ fontSize: "12px", color: "var(--cf-text-muted)", lineHeight: 1.4 }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── How it works ── */}
        <section style={{ maxWidth: "1120px", margin: "0 auto 80px", padding: "0 32px" }}>
          <div style={{ marginBottom: "36px" }}>
            <h2 style={{ fontSize: "22px", fontWeight: 700, letterSpacing: "-0.4px", marginBottom: "6px", color: "var(--cf-text-primary)" }}>How RISA works</h2>
            <p style={{ color: "var(--cf-text-muted)", fontSize: "14px" }}>Six specialized agents, each with a single responsibility</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            {/* Before */}
            <div style={{ background: "var(--cf-bg-surface)", border: S.border, borderRadius: "var(--cf-radius-lg)", padding: "28px" }}>
              <div style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--cf-text-muted)", marginBottom: "16px", borderBottom: S.border, paddingBottom: "10px", width: "100%" }}>
                Before — Manual process
              </div>
              {beforeItems.map((item) => (
                <div key={item} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13.5px", color: "var(--cf-text-secondary)", padding: "7px 0", borderBottom: S.border }}>
                  <div style={{ width: "16px", height: "16px", borderRadius: "50%", border: "1.5px solid var(--cf-border-strong)", flexShrink: 0 }} />
                  {item}
                </div>
              ))}
            </div>
            {/* After */}
            <div style={{ background: "var(--cf-brand-blue-light)", border: S.borderBlue, borderRadius: "var(--cf-radius-lg)", padding: "28px" }}>
              <div style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--cf-brand-blue)", marginBottom: "16px", borderBottom: S.borderBlue, paddingBottom: "10px", width: "100%" }}>
                After — RISA AI
              </div>
              {afterItems.map((item) => (
                <div key={item} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13.5px", color: "var(--cf-text-secondary)", padding: "7px 0", borderBottom: S.borderBlue }}>
                  <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: "var(--cf-brand-blue)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                      <path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Pipeline ── */}
        <section style={{ maxWidth: "1120px", margin: "0 auto 80px", padding: "0 32px" }}>
          <div style={{ background: "var(--cf-bg-surface)", border: S.border, borderRadius: "var(--cf-radius-lg)", padding: "32px" }}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--cf-text-muted)", marginBottom: "24px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Processing pipeline
            </div>
            <div style={{ display: "flex", alignItems: "center", overflowX: "auto" }}>
              {pipeline.map((s, i) => (
                <div key={s.step} style={{ display: "flex", alignItems: "center", flex: "1 1 0", minWidth: 0 }}>
                  <div style={{ textAlign: "center", flex: 1, padding: "0 4px" }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: s.color, color: "white", fontSize: "11px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px" }}>
                      {s.step}
                    </div>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--cf-text-primary)", marginBottom: "2px", whiteSpace: "nowrap" }}>{s.label}</div>
                    <div style={{ fontSize: "11px", color: "var(--cf-text-muted)", whiteSpace: "nowrap" }}>{s.sub}</div>
                  </div>
                  {i < pipeline.length - 1 && (
                    <div style={{ height: "1px", width: "24px", background: "var(--cf-border)", flexShrink: 0, marginBottom: "24px" }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section style={{ maxWidth: "720px", margin: "0 auto 100px", padding: "0 32px", textAlign: "center" }}>
          <div style={{ background: "var(--cf-brand)", borderRadius: "var(--cf-radius-xl)", padding: "52px 40px", color: "white" }}>
            <div style={{ fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.5)", marginBottom: "14px" }}>
              Ready to begin
            </div>
            <h2 style={{ fontSize: "28px", fontWeight: 800, letterSpacing: "-0.5px", marginBottom: "12px", color: "white" }}>
              See the full referral lifecycle
            </h2>
            <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "15px", marginBottom: "28px", lineHeight: 1.6 }}>
              Watch RISA process a real home health referral end-to-end in under 90 seconds.
            </p>
            <button
              className="cf-btn cf-btn-xl"
              onClick={() => navigate("/portal")}
              style={{ background: "white", color: "var(--cf-brand)", borderColor: "transparent", fontWeight: 700 }}
            >
              Launch demo
            </button>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer style={{ borderTop: S.border, padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: "1280px", margin: "0 auto", fontSize: "12.5px", color: "var(--cf-text-muted)" }}>
          <span>RISA AI — Hackathon 2026</span>
          <span>Built with TinyFish Agentic Orchestration</span>
        </footer>
      </div>
    </>
  )
}