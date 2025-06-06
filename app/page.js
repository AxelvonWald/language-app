// app/page.js
import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.hero}>
          <h1 className={styles.title}>Welcome to Language Learning</h1>
          <p className={styles.subtitle}>
            Master Spanish with our comprehensive A1 course. Learn at your own pace with personalized lessons designed just for you.
          </p>
          
          <div className={styles.cta}>
            <Link href="/lessons/1" className={styles.primaryButton}>
              Start Learning
            </Link>
            <Link href="/account" className={styles.secondaryButton}>
              My Account
            </Link>
          </div>
        </div>

        <div className={styles.features}>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>📚</div>
            <h3 className={styles.featureTitle}>32 Comprehensive Lessons</h3>
            <p className={styles.featureDescription}>
              Structured A1 curriculum covering all essential Spanish fundamentals
            </p>
          </div>
          
          <div className={styles.feature}>
            <div className={styles.featureIcon}>🎯</div>
            <h3 className={styles.featureTitle}>Personalized Learning</h3>
            <p className={styles.featureDescription}>
              Lessons adapt to your interests, job, and personal details
            </p>
          </div>
          
          <div className={styles.feature}>
            <div className={styles.featureIcon}>🔊</div>
            <h3 className={styles.featureTitle}>Audio Practice</h3>
            <p className={styles.featureDescription}>
              Listen, repeat, and perfect your pronunciation with native audio
            </p>
          </div>
        </div>
      </main>

      <footer className={styles.footer}>
        <Link href="/about">About</Link>
        <Link href="/contact">Contact</Link>
        <Link href="/privacy">Privacy</Link>
      </footer>
    </div>
  );
}