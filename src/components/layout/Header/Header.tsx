"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui";
import styles from "./Header.module.css";

export interface Breadcrumb {
  label: string;
  href?: string;
}

export interface HeaderProps {
  breadcrumbs?: Breadcrumb[];
}

export default function Header({ breadcrumbs }: HeaderProps): ReactNode {
  const pathname = usePathname();

  // Generate fallback breadcrumbs from pathname if not provided
  const computedCrumbs = breadcrumbs ?? (() => {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length === 0) return [{ label: "Dashboard", href: "/dashboard" }];
    return segments.map((seg, idx) => {
      const href = "/" + segments.slice(0, idx + 1).join("/");
      const label = seg.charAt(0).toUpperCase() + seg.slice(1);
      return { label, href };
    });
  })();

  return (
    <header className={styles.header}>
      <nav aria-label="Breadcrumb" className={styles.breadcrumbs}>
        <ol style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", listStyle: "none" }}>
          {computedCrumbs.map((crumb, idx) => {
            const isLast = idx === computedCrumbs.length - 1;
            return (
              <li key={idx} style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                {idx > 0 && <span className={styles.separator}>/</span>}
                {isLast || !crumb.href ? (
                  <span className={styles.crumbActive} aria-current={isLast ? "page" : undefined}>
                    {crumb.label}
                  </span>
                ) : (
                  <Link href={crumb.href} className={styles.crumbItem}>
                    {crumb.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      <div className={styles.actions}>
        <Badge variant="success" size="sm" showDot>
          System Ready
        </Badge>
      </div>
    </header>
  );
}
