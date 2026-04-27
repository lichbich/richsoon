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
  };

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      gap: '6px',
      position: 'relative'
    }}>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={localValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="0"
        style={{ 
          width: '80px', 
          padding: '0.5rem 0.6rem', 
          textAlign: 'center',
          fontSize: '1rem',
          fontWeight: 500,
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
        title={isDirty ? "Save (Enter)" : "No changes"}
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1rem',
          cursor: isDirty ? 'pointer' : 'default',
          transition: 'all 0.2s ease',
          backgroundColor: showSuccess 
            ? 'var(--success-color)' 
            : isDirty 
              ? 'var(--primary-color)' 
              : 'rgba(100, 116, 139, 0.15)',
          color: (isDirty || showSuccess) ? 'white' : 'var(--text-muted)',
          opacity: (!isDirty && !showSuccess) ? 0.5 : 1,
          transform: isDirty ? 'scale(1)' : 'scale(0.9)',
          boxShadow: isDirty ? '0 2px 8px rgba(99, 102, 241, 0.3)' : 'none',
          flexShrink: 0,
        }}
      >
        {isSaving ? '⏳' : showSuccess ? '✓' : '💾'}
      </button>
    </div>
  );
}

export default function TasksPage() {
  const { currentUser, books, users, taskCounts, updateTaskCount } = useAppContext();
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [selectedAuthor, setSelectedAuthor] = useState("All");

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
        
        <div>
          <label style={{ marginRight: '0.5rem', fontWeight: 500 }}>Filter by Author:</label>
          <select 
            value={selectedAuthor} 
            onChange={(e) => setSelectedAuthor(e.target.value)}
            style={{ width: 'auto', display: 'inline-block', minWidth: '150px' }}
          >
            {uniqueAuthors.map(author => (
              <option key={author} value={author}>{author}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card" style={{ padding: '0', overflowX: 'auto', borderRadius: 'var(--radius-lg)' }}>
        <table style={{ minWidth: '1000px', width: '100%' }}>
          <thead>
            <tr>
              <th style={{ width: '40px', textAlign: 'center' }}>No.</th>
              <th style={{ width: '200px' }}>Book Title</th>
              <th style={{ width: '150px' }}>Author</th>
              <th style={{ width: '120px' }}>Link</th>
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
            {visibleBooks.map((book, index) => (
              <tr key={book.id}>
                <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{index + 1}</td>
                <td style={{ fontWeight: 500 }}>{book.title}</td>
                <td style={{ color: 'var(--text-muted)' }}>{book.author}</td>
                <td>
                  <button 
                    onClick={() => copyToClipboard(book.link)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: copiedLink === book.link ? 'var(--success-color)' : 'var(--primary-color)',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    {copiedLink === book.link ? '✓ Copied' : '🔗 Copy Link'}
                  </button>
                </td>
                <td style={{ textAlign: 'right' }}>{book.price.toFixed(2)}</td>
                
                {tableUsers.map((u) => {
                  const count = taskCounts[book.id]?.[u.id] || 0;
                  const isCurrentUser = u.id === currentUser.id;
                  const isAssigned = book.assignedUsers?.includes(u.id);
                  // Admin can edit their own counts even if not explicitly assigned
                  const canEdit = isCurrentUser && (isAssigned || currentUser.role === "Admin");
                  
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
            ))}
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
