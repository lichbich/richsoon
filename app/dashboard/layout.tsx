"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppContext } from "../context/AppContext";
import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentUser, logout } = useAppContext();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!currentUser) {
      router.push("/login");
    }
  }, [currentUser, router]);

  if (!mounted || !currentUser) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-color)' }}>
      {/* Sidebar */}
      <aside className="glass" style={{
        width: '260px',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        padding: '1.5rem',
        position: 'sticky',
        top: 0,
        height: '100vh',
      }}>
        <div style={{ marginBottom: '3rem', paddingLeft: '0.5rem' }}>
          <h2 style={{ color: 'var(--primary-color)', margin: 0, fontSize: '1.5rem' }}>Richsoon</h2>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Welcome, <strong>{currentUser.username}</strong>
            <span style={{ 
              display: 'inline-block', 
              marginLeft: '0.5rem',
              padding: '0.1rem 0.4rem', 
              backgroundColor: 'rgba(99, 102, 241, 0.1)', 
              color: 'var(--primary-color)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.7rem'
            }}>
              {currentUser.role}
            </span>
          </div>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Link href="/dashboard/tasks" style={{
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: pathname === '/dashboard/tasks' ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
            color: pathname === '/dashboard/tasks' ? 'var(--primary-color)' : 'var(--text-color)',
            fontWeight: pathname === '/dashboard/tasks' ? 600 : 400,
            transition: 'all 0.2s'
          }}>
            📋 Tasks & Earnings
          </Link>
          
          {currentUser.role === 'Admin' && (
            <>
              <Link href="/dashboard/books" style={{
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: pathname === '/dashboard/books' ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                color: pathname === '/dashboard/books' ? 'var(--primary-color)' : 'var(--text-color)',
                fontWeight: pathname === '/dashboard/books' ? 600 : 400,
                transition: 'all 0.2s'
              }}>
                📚 Book Management
              </Link>
              <Link href="/dashboard/users" style={{
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: pathname === '/dashboard/users' ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                color: pathname === '/dashboard/users' ? 'var(--primary-color)' : 'var(--text-color)',
                fontWeight: pathname === '/dashboard/users' ? 600 : 400,
                transition: 'all 0.2s'
              }}>
                👥 User Management
              </Link>
            </>
          )}
        </nav>

        <button 
          onClick={() => logout()} 
          style={{
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            color: 'var(--danger-color)',
            border: 'none',
            fontWeight: 500,
            textAlign: 'left',
            marginTop: 'auto',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
        >
          🚪 Sign Out
        </button>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '2rem', overflowX: 'auto' }}>
        <div className="animate-fade-in" style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {children}
        </div>
      </main>
    </div>
  );
}
