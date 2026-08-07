"use client";

import { useEffect, useRef } from "react";

type Raf = number | null;

export default function LandingAnimations() {
  const rafRef = useRef<Raf>(null);
  const lenisRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    let lenis: any = null;
    let cleanup: Array<() => void> = [];

    async function boot() {
      if (typeof window === "undefined" || cancelled) return;

      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
      const reduced = reduce.matches;

      try {
        const [{ gsap }, { ScrollTrigger }] = await Promise.all([
          import("gsap"),
          import("gsap/ScrollTrigger"),
        ]);
        if (cancelled) return;

        gsap.registerPlugin(ScrollTrigger);

        if (!reduced && typeof window !== "undefined") {
          try {
            const Lenis = (await import("lenis")).default;
            lenis = new Lenis({
              duration: 1.15,
              smoothWheel: true,
              lerp: 0.12,
            });
            lenisRef.current = lenis;

            const tick = (t: number) => {
              lenis?.raf?.(t);
              rafRef.current = requestAnimationFrame(tick);
            };
            rafRef.current = requestAnimationFrame(tick);

            lenis.on("scroll", () => ScrollTrigger.update());
            cleanup.push(() => {
              if (rafRef.current) cancelAnimationFrame(rafRef.current);
              lenis?.destroy?.();
              lenisRef.current = null;
              rafRef.current = null;
            });
          } catch (err) {
            console.warn("[LandingAnimations] Lenis init failed, falling back.", err);
          }
        }

        if (cancelled) return;

        const host = document;

        const heroAnchors = host.querySelectorAll<HTMLElement>(
          "section[class*='hero'], header[class*='nav']"
        );
        heroAnchors.forEach((el) => {
          gsap.from(Array.from(el.children), {
            y: 28,
            opacity: 0,
            duration: 0.7,
            stagger: 0.07,
            ease: "power3.out",
          });
        });

        const featureCards = host.querySelectorAll<HTMLElement>(
          "article[class*='featureCard'], [class*='feature'] article, [class*='featureGrid'] > *"
        );
        featureCards.forEach((el, i) => {
          gsap.from(el, {
            y: 48,
            opacity: 0,
            duration: 0.65,
            delay: (i % 6) * 0.05,
            ease: "power3.out",
            scrollTrigger: {
              trigger: el,
              start: "top 88%",
              toggleActions: "play none none reverse",
            },
          });
        });

        const stepItems = host.querySelectorAll<HTMLElement>(
          "ol[class*='stepList'] > li, li[class*='stepItem']"
        );
        stepItems.forEach((el, i) => {
          gsap.from(el, {
            x: i % 2 === 0 ? -40 : 40,
            opacity: 0,
            duration: 0.7,
            ease: "power3.out",
            scrollTrigger: {
              trigger: el,
              start: "top 88%",
              toggleActions: "play none none reverse",
            },
          });
        });

        const priceCards = host.querySelectorAll<HTMLElement>(
          "article[class*='priceCard'], [class*='pricingGrid'] > article"
        );
        priceCards.forEach((el, i) => {
          gsap.from(el, {
            y: 60,
            opacity: 0,
            duration: 0.7,
            delay: i * 0.1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: el.parentElement ?? el,
              start: "top 85%",
              toggleActions: "play none none reverse",
            },
          });
        });

        const faqItems = host.querySelectorAll<HTMLElement>(
          "details[class*='faqItem'], [class*='faqGrid'] > details"
        );
        faqItems.forEach((el, i) => {
          gsap.from(el, {
            y: 30,
            opacity: 0,
            duration: 0.55,
            delay: i * 0.06,
            ease: "power2.out",
            scrollTrigger: {
              trigger: el,
              start: "top 90%",
              toggleActions: "play none none reverse",
            },
          });
        });
      } catch (e) {
        console.warn("[LandingAnimations] skipping animations.", e);
      }
    }

    boot();

    return () => {
      cancelled = true;
      cleanup.forEach((fn) => fn());
    };
  }, []);

  return null;
}
