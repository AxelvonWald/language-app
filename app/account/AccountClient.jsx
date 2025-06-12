// app/account/AccountClient.jsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import styles from "./Account.module.css";

export default function AccountClient() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Form states
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetEmail, setResetEmail] = useState("");

  // Loading states
  const [emailLoading, setEmailLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    getUser();
  }, []);

  const getUser = async () => {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error) throw error;

      if (!user) {
        router.push("/login");
        return;
      }

      setUser(user);
      setNewEmail(user.email || "");
      setResetEmail(user.email || "");
    } catch (error) {
      console.error("Error getting user:", error);
      setError("Failed to load user data");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = async (e) => {
    e.preventDefault();
    if (!newEmail || newEmail === user?.email) return;

    setEmailLoading(true);
    setMessage("");
    setError("");

    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail,
      });

      if (error) throw error;

      setMessage(
        "Confirmation email sent to your new address. Please check your inbox and click the confirmation link."
      );
    } catch (error) {
      setError(error.message);
    } finally {
      setEmailLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setPasswordLoading(true);
    setMessage("");
    setError("");

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setMessage("Password updated successfully!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setError(error.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (!resetEmail) return;

    setResetLoading(true);
    setMessage("");
    setError("");

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setMessage("Password reset email sent! Please check your inbox.");
    } catch (error) {
      setError(error.message);
    } finally {
      setResetLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push("/login");
    } catch (error) {
      setError("Error signing out");
    }
  };

  if (loading) {
    return null;
  }
  
  return (
    <div className={styles.accountContainer}>
      <div className={styles.accountHeader}>
        <h1>Account Settings</h1>
        <p>Manage your profile and account preferences</p>
      </div>

      {/* Messages */}
      {message && <div className={styles.successMessage}>{message}</div>}

      {error && <div className={styles.errorMessage}>{error}</div>}

      {/* Current User Info */}
      <div className={styles.section}>
        <h2>Current Account</h2>
        <div className={styles.userInfo}>
          <p>
            <strong>Email:</strong> {user?.email}
          </p>
          <p>
            <strong>Account Created:</strong>{" "}
            {new Date(user?.created_at).toLocaleDateString()}
          </p>
          <p>
            <strong>Last Sign In:</strong>{" "}
            {user?.last_sign_in_at
              ? new Date(user.last_sign_in_at).toLocaleDateString()
              : "Never"}
          </p>
        </div>
      </div>

      {/* Change Email */}
      <div className={styles.section}>
        <h2>Change Email Address</h2>
        <form onSubmit={handleEmailChange} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="newEmail">New Email Address</label>
            <input
              type="email"
              id="newEmail"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Enter new email address"
              required
            />
          </div>
          <button
            type="submit"
            disabled={emailLoading || !newEmail || newEmail === user?.email}
            className={styles.button}
          >
            {emailLoading ? "Sending..." : "Update Email"}
          </button>
          <p className={styles.helpText}>
            You'll receive a confirmation email at your new address.
          </p>
        </form>
      </div>

      {/* Change Password */}
      <div className={styles.section}>
        <h2>Change Password</h2>
        <form onSubmit={handlePasswordChange} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="newPassword">New Password</label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              minLength="6"
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              minLength="6"
              required
            />
          </div>
          <button
            type="submit"
            disabled={passwordLoading || !newPassword || !confirmPassword}
            className={styles.button}
          >
            {passwordLoading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>

      {/* Password Reset */}
      <div className={styles.section}>
        <h2>Send Password Reset Email</h2>
        <p className={styles.sectionDescription}>
          Forgot your current password? Send yourself a password reset email.
        </p>
        <form onSubmit={handlePasswordReset} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="resetEmail">Email Address</label>
            <input
              type="email"
              id="resetEmail"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              placeholder="Enter email address"
              required
            />
          </div>
          <button
            type="submit"
            disabled={resetLoading || !resetEmail}
            className={`${styles.button} ${styles.secondaryButton}`}
          >
            {resetLoading ? "Sending..." : "Send Reset Email"}
          </button>
        </form>
      </div>

      {/* Sign Out */}
      <div className={styles.section}>
        <h2>Sign Out</h2>
        <p className={styles.sectionDescription}>
          Sign out of your account on this device.
        </p>
        <button
          onClick={handleSignOut}
          className={`${styles.button} ${styles.dangerButton}`}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
