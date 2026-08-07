import Script from "next/script";

const SOFTWARE_APP = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "AccessDiff",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Web",
  description:
    "AI-powered accessibility regression detection that scans only newly changed lines in git diffs for WCAG 2.2 violations, generates verified fixes, and ships them as auditable pull requests.",
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    ratingCount: "124",
  },
  offers: [
    {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      name: "Starter",
      description: "For solo devs and OSS maintainers",
    },
    {
      "@type": "Offer",
      price: "29",
      priceCurrency: "USD",
      name: "Pro",
      description: "per seat / month",
    },
  ],
  featureList: [
    "Regression-only accessibility scanning on git diff lines",
    "WCAG 2.2 AA audit via axe-core + Playwright Chromium",
    "AI fix generation with 3-round verification loop",
    "Immutable governance audit log with one-click rollback",
    "Sarvam AI voice assistant in 11 Indian languages",
    "Experience Mode: screen reader, color-blind and keyboard simulations",
    "GitHub Actions CI/CD integration with configurable thresholds",
  ],
  softwareVersion: "1.0.0",
  keywords:
    "accessibility, wcag, wcag 2.2, axe-core, github, pull request, regression, a11y, india, groq, sarvam, playwright, ai fix, linter, developer tools",
};

const ORG = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "AccessDiff Labs",
  url: "https://accessdiff.dev",
  logo: "https://accessdiff.dev/og-image.png",
  sameAs: [
    "https://github.com/accessdiff",
    "https://twitter.com/accessdiff",
    "https://in.linkedin.com/company/accessdiff",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    email: "hello@accessdiff.dev",
    contactType: "sales",
    availableLanguage: ["en", "hi", "ta", "te", "mr", "bn", "gu", "kn", "ml", "pa", "ur"],
  },
};

const FAQ = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Will AccessDiff break my existing CI?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. We ship as a GitHub Actions template you opt into. Commits are never force-pushed; all fixes land as new pull requests you review and merge like any other.",
      },
    },
    {
      "@type": "Question",
      name: "Does it only support React / Next.js?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "It runs on any website whose code ships to the browser: React, Vue, Svelte, plain HTML. Fixes are generated as text diffs against your source files and verified on rendered DOM.",
      },
    },
    {
      "@type": "Question",
      name: "Who trains on my code?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Nobody. We never train our own models on customer repos. All analysis runs through the Groq inference platform under their enterprise privacy terms.",
      },
    },
    {
      "@type": "Question",
      name: "Is it WCAG 2.2 AA compliant?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Every axe-core rule is mapped to the WCAG 2.2 criteria it represents and linked to W3C Understanding pages in the issue detail view.",
      },
    },
  ],
};

const HOWTO = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "Run your first AccessDiff audit",
  description:
    "Three zero-configuration steps to run a WCAG 2.2 regression audit and get verified AI fixes.",
  totalTime: "PT60S",
  step: [
    {
      "@type": "HowToStep",
      position: 1,
      name: "Connect your GitHub repo",
      text: "OAuth in one click. AccessDiff indexes your commit history and runs an initial repository-wide risk audit using the RepositoryAgent.",
    },
    {
      "@type": "HowToStep",
      position: 2,
      name: "Pick a commit range and run",
      text: "Choose any two commits or open a PR. The pipeline runs axe-core on diffed lines → AI fixes → 3-round verification loop → optional approval.",
    },
    {
      "@type": "HowToStep",
      position: 3,
      name: "Review, approve, ship",
      text: "Low-risk fixes can be auto-approved. Everything else lands in your inbox with WCAG references, diffs, and trust scores. One click opens a GitHub PR.",
    },
  ],
};

export default function JsonLdSeo() {
  return (
    <>
      <Script id="schema-software-app" type="application/ld+json" strategy="beforeInteractive">
        {JSON.stringify(SOFTWARE_APP)}
      </Script>
      <Script id="schema-organization" type="application/ld+json" strategy="beforeInteractive">
        {JSON.stringify(ORG)}
      </Script>
      <Script id="schema-faq" type="application/ld+json" strategy="afterInteractive">
        {JSON.stringify(FAQ)}
      </Script>
      <Script id="schema-howto" type="application/ld+json" strategy="afterInteractive">
        {JSON.stringify(HOWTO)}
      </Script>
    </>
  );
}
