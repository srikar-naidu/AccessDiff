import Link from "next/link";
import styles from "./not-found.module.css";

export default function NotFound() {
  return (
    <div className={styles.root}>
      <div className={styles.card} role="alert">
        <div className={styles.code}>404</div>
        <h1 className={styles.heading}>This page sailed off the map</h1>
        <p className={styles.text}>
          The link might be broken or the page may have moved. Let&apos;s get you back to
          familiar waters.
        </p>
        <div className={styles.actions}>
          <Link href="/" className={styles.linkPrimary}>
            Go home
          </Link>
          <Link href="/dashboard" className={styles.linkSecondary}>
            Open dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
