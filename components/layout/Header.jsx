// components/layout/Header.jsx
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import styles from "./Header.module.css";

export default function Header() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);
    };

    getSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading) {
    return (
      <header className={styles.header}>
        <div className={styles.container}>
          <Link href="/" className={styles.logo}>
            <img
              src="/logo.svg"
              alt="Iona Language App"
              className={styles.logoImage}
            />
            Iona Language App
          </Link>
          <nav className={styles.nav}>
            <div className={styles.loading}>Loading...</div>
          </nav>
        </div>
      </header>
    );
  }

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          <img
            src="/logo.svg"
            alt="Iona Language App"
            className={styles.logoImage}
          />
          Iona Language App
        </Link>
        <nav className={styles.nav}>
          {user ? (
            <>
              <Link
                href="/lessons"
                className={styles.navLink}
              >
                Lessons
              </Link>
              <Link href="/account" className={styles.navLink}>
                Account
              </Link>
              <button onClick={handleLogout} className={styles.logoutButton}>
                Logout
              </button>
            </>
          ) : (
            <Link href="/login" className={styles.navLink}>
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}