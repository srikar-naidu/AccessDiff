import styles from "./loading.module.css";

export default function DashboardLoading() {
  return (
    <div className={styles.root} aria-busy="true" aria-live="polite">
      <div className={styles.head}>
        <div className={styles.titleSkel} />
        <div className={styles.subSkel} />
      </div>

      <div className={styles.stats}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={styles.statCard}>
            <div className={styles.statLabelSkel} />
            <div className={styles.statValueSkel} />
            <div className={styles.statSparkSkel} />
          </div>
        ))}
      </div>

      <div className={styles.panel}>
        <div className={styles.panelHeadSkel} />
        <div className={styles.rows}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={styles.rowSkel} />
          ))}
        </div>
      </div>
    </div>
  );
}
