import styles from "./loading.module.css";

export default function RootLoading() {
  return (
    <div
      className={styles.root}
      aria-busy="true"
      aria-live="polite"
    >
      <div className={styles.inner}>
        <div
          role="status"
          aria-label="Loading AccessDiff"
          className={styles.logo}
        />
        <div className={styles.barOuter}>
          <div className={styles.barInner} />
        </div>
      </div>
    </div>
  );
}
