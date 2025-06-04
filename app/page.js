// app/page.js
import Link from 'next/link';

export default function Home() {
  return (
    <div>
      <h1>Welcome to the Language App</h1>
      <Link href="/lessons/001">Go to Lesson 1</Link>
    </div>
  );
}