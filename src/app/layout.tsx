import type { Metadata, Viewport } from "next";
import { Fraunces, Instrument_Sans, JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

/* Premium Pearl Soft Glass typography stack:
   Fraunces = optical-sized serif display (headings, luxe editorial)
   Instrument_Sans = distinctive body sans (NOT generic Inter)
   JetBrains_Mono = code
   Plus_Jakarta_Sans retained for any existing UI usage
*/
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  weight: "variable",    /* axes require weight=variable to enable full optical range */
  axes: ["opsz"],
  style: ["normal", "italic"],
});

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://accessdiff.dev"),
  title: {
    default: "AccessDiff — AI Accessibility Copilot for GitHub",
    template: "%s · AccessDiff",
  },
  description:
    "AI-powered Accessibility Engineering Platform that performs Accessibility Regression Analysis on GitHub repositories. Detect only newly introduced WCAG 2.2 accessibility issues. AI-generated, axe-core verified patches shipped as PRs.",
  keywords: [
    "accessibility",
    "WCAG 2.2",
    "GitHub",
    "AI",
    "regression analysis",
    "a11y",
    "axe-core",
    "web accessibility",
    "automated a11y testing",
    "Sarvam AI",
    "Groq",
    "Mutagent Helix",
  ],
  authors: [{ name: "AccessDiff Labs", url: "https://accessdiff.dev" }],
  creator: "AccessDiff Labs",
  publisher: "AccessDiff Labs",
  applicationName: "AccessDiff",
  category: "technology",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: process.env.NEXT_PUBLIC_APP_URL ?? "https://accessdiff.dev",
    siteName: "AccessDiff",
    title: "AccessDiff — AI Accessibility Copilot for GitHub",
    description:
      "Regression-only WCAG 2.2 audits, AI-generated patches, axe-core verification, immutable governance logs, and a Sarvam voice assistant in 11 Indian languages.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "AccessDiff — AI Accessibility Copilot",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AccessDiff — AI Accessibility Copilot for GitHub",
    description:
      "Regression-only WCAG 2.2 audits, AI-generated patches, axe-core verification, immutable governance logs, voice assistant in 11 Indian languages.",
    creator: "@accessdiff",
    images: ["/og-image.png"],
  },
  icons: { icon: "/logo.png", shortcut: "/logo.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "hsl(220, 45%, 97%)" },
    { media: "(prefers-color-scheme: dark)", color: "hsl(222, 28%, 12%)" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${instrumentSans.variable} ${plusJakartaSans.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        <a href="#main-content" className="skip-to-main">
          Skip to main content
        </a>
        <main id="main-content">{children}</main>
      </body>
    </html>
  );
}
