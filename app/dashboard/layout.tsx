"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppContext } from "../context/AppContext";
import Link from "next/link";

// Generate a consistent color from username for the avatar
function getAvatarColor(name: string): string {
  const colors = [
    '#6366f1', '#ec4899', '#8b5cf6', '#14b8a6', 
    '#f59e0b', '#ef4444', '#3b82f6', '#10b981',
    '#f97316', '#06b6d4', '#84cc16', '#a855f7'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function getRoleBadgeStyle(role: string) {
  switch (role) {
    case 'Admin':
      return { backgroundColor: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' };
    case 'User':
      return { backgroundColor: 'rgba(34, 197, 94, 0.12)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.2)' };
    default:
      return { backgroundColor: 'rgba(100, 116, 139, 0.12)', color: '#94a3b8', border: '1px solid rgba(100, 116, 139, 0.2)' };
  }
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentUser, isLoading, logout, updateProfile } = useAppContext();
  const router = useRouter();
  const pathname = usePathname();
  
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [profileEditMode, setProfileEditMode] = useState<"avatar" | "username" | "password" | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    if (!isLoading && !currentUser) {
      router.push("/login");
    }
  }, [currentUser, isLoading, router]);

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        backgroundColor: 'var(--bg-color)',
        gap: '1rem'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid var(--border-color)',
          borderTopColor: 'var(--primary-color)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!currentUser) return null;

  const avatarColor = getAvatarColor(currentUser.username);
  const initial = currentUser.username.charAt(0).toUpperCase();
  const roleBadge = getRoleBadgeStyle(currentUser.role);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileEditMode || !editValue) return;
    
    setIsSavingProfile(true);
    try {
      const data: any = {};
      if (profileEditMode === 'avatar') data.avatarUrl = editValue;
      if (profileEditMode === 'username') data.username = editValue;
      if (profileEditMode === 'password') data.password = editValue;
      
      const success = await updateProfile(currentUser.id, data);
      if (success) {
        setProfileEditMode(null);
        setEditValue("");
      }
    } finally {
      setIsSavingProfile(false);
    }
  };

  const openEditModal = (mode: "avatar" | "username" | "password") => {
    setProfileEditMode(mode);
    setShowProfileMenu(false);
    if (mode === 'avatar') setEditValue(currentUser.avatarUrl || "");
    else if (mode === 'username') setEditValue(currentUser.username);
    else setEditValue(""); // Empty for password
  };

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
        <div style={{ marginBottom: '2rem', paddingLeft: '0.5rem' }}>
          <h2 style={{ color: 'var(--primary-color)', margin: 0, fontSize: '1.5rem' }}>Richsoon</h2>
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

        {/* User Profile Card */}
        <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
          <div 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            style={{
              padding: '1rem',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: showProfileMenu ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.04)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {/* Avatar */}
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: currentUser.avatarUrl ? 'transparent' : `linear-gradient(135deg, ${avatarColor}, ${avatarColor}cc)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 700,
              fontSize: '1.1rem',
              flexShrink: 0,
              boxShadow: `0 2px 8px ${avatarColor}40`,
              letterSpacing: '0.5px',
              overflow: 'hidden'
            }}>
              {currentUser.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt={currentUser.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                initial
              )}
            </div>

            {/* Info */}
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ 
                fontWeight: 600, 
                fontSize: '0.9rem',
                color: 'var(--text-color)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {currentUser.username}
              </div>
              <span style={{
                display: 'inline-block',
                padding: '0.1rem 0.5rem',
                borderRadius: '999px',
                fontSize: '0.65rem',
                fontWeight: 600,
                letterSpacing: '0.03em',
                textTransform: 'uppercase',
                marginTop: '2px',
                ...roleBadge,
              }}>
                {currentUser.role}
              </span>
            </div>
          </div>
          
          {/* Profile Menu Dropdown */}
          {showProfileMenu && (
            <div style={{
              position: 'absolute',
              bottom: '100%',
              left: 0,
              right: 0,
              marginBottom: '0.5rem',
              backgroundColor: 'var(--surface-color)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)',
              padding: '0.5rem',
              zIndex: 50,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.25rem'
            }}>
              <button onClick={() => openEditModal('avatar')} className="btn" style={{ padding: '0.5rem', justifyContent: 'flex-start', background: 'transparent', color: 'var(--text-color)' }}>
                🖼️ Change Avatar
              </button>
              <button onClick={() => openEditModal('username')} className="btn" style={{ padding: '0.5rem', justifyContent: 'flex-start', background: 'transparent', color: 'var(--text-color)' }}>
                📝 Change Username
              </button>
              <button onClick={() => openEditModal('password')} className="btn" style={{ padding: '0.5rem', justifyContent: 'flex-start', background: 'transparent', color: 'var(--text-color)' }}>
                🔑 Change Password
              </button>
            </div>
          )}
        </div>

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
      
      {/* Edit Profile Modal */}
      {profileEditMode && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1rem'
        }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '400px' }}>
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--primary-color)' }}>
              {profileEditMode === 'avatar' && 'Change Avatar'}
              {profileEditMode === 'username' && 'Change Username'}
              {profileEditMode === 'password' && 'Change Password'}
            </h3>
            <form onSubmit={handleProfileUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                  {profileEditMode === 'avatar' && 'Image URL'}
                  {profileEditMode === 'username' && 'New Username'}
                  {profileEditMode === 'password' && 'New Password'}
                </label>
                <input
                  type={profileEditMode === 'password' ? 'password' : 'text'}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder={
                    profileEditMode === 'avatar' ? 'https://...' :
                    profileEditMode === 'username' ? 'Enter username' : 'Enter new password'
                  }
                  required
                  disabled={isSavingProfile}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button 
                  type="submit" 
                  className={`btn btn-primary ${isSavingProfile ? 'btn-loading' : ''}`}
                  style={{ flex: 1, justifyContent: 'center', gap: '0.5rem' }}
                  disabled={isSavingProfile || !editValue}
                >
                  {isSavingProfile ? (
                    <><span className="spinner" /> Saving...</>
                  ) : (
                    'Save Changes'
                  )}
                </button>
                <button 
                  type="button" 
                  onClick={() => setProfileEditMode(null)} 
                  className="btn" 
                  style={{ padding: '0.75rem 1rem', border: '1px solid var(--border-color)', backgroundColor: 'transparent', color: 'var(--text-color)' }}
                  disabled={isSavingProfile}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
