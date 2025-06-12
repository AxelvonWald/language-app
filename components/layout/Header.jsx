// components/layout/Header.jsx
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useProgress } from "@/hooks/useProgress"; // NEW
import { supabase } from "../../lib/supabase";
import styles from "./Header.module.css";

export default function Header() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // NEW: Get personalization status from useProgress hook
  const { 
    getPersonalizationStatusInfo, 
    personalizationStatus,
    loadPersonalizationStatus 
  } = useProgress();

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

  // NEW: Handle notification click to refresh status
  const handleNotificationClick = async () => {
    if (user && loadPersonalizationStatus) {
      await loadPersonalizationStatus(user.id);
    }
  };

  // NEW: Get notification info
  const getNotificationInfo = () => {
    if (!user || !personalizationStatus) return null;
    
    const statusInfo = getPersonalizationStatusInfo && getPersonalizationStatusInfo();
    if (!statusInfo || statusInfo.canProceed) return null;
    
    return {
      message: personalizationStatus === 'processing' 
        ? "⏳ Processing your personalized content..." 
        : "⏳ Preparing your personalized content...",
      type: personalizationStatus
    };
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

  const notificationInfo = getNotificationInfo();

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

        {/* NEW: Personalization status notification */}
        {notificationInfo && (
          <div 
            className={`${styles.notification} ${styles[notificationInfo.type]}`}
            onClick={handleNotificationClick}
            title="Click to refresh status"
          >
            {notificationInfo.message}
          </div>
        )}

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