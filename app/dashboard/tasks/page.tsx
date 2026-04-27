"use client";

import { useState, useEffect, useCallback } from "react";
import { useAppContext } from "../../context/AppContext";

// Separate component for editable task count cell to manage local state
function TaskCountInput({ bookId, currentCount, onSave }: { bookId: string; currentCount: number; onSave: (bookId: string, count: number) => void }) {
  const [localValue, setLocalValue] = useState<string>(currentCount ? String(currentCount) : '');
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Sync local value when external data changes (but only if not currently editing)
  useEffect(() => {
    if (!isDirty) {
      setLocalValue(currentCount ? String(currentCount) : '');
    }
  }, [currentCount, isDirty]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Only allow digits and empty string
    if (val === '' || /^\d+$/.test(val)) {
      setLocalValue(val);
      setIsDirty(true);
      setShowSuccess(false);
    }
  };

  const handleIncrement = () => {
    const current = parseInt(localValue) || 0;
    setLocalValue(String(current + 1));
    setIsDirty(true);
    setShowSuccess(false);
  };

  const handleDecrement = () => {
    const current = parseInt(localValue) || 0;
    if (current > 0) {
      setLocalValue(String(current - 1));
      setIsDirty(true);
      setShowSuccess(false);
    }
  };

  const handleSave = useCallback(async () => {
    if (!isDirty) return;
    const numValue = parseInt(localValue) || 0;
    setIsSaving(true);
    try {
      await onSave(bookId, numValue);
      setIsDirty(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 1500);
    } finally {
      setIsSaving(false);
    }
  }, [bookId, localValue, isDirty, onSave]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      handleIncrement();
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      handleDecrement();
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      gap: '8px',
      position: 'relative'
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <button 
          onClick={handleIncrement}
          style={{
            background: 'rgba(99, 102, 241, 0.1)',
            border: 'none',
            borderRadius: '4px',
            color: 'var(--primary-color)',
            cursor: 'pointer',
            padding: '2px 6px',
            fontSize: '0.75rem',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)'}
        >
          ▲
        </button>
        <button 
          onClick={handleDecrement}
          style={{
            background: 'rgba(99, 102, 241, 0.1)',
            border: 'none',
            borderRadius: '4px',
            color: 'var(--primary-color)',
            cursor: 'pointer',
            padding: '2px 6px',
            fontSize: '0.75rem',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)'}
        >
          ▼
        </button>
      </div>
      
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={localValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="0"
        style={{ 
          width: '70px', 
          padding: '0.5rem 0.4rem', 
          textAlign: 'center',
          fontSize: '1.1rem',
          fontWeight: 600,
          borderRadius: '8px',
          border: isDirty 
            ? '2px solid var(--primary-color)' 
            : showSuccess 
              ? '2px solid var(--success-color)'
              : '1px solid var(--border-color)',
          backgroundColor: isDirty ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-color)',
          transition: 'all 0.2s ease',
          outline: 'none',
          boxShadow: isDirty ? '0 0 0 3px rgba(99, 102, 241, 0.15)' : 'none',
          color: 'var(--text-color)',
        }}
      />

      <button
        onClick={handleSave}
        disabled={!isDirty || isSaving}
        style={{
          padding: '0.5rem 1rem',
          borderRadius: '8px',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.85rem',
          fontWeight: 600,
          cursor: isDirty ? 'pointer' : 'default',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          backgroundColor: showSuccess 
            ? 'rgba(34, 197, 94, 0.1)' 
            : isDirty 
              ? 'var(--primary-color)' 
              : 'rgba(99, 102, 241, 0.05)',
          color: showSuccess 
            ? 'var(--success-color)' 
            : isDirty 
              ? 'white' 
              : 'rgba(99, 102, 241, 0.4)',
          minWidth: '60px',
          height: '38px',
          boxShadow: isDirty && !showSuccess ? '0 4px 12px rgba(99, 102, 241, 0.25)' : 'none',
          opacity: isSaving ? 0.8 : 1,
          transform: isDirty && !isSaving ? 'scale(1)' : 'scale(0.98)',
        }}
      >
        {isSaving ? (
          <span className="spinner" style={{ 
            width: '16px', 
            height: '16px', 
            borderWidth: '2px',
            borderTopColor: isDirty ? 'white' : 'var(--primary-color)' 
          }} />
        ) : showSuccess ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '1rem' }}>✓</span> Done
          </span>
        ) : (
          'Save'
        )}
      </button>
    </div>
  );
}

export default function TasksPage() {
  const { currentUser, books, users, taskCounts, updateTaskCount, isFetchingData } = useAppContext();
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [selectedAuthor, setSelectedAuthor] = useState("All");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  if (!currentUser) return null;

  if (currentUser.role === "Guest") {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
        <h2 style={{ color: 'var(--danger-color)', marginBottom: '1rem' }}>Access Denied</h2>
        <p style={{ color: 'var(--text-muted)' }}>
          Your account is currently pending. Please wait for an Admin to grant you access.
        </p>
      </div>
    );
  }

  // Filter books
  let visibleBooks = currentUser.role === "Admin"
    ? books
    : books.filter(b => b.assignedUsers?.includes(currentUser.id));

  // Apply author filter
  const uniqueAuthors = ["All", ...Array.from(new Set(books.map(b => b.author).filter(Boolean)))];
  if (selectedAuthor !== "All") {
    visibleBooks = visibleBooks.filter(b => b.author === selectedAuthor);
  }

  // Find users sharing these books
  const visibleUserIds = new Set<string>();
  visibleBooks.forEach(b => {
    b.assignedUsers?.forEach(uid => visibleUserIds.add(uid));
  });

  // Filter users who should be in the table
  const tableUsers = users.filter((u) => {
    if (u.role === "Guest") return false;
    if (currentUser.role === "Admin") return true; // Admins see everyone
    return visibleUserIds.has(u.id);
  });

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedLink(text);
      setTimeout(() => setCopiedLink(null), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  const handleSaveCount = async (bookId: string, count: number) => {
    await updateTaskCount(bookId, count);
  };

  const calculateRowTotal = (bookId: string) => {
    return tableUsers.reduce((sum, user) => sum + (taskCounts[bookId]?.[user.id] || 0), 0);
  };

  const calculateRowMoney = (bookId: string, price: number) => {
    return calculateRowTotal(bookId) * price;
  };

  const calculateUserTotal = (userId: string) => {
    return visibleBooks.reduce((sum, book) => sum + (taskCounts[book.id]?.[userId] || 0), 0);
  };

  const calculateUserMoney = (userId: string) => {
    return visibleBooks.reduce((sum, book) => sum + (taskCounts[book.id]?.[userId] || 0) * book.price, 0);
  };

  const calculateGrandTotalCount = () => {
    return visibleBooks.reduce((sum, book) => sum + calculateRowTotal(book.id), 0);
  };

  const calculateGrandTotalMoney = () => {
    return visibleBooks.reduce((sum, book) => sum + calculateRowMoney(book.id, book.price), 0);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, color: 'var(--text-color)' }}>Tasks Overview</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Manage book links and completion counts</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative', zIndex: 10 }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>Filter by Author:</span>
          
          <div style={{ position: 'relative', minWidth: '180px' }}>
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="glass"
              style={{ 
                width: '100%',
                backgroundColor: 'rgba(99, 102, 241, 0.05)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '0.6rem 1rem',
                fontSize: '0.9rem',
                fontWeight: 600,
                color: 'var(--text-color)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary-color)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
            >
              <span>{selectedAuthor}</span>
              <span style={{ 
                fontSize: '0.7rem', 
                transition: 'transform 0.2s ease',
                transform: isFilterOpen ? 'rotate(180deg)' : 'rotate(0)'
              }}>▼</span>
            </button>

            {isFilterOpen && (
              <>
                <div 
                  onClick={() => setIsFilterOpen(false)}
                  style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: -1 }}
                />
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  left: 0,
                  right: 0,
                  backgroundColor: 'rgba(30, 41, 59, 0.95)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '14px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                  padding: '0.4rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  animation: 'dropdownIn 0.2s ease-out'
                }}>
                  <style>{`
                    @keyframes dropdownIn {
                      from { opacity: 0; transform: translateY(-10px); }
                      to { opacity: 1; transform: translateY(0); }
                    }
                    .dropdown-item {
                      padding: 10px 14px;
                      border-radius: 8px;
                      cursor: pointer;
                      font-size: 0.85rem;
                      font-weight: 500;
                      color: rgba(255, 255, 255, 0.7);
                      transition: all 0.2s;
                    }
                    .dropdown-item:hover {
                      background: rgba(99, 102, 241, 0.15);
                      color: #fff;
                    }
                    .dropdown-item.active {
                      background: var(--primary-color);
                      color: #fff;
                    }
                  `}</style>
                  {uniqueAuthors.map(author => (
                    <div 
                      key={author}
                      className={`dropdown-item ${selectedAuthor === author ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedAuthor(author);
                        setIsFilterOpen(false);
                      }}
                    >
                      {author}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '0', overflowX: 'auto', borderRadius: 'var(--radius-lg)' }}>
        <table style={{ minWidth: '1000px', width: '100%' }}>
          <thead>
            <tr>
              <th style={{ width: '40px', textAlign: 'center' }}>No.</th>
              <th style={{ width: '200px' }}>Book Title</th>
              <th style={{ width: '150px' }}>Author</th>
              <th style={{ width: '100px' }}>Link</th>
              <th style={{ width: '80px', textAlign: 'right' }}>Price ($)</th>
              {tableUsers.map((u) => (
                <th key={u.id} style={{ 
                  textAlign: 'center', 
                  backgroundColor: u.id === currentUser.id ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                  color: u.id === currentUser.id ? 'var(--primary-color)' : 'var(--text-muted)'
                }}>
                  {u.username}
                </th>
              ))}
              <th style={{ textAlign: 'center', color: 'var(--secondary-color)' }}>Total Count</th>
              <th style={{ textAlign: 'right', color: 'var(--success-color)' }}>Total Money</th>
            </tr>
          </thead>
          <tbody>
            {isFetchingData && visibleBooks.length === 0 ? (
              // Skeleton loader rows
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={`skeleton-${i}`}>
                  <td style={{ textAlign: 'center' }}><div className="skeleton skeleton-cell" style={{ width: '20px', margin: '0 auto' }} /></td>
                  <td><div className="skeleton skeleton-cell" style={{ width: '70%' }} /></td>
                  <td><div className="skeleton skeleton-cell" style={{ width: '60%' }} /></td>
                  <td><div className="skeleton skeleton-cell" style={{ width: '80px' }} /></td>
                  <td><div className="skeleton skeleton-cell" style={{ width: '40px', marginLeft: 'auto' }} /></td>
                  {tableUsers.length > 0 ? tableUsers.map((u) => (
                    <td key={u.id}><div className="skeleton skeleton-cell" style={{ width: '50px', margin: '0 auto' }} /></td>
                  )) : (
                    <>
                      <td><div className="skeleton skeleton-cell" style={{ width: '50px', margin: '0 auto' }} /></td>
                      <td><div className="skeleton skeleton-cell" style={{ width: '50px', margin: '0 auto' }} /></td>
                    </>
                  )}
                  <td><div className="skeleton skeleton-cell" style={{ width: '40px', margin: '0 auto' }} /></td>
                  <td><div className="skeleton skeleton-cell" style={{ width: '60px', marginLeft: 'auto' }} /></td>
                </tr>
              ))
            ) : (
              visibleBooks.map((book, index) => (
              <tr key={book.id}>
                <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{index + 1}</td>
                <td style={{ fontWeight: 500 }}>{book.title}</td>
                <td style={{ color: 'var(--text-muted)' }}>{book.author}</td>
                <td>
                  <button 
                    onClick={() => copyToClipboard(book.link)}
                    style={{
                      background: copiedLink === book.link ? 'rgba(34, 197, 94, 0.1)' : 'rgba(99, 102, 241, 0.08)',
                      border: `1px solid ${copiedLink === book.link ? 'rgba(34, 197, 94, 0.3)' : 'rgba(99, 102, 241, 0.2)'}`,
                      color: copiedLink === book.link ? 'var(--success-color)' : 'var(--primary-color)',
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {copiedLink === book.link ? '✓ Copied!' : '📋 Copy'}
                  </button>
                </td>
                <td style={{ textAlign: 'right' }}>{book.price.toFixed(2)}</td>
                
                {tableUsers.map((u) => {
                  const count = taskCounts[book.id]?.[u.id] || 0;
                  const isCurrentUser = u.id === currentUser.id;
                  const isAssigned = book.assignedUsers?.includes(u.id);
                  const canEdit = isCurrentUser && isAssigned;
                  
                  return (
                    <td key={u.id} style={{ 
                      textAlign: 'center',
                      padding: canEdit ? '0.5rem' : '1rem',
                    }}>
                      {canEdit ? (
                        <TaskCountInput
                          bookId={book.id}
                          currentCount={count}
                          onSave={handleSaveCount}
                        />
                      ) : (
                        <span style={{ color: count > 0 ? 'var(--text-color)' : 'var(--text-muted)' }}>
                          {count || '-'}
                        </span>
                      )}
                    </td>
                  );
                })}
                
                <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                  {calculateRowTotal(book.id)}
                </td>
                <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--success-color)' }}>
                  ${calculateRowMoney(book.id, book.price).toFixed(2)}
                </td>
              </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr style={{ backgroundColor: 'rgba(0,0,0,0.02)', borderTop: '2px solid var(--border-color)' }}>
              <td colSpan={5} style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--danger-color)' }}>
                TỔNG LÚA (Total Money):
              </td>
              {tableUsers.map((u) => (
                <td key={u.id} style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--danger-color)' }}>
                  ${calculateUserMoney(u.id).toFixed(2)}
                </td>
              ))}
              <td style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--danger-color)' }}>
                {calculateGrandTotalCount()}
              </td>
              <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--danger-color)' }}>
                ${calculateGrandTotalMoney().toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
