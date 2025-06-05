// app/page.js
import Link from "next/link";

export default function Home() {
  return (
    <div>
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
