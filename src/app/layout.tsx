import type { Metadata } from "next";
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
  title: "AccessDiff — AI Accessibility Copilot for GitHub",
  description:
    "AI-powered Accessibility Engineering Platform that performs Accessibility Regression Analysis on GitHub repositories. Detect only newly introduced accessibility issues.",
  keywords: [
    "accessibility",
    "WCAG",
    "GitHub",
    "AI",
    "regression analysis",
    "a11y",
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
