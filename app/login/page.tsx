"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "../context/AppContext";
import Link from "next/link";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, currentUser, isLoading } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && currentUser) {
      router.push("/dashboard/tasks");
    }
  }, [currentUser, isLoading, router]);

  if (isLoading || currentUser) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await login(username, password);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '1rem' }}>
      <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ color: 'var(--primary-color)', fontSize: '2rem', marginBottom: '0.5rem' }}>Richsoon</h1>
          <p style={{ color: 'var(--text-muted)' }}>Sign in to manage tasks and users</p>
        </div>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label htmlFor="username" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label htmlFor="password" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              disabled={isSubmitting}
            />
          </div>
          
          <button 
            type="submit" 
            className={`btn btn-primary ${isSubmitting ? 'btn-loading' : ''}`}
            style={{ width: '100%', padding: '0.875rem', gap: '0.5rem' }}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
        
        <div style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Don't have an account? <Link href="/register" style={{ fontWeight: 500 }}>Register here</Link>
        </div>
      </div>
    </div>
  );
}
