import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="landingRoot" aria-label="AccessDiff marketing landing">
      {/* ═══════════════════ Hero ═══════════════════ */}
      <header className="nav">
        <div className="navInner">
          <Link href="/" className="brand" aria-label="AccessDiff home">
            <span className="brandMark" aria-hidden="true">
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
            <span className="brandText">
              Access<span className="brandAccent">Diff</span>
            </span>
          </Link>

          <nav className="navLinks" aria-label="Primary">
            <a href="#features">Features</a>
            <a href="#how">How it works</a>
            <a href="#pricing">Pricing</a>
            <a href="#faq">FAQ</a>
          </nav>

          <div className="navCTA">
            <Link href="/login" className="cta ctaGhost">
              Sign in
            </Link>
            <Link href="/login" className="cta ctaPrimary">
              Get started — free
            </Link>
          </div>
        </div>
      </header>

      {/* ═══════════════════ Hero headline ═══════════════════ */}
      <section className="hero" id="top">
        <div className="heroBadge" aria-hidden="true">
          <span className="dot" />
          Powered by Groq · Sarvam · Mutagent Helix · axe-core
        </div>

        <h1 className="heroTitle">
          Catch accessibility regressions.
          <br />
          <span className="heroAccent">Before they ship to users.</span>
        </h1>

        <p className="heroSub">
          AccessDiff runs WCAG 2.2 audits <em>only on newly added code</em> in every
          pull request — no noise from legacy issues. AI generates human-reviewed
          patches, verifies them with axe-core in Chromium, and opens PRs with
          full governance audit trails.
        </p>

        <div className="heroCTA">
          <Link href="/login" className="cta ctaPrimary ctaLarge">
            Start auditing your repo
          </Link>
          <a href="#how" className="cta ctaSecondary ctaLarge">
            Watch 90-second demo →
          </a>
        </div>

        {/* Hero preview card */}
        <div
          className="heroPreview"
          role="img"
          aria-label="Screenshot preview: AccessDiff pipeline showing 7 accessibility issues caught in a pull request"
        >
          <div className="previewHeader">
            <div className="previewDots" aria-hidden="true">
              <span /> <span /> <span />
            </div>
            <span className="previewTitle">
              github.com/acme/website — PR #424
            </span>
            <div className="previewBadge green">
              AccessDiff: 7 issues · 7 verified fixes
            </div>
          </div>
          <div className="previewBody">
            <div className="previewScore">
              <div className="scoreRing" aria-hidden="true">
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
                <div className="scoreText">
                  <div className="scoreNum">85</div>
                  <div className="scoreLabel">/100</div>
                </div>
              </div>
              <div className="scoreMeta">
                <h3>Accessibility Compliance</h3>
                <div className="scoreRow"><span>Critical</span><Badge color="critical">1</Badge></div>
                <div className="scoreRow"><span>Major</span><Badge color="major">2</Badge></div>
                <div className="scoreRow"><span>Minor</span><Badge color="minor">3</Badge></div>
                <div className="scoreRow"><span>Advisory</span><Badge color="advisory">1</Badge></div>
              </div>
            </div>
            <div className="previewDiffs">
              {[
                { file: "src/components/Checkout.tsx", issue: "Missing `aria-label` on icon button", sev: "Major" },
                { file: "src/components/Hero.tsx", issue: "Image missing `alt` text", sev: "Critical" },
                { file: "src/app/shop/page.tsx", issue: "Color contrast 2.9:1 < 4.5:1", sev: "Minor" },
              ].map((row, i) => (
                <div key={i} className="diffRow">
                  <Badge
                    color={
                      (row.sev.toLowerCase() as unknown) as
                        | "critical"
                        | "major"
                        | "minor"
                        | "advisory"
                    }
                  >
                    {row.sev}
                  </Badge>
                  <span className="diffFile">{row.file}</span>
                  <span className="diffIssue">{row.issue}</span>
                  <span className="diffFix">✓ AI fix verified</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ Feature logos ═══════════════════ */}
      <section className="logoStrip" aria-label="Trusted by teams using">
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
      <section id="features" className="features" aria-labelledby="features-heading">
        <div className="sectionLabel">FEATURES</div>
        <h2 id="features-heading" className="sectionTitle">
          The engineering-grade a11y platform.
        </h2>
        <p className="sectionSub">
          Every step of the accessibility loop — detection, explanation, remediation,
          verification, and approval — run by AI agents with full audit trails.
        </p>

        <div className="featureGrid">
          <FeatureCard
            icon="diff"
            title="Regression-Only Scanning"
            body="We only audit the added lines of your diff. No more 400-issue reports full of pre-existing debt. Every result is newly introduced."
            accent="rose"
          />
          <FeatureCard
            icon="ai"
            title="AI Fix Generation"
            body="A curated agent loop analyses WCAG failures, writes contextually correct patches, and rewrites them if axe-core validation fails — up to 3 times."
            accent="teal"
          />
          <FeatureCard
            icon="check"
            title="axe-core Verification"
            body="Before-and-after HTML fragments are rendered in an isolated Chromium and re-audited with axe-core. Fixes ship verified, not just guessed."
            accent="rose"
          />
          <FeatureCard
            icon="gov"
            title="Governance Audit"
            body="Every AI decision is written to an immutable log: reasoning, confidence, agent, and action. Roll back any applied fix with one click."
            accent="teal"
          />
          <FeatureCard
            icon="voice"
            title="Sarvam AI Assistant"
            body="Ask questions about regressions in 11 Indian languages via STT / TTS. The assistant has full context on your project, issues, and scores."
            accent="rose"
          />
          <FeatureCard
            icon="eye"
            title="Experience Mode Sandbox"
            body="Simulate screen readers, keyboard-only navigation, color blindness, and font scaling on any imported repo — for product managers & designers."
            accent="teal"
          />
        </div>
      </section>

      {/* ═══════════════════ How it works ═══════════════════ */}
      <section id="how" className="how" aria-labelledby="how-heading">
        <div className="sectionLabel">HOW IT WORKS</div>
        <h2 id="how-heading" className="sectionTitle">
          Three steps. Zero configuration.
        </h2>

        <ol className="stepList">
          <Step
            n={1}
            title="Connect your GitHub repo"
            body="OAuth in one click. AccessDiff indexes your commit history and runs an initial repository-wide risk audit using the RepositoryAgent."
          />
          <Step
            n={2}
            title="Pick a commit range and run"
            body="Choose any two commits or open a PR. The pipeline runs axe-core on diffed lines → AI fixes → 3-round verification loop → optional approval."
          />
          <Step
            n={3}
            title="Review, approve, ship"
            body="Low-risk fixes can be auto-approved. Everything else lands in your inbox with WCAG references, diffs, and trust scores. One click opens a GitHub PR."
          />
        </ol>

        <div className="howCTA">
          <Link href="/login" className="cta ctaPrimary ctaLarge">
            Run your first audit — 60 seconds
          </Link>
        </div>
      </section>

      {/* ═══════════════════ Pricing ═══════════════════ */}
      <section id="pricing" className="pricing" aria-labelledby="pricing-heading">
        <div className="sectionLabel">PRICING</div>
        <h2 id="pricing-heading" className="sectionTitle">
          Simple pricing. Everything a team needs.
        </h2>

        <div className="pricingGrid">
          <PriceCard
            name="Starter"
            price="Free"
            sub="For solo devs & OSS maintainers"
            features={[
              "3 repos",
              "100 pipeline runs / month",
              "Unlimited AI fixes",
              "axe-core verification",
              "Full governance logs",
            ]}
            cta="Start free"
            ctaHref="/login"
            featured={false}
          />
          <PriceCard
            name="Pro"
            price="$29"
            sub="per seat / month"
            features={[
              "Unlimited repos",
              "3,000 pipeline runs / month",
              "Sarvam voice assistant (11 languages)",
              "Priority agent queue",
              "GitHub webhooks & CI integration",
              "SSO (SAML) coming soon",
            ]}
            cta="Start 14-day trial"
            ctaHref="/login"
            featured
          />
          <PriceCard
            name="Enterprise"
            price="Custom"
            sub="Security, SLAs, on-prem support"
            features={[
              "Everything in Pro",
              "VPC peering & dedicated agents",
              "99.9% uptime SLA",
              "SOC 2 Type II",
              "Solution architect support",
              "Custom audit integrations",
            ]}
            cta="Talk to sales"
            ctaHref="mailto:hello@accessdiff.dev"
            featured={false}
          />
        </div>
      </section>

      {/* ═══════════════════ FAQ ═══════════════════ */}
      <section id="faq" className="faq" aria-labelledby="faq-heading">
        <div className="sectionLabel">FAQ</div>
        <h2 id="faq-heading" className="sectionTitle">
          Questions, answered.
        </h2>
        <div className="faqGrid">
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
      <section className="ctaBand">
        <div className="ctaBandInner">
          <h2>Every PR. Every user. Every time.</h2>
          <p>
            Start shipping accessible software without slowing down your team.
          </p>
          <Link href="/login" className="cta ctaPrimary ctaLarge">
            Get AccessDiff — free forever for open source
          </Link>
        </div>
      </section>

      <footer className="footer">
        <div className="footerInner">
          <div>
            <div className="brandText" style={{ marginBottom: "0.5rem" }}>
              Access<span className="brandAccent">Diff</span>
            </div>
            <p className="footerTag">AI accessibility engineering · Built in India</p>
          </div>
          <div className="footerCols">
            <div>
              <div className="footerColTitle">Product</div>
              <a href="#features">Features</a>
              <a href="#how">How it works</a>
              <a href="#pricing">Pricing</a>
            </div>
            <div>
              <div className="footerColTitle">Company</div>
              <a href="#faq">FAQ</a>
              <a href="/login">Sign in</a>
            </div>
            <div>
              <div className="footerColTitle">Legal</div>
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
              <a href="#">Security</a>
            </div>
          </div>
        </div>
        <div className="footerBottom">
          © {new Date().getFullYear()} AccessDiff Labs. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

/* ─────── inline stateless components ─────── */

function Badge({
  children,
  color,
}: {
  children: React.ReactNode;
  color: "critical" | "major" | "minor" | "advisory" | "green";
}) {
  const palette: Record<Badge["color"], string> = {
    critical: "background:hsl(350,70%,50%); color:#fff;",
    major: "background:hsl(20,80%,52%); color:#fff;",
    minor: "background:hsl(38,85%,52%); color:#fff;",
    advisory: "background:hsl(176,52%,42%); color:#fff;",
    green: "background:hsl(148,50%,40%); color:#fff;",
  };
  return (
    <span
      className="miniBadge"
      style={palette[color]}
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
  icon: "diff" | "ai" | "check" | "gov" | "voice" | "eye";
  title: string;
  body: string;
  accent: "rose" | "teal";
}) {
  const icons: Record<FeatureCard["icon"], string> = {
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
  const ring =
    accent === "rose"
      ? "background:linear-gradient(135deg, hsl(12,76%,58%), hsl(12,80%,70%));"
      : "background:linear-gradient(135deg, hsl(176,52%,42%), hsl(176,52%,60%));";
  return (
    <article className="featureCard">
      <div className="featureIcon" style={ring}>
        <svg
          viewBox="0 0 24 24"
          width="24"
          height="24"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          dangerouslySetInnerHTML={{ __html: icons[icon] }}
        />
      </div>
      <h3>{title}</h3>
      <p>{body}</p>
    </article>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <li className="stepItem">
      <div className="stepNum">{n}</div>
      <div>
        <h3>{title}</h3>
        <p>{body}</p>
      </div>
    </li>
  );
}

function PriceCard({
  name,
  price,
  sub,
  features,
  cta,
  ctaHref,
  featured,
}: {
  name: string;
  price: string;
  sub: string;
  features: string[];
  cta: string;
  ctaHref: string;
  featured: boolean;
}) {
  return (
    <article className={`priceCard ${featured ? "priceFeatured" : ""}`}>
      {featured ? <div className="priceRibbon">Most popular</div> : null}
      <h3>{name}</h3>
      <div className="priceAmount">{price}</div>
      <div className="priceSub">{sub}</div>
      <ul className="priceFeatures">
        {features.map((f) => (
          <li key={f}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="hsl(148,50%,40%)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {f}
          </li>
        ))}
      </ul>
      <Link
        href={ctaHref}
        className={`cta ${featured ? "ctaPrimary" : "ctaSecondary"} ctaBlock`}
      >
        {cta}
      </Link>
    </article>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <details className="faqItem">
      <summary>{q}</summary>
      <p>{a}</p>
    </details>
  );
}
