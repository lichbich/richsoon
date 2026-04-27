"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAppContext, Role, User } from "../../context/AppContext";

export default function UsersPage() {
  const { currentUser, users, updateUserRole, deleteUser, fetchData, isFetchingData, setViewingGlobalAvatarUrl } = useAppContext();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    if (openDropdownId && triggerRefs.current[openDropdownId]) {
      const rect = triggerRefs.current[openDropdownId]!.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  }, [openDropdownId]);

  if (!currentUser || currentUser.role !== "Admin") {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
        <h2 style={{ color: 'var(--danger-color)', marginBottom: '1rem' }}>Access Denied</h2>
        <p style={{ color: 'var(--text-muted)' }}>
          You need Admin privileges to view this page.
        </p>
      </div>
    );
  }

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  };

  const isOnline = (u: User) => u.last_active && u.last_active > Date.now() - 2 * 60 * 1000;

  const onlineCount = users.filter(isOnline).length;
  
  const admins = users.filter(u => u.role === "Admin");
  const verifiedUsers = users.filter(u => u.role === "User");
  const guests = users.filter(u => u.role === "Guest");

  const renderUserRow = (u: User) => {
    const isSelf = u.id === currentUser.id;
    const isSuperAdmin = currentUser.username === 'liam';
    const isOtherAdmin = u.role === "Admin" && !isSelf;
    const canEdit = !isSelf && (!isOtherAdmin || isSuperAdmin);
    const isDropdownOpen = openDropdownId === u.id;

    return (
      <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--border-color)', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div 
            onClick={() => {
              if (u.avatarUrl) {
                setViewingGlobalAvatarUrl(u.avatarUrl);
              }
            }}
            style={{ 
            width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--border-color)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'var(--text-muted)',
            overflow: 'hidden',
            cursor: u.avatarUrl ? 'zoom-in' : 'inherit'
          }}>
            {u.avatarUrl ? (
              <img src={u.avatarUrl} alt={u.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              u.username.charAt(0).toUpperCase()
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-color)' }}>{u.username}</span>
              <span style={{ 
                width: '8px', height: '8px', borderRadius: '50%', 
                backgroundColor: isOnline(u) ? 'var(--success-color)' : 'var(--text-muted)' 
              }}></span>
            </div>
            {isSelf && <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>YOUR ACCOUNT</span>}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {canEdit ? (
            <div style={{ position: 'relative' }}>
              <button 
                ref={el => { triggerRefs.current[u.id] = el; }}
                onClick={() => setOpenDropdownId(isDropdownOpen ? null : u.id)}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: isDropdownOpen ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                  color: 'var(--text-color)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s',
                  minWidth: '85px',
                  justifyContent: 'space-between'
                }}
              >
                {u.role}
                <span style={{ fontSize: '0.6rem', opacity: 0.5, transform: isDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'all 0.2s' }}>▼</span>
              </button>

              {isDropdownOpen && createPortal(
                <>
                  <div 
                    onClick={() => setOpenDropdownId(null)}
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10000 }}
                  />
                  <div style={{
                    position: 'absolute',
                    top: dropdownPos.top + 5,
                    left: dropdownPos.left + dropdownPos.width - 100, // Align right with button
                    backgroundColor: 'rgba(30, 41, 59, 0.95)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                    padding: '0.3rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                    zIndex: 10001,
                    minWidth: '100px',
                    animation: 'dropdownScale 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
                  }}>
                    <style>{`
                      @keyframes dropdownScale {
                        from { opacity: 0; transform: scale(0.95) translateY(-5px); }
                        to { opacity: 1; transform: scale(1) translateY(0); }
                      }
                      .role-item {
                        padding: 8px 12px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 0.8rem;
                        font-weight: 500;
                        color: rgba(255, 255, 255, 0.7);
                        transition: all 0.2s;
                      }
                      .role-item:hover {
                        background: rgba(99, 102, 241, 0.15);
                        color: #fff;
                      }
                      .role-item.active {
                        background: var(--primary-color);
                        color: #fff;
                      }
                    `}</style>
                    {(['Admin', 'User', 'Guest'] as Role[]).map(role => (
                      <div 
                        key={role}
                        className={`role-item ${u.role === role ? 'active' : ''}`}
                        onClick={() => {
                          updateUserRole(u.id, role);
                          setOpenDropdownId(null);
                        }}
                      >
                        {role}
                      </div>
                    ))}
                  </div>
                </>,
                document.body
              )}
            </div>
          ) : (
            <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)', padding: '0.35rem 0.75rem' }}>
              {u.role}
            </span>
          )}
          {canEdit && (
            <button 
              onClick={() => {
                if (window.confirm(`Are you sure you want to delete ${u.username}?`)) {
                  deleteUser(u.id);
                }
              }}
              style={{ background: 'none', border: 'none', color: 'var(--danger-color)', cursor: 'pointer', padding: '0 0.5rem', fontSize: '1.1rem', opacity: 0.6 }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
              title="Delete User"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderSkeletonRows = (count: number) => (
    Array.from({ length: count }).map((_, i) => (
      <div key={`skeleton-${i}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="skeleton skeleton-avatar" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div className="skeleton skeleton-cell" style={{ width: `${80 + Math.random() * 40}px` }} />
          </div>
        </div>
        <div className="skeleton" style={{ width: '70px', height: '28px', borderRadius: 'var(--radius-md)' }} />
      </div>
    ))
  );

  const renderColumn = (title: string, data: User[], titleColor: string, skeletonCount: number) => (
    <div style={{ flex: 1, minWidth: '300px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0, color: titleColor }}>{title}</h3>
        <span style={{ backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', padding: '0.1rem 0.5rem', borderRadius: '1rem', fontSize: '0.85rem', fontWeight: 'bold' }}>
          {data.length}
        </span>
      </div>
      <div className="card" style={{ padding: '1rem', maxHeight: '600px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '0.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
          <span>USER</span>
          <span>ACTION</span>
        </div>
        {(isFetchingData || isRefreshing) && data.length === 0 ? (
          renderSkeletonRows(skeletonCount)
        ) : (
          data.map(renderUserRow)
        )}
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, color: 'var(--text-color)', marginBottom: '0.5rem' }}>Manage Roles</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>Review user accounts and change their permissions.</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '0.2rem 0.6rem', borderRadius: '1rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--success-color)' }}></span>
              <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--success-color)' }}>{onlineCount} Online</span>
            </div>
          </div>
        </div>
        
        <button 
          onClick={handleRefresh}
          className={`btn ${isRefreshing ? 'btn-loading' : ''}`}
          style={{ 
            backgroundColor: 'var(--bg-color)', 
            color: 'var(--text-color)', 
            border: '1px solid var(--border-color)', 
            fontWeight: 600,
            gap: '0.5rem',
          }}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <>
              <span className="spinner spinner-dark" style={{ width: '16px', height: '16px' }} />
              Refreshing...
            </>
          ) : (
            'Refresh List'
          )}
        </button>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
        {renderColumn("Administrators", admins, "var(--primary-color)", 2)}
        {renderColumn("Verified Users", verifiedUsers, "var(--info-color, #3b82f6)", 3)}
        {renderColumn("Guests / Pending", guests, "var(--warning-color, #f97316)", 2)}
      </div>
    </div>
  );
}
