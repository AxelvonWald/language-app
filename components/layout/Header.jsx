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
  const [theme, setTheme] = useState('dark');
  const [mounted, setMounted] = useState(false);
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

  // Theme logic
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    setMounted(true);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

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
              <Link href="/lessons" className={styles.navLink}>
                Lessons
              </Link>
              <Link href="/listen" className={styles.navLink}>
                Listen
              </Link>
              <Link href="/account" className={styles.navLink}>
                Account
              </Link>
              {mounted && (
                <button 
                  onClick={toggleTheme}
                  className={styles.themeToggle}
                  title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
                >
                  {theme === 'dark' ? '◐' : '◑'}
                </button>
              )}
              <button onClick={handleLogout} className={styles.logoutButton}>
                Logout
              </button>
            </>
          ) : (
            <>
              {mounted && (
                <button 
                  onClick={toggleTheme}
                  className={styles.themeToggle}
                  title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
                >
                  {theme === 'dark' ? '◐' : '◑'}
                </button>
              )}
              <Link href="/login" className={styles.navLink}>
                Login
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}