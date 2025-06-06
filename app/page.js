// app/page.js
import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div
      className={styles.page}
      style={{
        backgroundImage: `linear-gradient(135deg, rgba(15, 23, 42, 0.3) 0%, rgba(30, 41, 59, 0.3) 50%, rgba(51, 65, 85, 0.3) 100%), url('/wallpaper.png')`, // ← Changed opacity from 0.85 to 0.3
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <h1>Welcome to the Language Course</h1>
      <Link href="/lessons/001">
        <button
          style={{ padding: "8px 16px", background: "#0070f3", color: "white" }}
        >
          Start Lesson 1
        </button>
      </Link>
    </div>
  );
}
