import Link from "next/link";
import type { ReactNode } from "react";
import LandingAnimations from "./LandingAnimations";
import JsonLdSeo from "./JsonLdSeo";
import styles from "./page.module.css";

export default async function LandingPage() {
  const svgs = getIconSvgs();

  return (
    <>
      <JsonLdSeo />
      <div className={styles.landingRoot} aria-label="AccessDiff marketing landing">
        {/* ═══════════════════ Hero ═══════════════════ */}
        <header className={styles.nav}>
          <div className={styles.navInner}>
            <Link href="/" className={styles.brand} aria-label="AccessDiff home">
              <span className={styles.brandMark} aria-hidden="true">
                <svg viewBox="0 0 40 40" width="28" height="28">
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="hsl(12, 76%, 58%)" />
                      <stop offset="100%" stopColor="hsl(176, 52%, 42%)" />
                    </linearGradient>
                  </defs>
                  <rect x="2" y="2" width="36" height="36" rx="9" fill="url(#g1)" />
                  <path
                    d="M11 20 L18 27 L29 13"
                    stroke="white"
                    strokeWidth="4"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className={styles.brandText}>
                Access<span className={styles.brandAccent}>Diff</span>
              </span>
            </Link>

            <nav className={styles.navLinks} aria-label="Primary">
              <a href="#features">Features</a>
              <a href="#how">How it works</a>
              <a href="#pricing">Pricing</a>
              <a href="#faq">FAQ</a>
            </nav>

            <div className={styles.navCTA}>
              <Link href="/login" className={`${styles.cta} ${styles.ctaGhost}`}>
                Sign in
              </Link>
              <Link href="/login" className={`${styles.cta} ${styles.ctaPrimary}`}>
                Get started — free
              </Link>
            </div>
          </div>
        </header>

        {/* ═══════════════════ Hero headline ═══════════════════ */}
        <section className={styles.hero} id="top">
          <div className={styles.heroBadge} aria-hidden="true">
            <span className={styles.dot} />
            Powered by Groq · Sarvam · Mutagent Helix · axe-core
          </div>

          <h1 className={styles.heroTitle}>
            Catch accessibility regressions.
            <br />
            <span className={styles.heroAccent}>Before they ship to users.</span>
          </h1>

          <p className={styles.heroSub}>
            AccessDiff runs WCAG 2.2 audits <em>only on newly added code</em> in every
            pull request — no noise from legacy issues. AI generates human-reviewed
            patches, verifies them with axe-core in Chromium, and opens PRs with
            full governance audit trails.
          </p>

          <div className={styles.heroCTA}>
            <Link href="/login" className={`${styles.cta} ${styles.ctaPrimary} ${styles.ctaLarge}`}>
              Start auditing your repo
            </Link>
            <a href="#how" className={`${styles.cta} ${styles.ctaSecondary} ${styles.ctaLarge}`}>
              Watch 90-second demo →
            </a>
          </div>

          {/* Hero preview card */}
          <div
            className={styles.heroPreview}
            role="img"
            aria-label="Screenshot preview: AccessDiff pipeline showing 7 accessibility issues caught in a pull request"
          >
            <div className={styles.previewHeader}>
              <div className={styles.previewDots} aria-hidden="true">
                <span /> <span /> <span />
              </div>
              <span className={styles.previewTitle}>
                github.com/acme/website — PR #424
              </span>
              <div className={`${styles.previewBadge} ${styles.previewBadgeGreen}`}>
                AccessDiff: 7 issues · 7 verified fixes
              </div>
            </div>
            <div className={styles.previewBody}>
              <div className={styles.previewScore}>
                <div className={styles.scoreRing} aria-hidden="true">
                  <svg viewBox="0 0 120 120" width="110" height="110">
                    <circle cx="60" cy="60" r="52" stroke="hsla(220,18%,72%,0.4)" strokeWidth="10" fill="none" />
                    <circle
                      cx="60" cy="60" r="52"
                      stroke="hsl(148, 50%, 40%)"
                      strokeWidth="10" fill="none"
                      strokeDasharray="327" strokeDashoffset="49"
                      strokeLinecap="round" transform="rotate(-90 60 60)"
                    />
                  </svg>
                  <div className={styles.scoreText}>
                    <div className={styles.scoreNum}>85</div>
                    <div className={styles.scoreLabel}>/100</div>
                  </div>
                </div>
                <div className={styles.scoreMeta}>
                  <h3>Accessibility Compliance</h3>
                  <div className={styles.scoreRow}><span>Critical</span><Badge variant="critical">1</Badge></div>
                  <div className={styles.scoreRow}><span>Major</span><Badge variant="major">2</Badge></div>
                  <div className={styles.scoreRow}><span>Minor</span><Badge variant="minor">3</Badge></div>
                  <div className={styles.scoreRow}><span>Advisory</span><Badge variant="advisory">1</Badge></div>
                </div>
              </div>
              <div className={styles.previewDiffs}>
                {[
                  { file: "src/components/Checkout.tsx", issue: "Missing `aria-label` on icon button", sev: "Major" as const },
                  { file: "src/components/Hero.tsx", issue: "Image missing `alt` text", sev: "Critical" as const },
                  { file: "src/app/shop/page.tsx", issue: "Color contrast 2.9:1 < 4.5:1", sev: "Minor" as const },
                ].map((row, i) => (
                  <div key={i} className={styles.diffRow}>
                    <Badge variant={row.sev.toLowerCase() as BadgeVariant}>
                      {row.sev}
                    </Badge>
                    <span className={styles.diffFile}>{row.file}</span>
                    <span className={styles.diffIssue}>{row.issue}</span>
                    <span className={styles.diffFix}>✓ AI fix verified</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════ Feature logos ═══════════════════ */}
        <section className={styles.logoStrip} aria-label="Trusted by teams using">
          <p>Built for the modern web stack</p>
          <ul>
            {["Next.js", "React", "TypeScript", "Supabase", "GitHub", "Groq", "Sarvam AI", "Playwright"].map(
              (n) => (
                <li key={n}>{n}</li>
              )
            )}
          </ul>
        </section>

        {/* ═══════════════════ Features ═══════════════════ */}
        <section id="features" className={styles.features} aria-labelledby="features-heading">
          <div className={styles.sectionLabel}>FEATURES</div>
          <h2 id="features-heading" className={styles.sectionTitle}>
            The engineering-grade a11y platform.
          </h2>
          <p className={styles.sectionSub}>
            Every step of the accessibility loop — detection, explanation, remediation,
            verification, and approval — run by AI agents with full audit trails.
          </p>

          <div className={styles.featureGrid}>
            <FeatureCard
              icon={svgs.diff}
              title="Regression-Only Scanning"
              body="We only audit the added lines of your diff. No more 400-issue reports full of pre-existing debt. Every result is newly introduced."
              accent="rose"
            />
            <FeatureCard
              icon={svgs.ai}
              title="AI Fix Generation"
              body="A curated agent loop analyses WCAG failures, writes contextually correct patches, and rewrites them if axe-core validation fails — up to 3 times."
              accent="teal"
            />
            <FeatureCard
              icon={svgs.check}
              title="axe-core Verification"
              body="Before-and-after HTML fragments are rendered in an isolated Chromium and re-audited with axe-core. Fixes ship verified, not just guessed."
              accent="rose"
            />
            <FeatureCard
              icon={svgs.gov}
              title="Governance Audit"
              body="Every AI decision is written to an immutable log: reasoning, confidence, agent, and action. Roll back any applied fix with one click."
              accent="teal"
            />
            <FeatureCard
              icon={svgs.voice}
              title="Sarvam AI Assistant"
              body="Ask questions about regressions in 11 Indian languages via STT / TTS. The assistant has full context on your project, issues, and scores."
              accent="rose"
            />
            <FeatureCard
              icon={svgs.eye}
              title="Experience Mode Sandbox"
              body="Simulate screen readers, keyboard-only navigation, color blindness, and font scaling on any imported repo — for product managers & designers."
              accent="teal"
            />
          </div>
        </section>

        {/* ═══════════════════ Mutagent Pipeline ═══════════════════ */}
        <section id="how" className={styles.how} aria-labelledby="how-heading">
          <div className={styles.sectionLabel}>HOW IT WORKS</div>
          <h2 id="how-heading" className={styles.sectionTitle}>
            Powered by Mutagent Helix.
          </h2>
          <p className={styles.sectionSub}>
            Every accessibility fix runs through the full Agentic Development Lifecycle — spec, build, evaluate, diagnose, optimise, and governance.
          </p>

          <ol className={styles.stepList}>
            <Step
              n={1}
              title="SPEC — Requirements Interview"
              body="The agentspec skill interviews the developer, captures what the a11y issue IS, and emits a validated agentspec.yaml: persona, jobs-to-be-done, context sources, tools, decision modeling, and binary eval criteria."
            />
            <Step
              n={2}
              title="BUILD — Implement Fixes"
              body="ai-engineer implements the fix against the validated spec. ai-architect verifies the implementation. A TDD + coverage loop ensures correctness before the fix is accepted."
            />
            <Step
              n={3}
              title="EVALUATE — Judge Against Criteria"
              body="The evaluator builds trustworthy evals from real traces, mines binary success/failure criteria, and scores the fix to a clear gate verdict. Failures never get silently shipped."
            />
            <Step
              n={4}
              title="DIAGNOSE — Root Cause Analysis"
              body="When a fix fails evaluation, diagnostics reads real traces, pins down root causes, ranks candidate remedies, and routes the approved fix back to the builder."
            />
            <Step
              n={5}
              title="OPTIMIZE — Closed-Loop Improvement"
              body="A bounded eval-driven optimize loop: Build → Eval → Diagnose → Optimize ↻. The loop converges before any change is applied, with one explicit apply-gate at the end."
            />
            <Step
              n={6}
              title="GOVERNANCE — Immutable Audit Trail"
              body="Every AI decision is written to an immutable log: reasoning, confidence, agent, and action. Roll back any applied fix with one click. Full trust score and approval workflow."
            />
          </ol>

          <div className={styles.howCTA}>
            <Link href="/login" className={`${styles.cta} ${styles.ctaPrimary} ${styles.ctaLarge}`}>
              See the pipeline in action
            </Link>
          </div>
        </section>


        {/* ═══════════════════ FAQ ═══════════════════ */}
        <section id="faq" className={styles.faq} aria-labelledby="faq-heading">
          <div className={styles.sectionLabel}>FAQ</div>
          <h2 id="faq-heading" className={styles.sectionTitle}>
            Questions, answered.
          </h2>
          <div className={styles.faqGrid}>
            <Faq
              q="Will AccessDiff break my existing CI?"
              a="No. We ship as a GitHub Actions template you opt into. Commits are never force-pushed; all fixes land as new pull requests you review and merge like any other."
            />
            <Faq
              q="Does it only support React / Next.js?"
              a="It runs on any website whose code ships to the browser: React, Vue, Svelte, plain HTML. Fixes are generated as text diffs against your source files and verified on rendered DOM."
            />
            <Faq
              q="Who trains on my code?"
              a="Nobody. We never train our own models on customer repos. All analysis runs through the Groq inference platform under their enterprise privacy terms."
            />
            <Faq
              q="Is it WCAG 2.2 AA compliant?"
              a="Every axe-core rule is mapped to the WCAG 2.2 criteria it represents and linked to W3C Understanding pages in the issue detail view."
            />
          </div>
        </section>

        {/* ═══════════════════ Footer CTA ═══════════════════ */}
        <section className={styles.ctaBand}>
          <div className={styles.ctaBandInner}>
            <h2>Every PR. Every user. Every time.</h2>
            <p>
              Start shipping accessible software without slowing down your team.
            </p>
            <Link href="/login" className={`${styles.cta} ${styles.ctaPrimary} ${styles.ctaLarge}`}>
              Get AccessDiff — free forever for open source
            </Link>
          </div>
        </section>

        <footer className={styles.footer}>
          <div className={styles.footerInner}>
            <div>
              <span className={`${styles.brandText} ${styles.footerBrand}`}>
                Access<span className={styles.brandAccent}>Diff</span>
              </span>
              <p className={styles.footerTag}>AI accessibility engineering · Built in India</p>
            </div>
            <div className={styles.footerCols}>
              <div>
                <div className={styles.footerColTitle}>Product</div>
                <a href="#features">Features</a>
                <a href="#how">How it works</a>
                <a href="#pricing">Pricing</a>
              </div>
              <div>
                <div className={styles.footerColTitle}>Company</div>
                <a href="#faq">FAQ</a>
                <a href="/login">Sign in</a>
              </div>
              <div>
                <div className={styles.footerColTitle}>Legal</div>
                <a href="#" aria-label="Privacy policy">Privacy</a>
                <a href="#" aria-label="Terms of service">Terms</a>
                <a href="#" aria-label="Security information">Security</a>
              </div>
            </div>
          </div>
          <div className={styles.footerBottom}>
            © {new Date().getFullYear()} AccessDiff Labs. All rights reserved.
          </div>
        </footer>

        <LandingAnimations />
      </div>
    </>
  );
}

/* ─────── stateless sub-components ─────── */

type BadgeVariant = "critical" | "major" | "minor" | "advisory" | "green";

function Badge({ children, variant }: { children: ReactNode; variant: BadgeVariant }) {
  const clsMap: Record<BadgeVariant, string> = {
    critical: styles.miniBadgeCritical,
    major: styles.miniBadgeMajor,
    minor: styles.miniBadgeMinor,
    advisory: styles.miniBadgeAdvisory,
    green: styles.miniBadgeGreen,
  };
  return (
    <span
      className={`${styles.miniBadge} ${clsMap[variant]}`}
      role="status"
    >
      {children}
    </span>
  );
}

function FeatureCard({
  icon,
  title,
  body,
  accent,
}: {
  icon: string;
  title: string;
  body: string;
  accent: "rose" | "teal";
}) {
  const accentCls = accent === "rose" ? styles.featureIconRose : styles.featureIconTeal;
  return (
    <article className={styles.featureCard}>
      <div className={`${styles.featureIcon} ${accentCls}`}>
        <svg
          viewBox="0 0 24 24"
          width="24"
          height="24"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          dangerouslySetInnerHTML={{ __html: icon }}
        />
      </div>
      <h3>{title}</h3>
      <p>{body}</p>
    </article>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <li className={styles.stepItem}>
      <div className={styles.stepNum}>{n}</div>
      <div>
        <h3>{title}</h3>
        <p>{body}</p>
      </div>
    </li>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <details className={styles.faqItem}>
      <summary>{q}</summary>
      <p>{a}</p>
    </details>
  );
}

/* ─────── helper: icon SVG paths as strings (no inline style) ─────── */
function getIconSvgs(): Record<"diff" | "ai" | "check" | "gov" | "voice" | "eye", string> {
  return {
    diff:
      '<path d="M16 3h5v5"/><path d="M8 21H3v-5"/><path d="M21 3l-7.5 7.5"/><path d="M3 21l7.5-7.5"/>',
    ai: '<circle cx="12" cy="12" r="9"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>',
    check:
      '<circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/>',
    gov: '<path d="M3 10h18l-2 10H5z"/><path d="M5 10V7a7 7 0 0 1 14 0v3"/><line x1="12" y1="14" x2="12" y2="18"/>',
    voice:
      '<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/>',
    eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
  };
}
