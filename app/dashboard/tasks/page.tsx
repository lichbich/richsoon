"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useAppContext } from "../../context/AppContext";

// Separate component for editable task count cell to manage local state
function TaskCountInput({ bookId, currentCount, onSave }: { bookId: string; currentCount: number; onSave: (bookId: string, count: number) => void }) {
  const [localValue, setLocalValue] = useState<string>(currentCount ? String(currentCount) : '');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    setLocalValue(currentCount ? String(currentCount) : '');
  }, [currentCount]);

  const isDirty = (parseInt(localValue) || 0) !== (currentCount || 0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '' || /^\d+$/.test(val)) {
      setLocalValue(val);
      setShowSuccess(false);
    }
  };

  const handleIncrement = () => {
    const current = parseInt(localValue) || 0;
    setLocalValue(String(current + 1));
    setShowSuccess(false);
  };

  const handleDecrement = () => {
    const current = parseInt(localValue) || 0;
    if (current > 0) {
      setLocalValue(String(current - 1));
      setShowSuccess(false);
    }
  };

  const handleSave = useCallback(async () => {
    if (!isDirty) return;
    const numValue = parseInt(localValue) || 0;
    setIsSaving(true);
    try {
      await onSave(bookId, numValue);
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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
        <button onClick={handleIncrement} className="count-btn">▲</button>
        <button onClick={handleDecrement} className="count-btn">▼</button>
      </div>
      <input
        type="text"
        inputMode="numeric"
        value={localValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className="count-input"
        style={{ borderColor: isDirty ? 'var(--primary-color)' : 'rgba(255,255,255,0.1)' }}
      />
      <button
        onClick={handleSave}
        disabled={!isDirty || isSaving}
        className={`save-btn ${isDirty ? 'dirty' : ''} ${showSuccess ? 'success' : ''}`}
      >
        {isSaving ? '...' : showSuccess ? '✓' : 'Save'}
      </button>

      <style>{`
        .count-btn {
          background: rgba(99, 102, 241, 0.1);
          border: none;
          color: var(--primary-color);
          cursor: pointer;
          font-size: 0.6rem;
          padding: 1px 4px;
          border-radius: 2px;
        }
        .count-input {
          width: 50px;
          padding: 0.3rem;
          text-align: center;
          font-size: 0.95rem;
          font-weight: 600;
          border-radius: 6px;
          border: 1px solid;
          background: rgba(0,0,0,0.2);
          color: #fff;
          outline: none;
        }
        .save-btn {
          border: none;
          padding: 0.3rem 0.6rem;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          background: rgba(255,255,255,0.05);
          color: rgba(255,255,255,0.3);
          transition: all 0.2s;
        }
        .save-btn.dirty { background: var(--primary-color); color: #fff; }
        .save-btn.success { background: rgba(34, 197, 94, 0.2); color: var(--success-color); }
      `}</style>
    </div>
  );
}

export default function TasksPage() {
  const { currentUser, books, users, taskCounts, updateTaskCount, isFetchingData } = useAppContext();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedAuthor, setSelectedAuthor] = useState("All");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewingBook, setViewingBook] = useState<any>(null);

  const [viewMode, setViewMode] = useState<"personal" | "all">("personal");

  if (!currentUser) return null;

  if (currentUser.role === "Guest") {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
        <h2 style={{ color: 'var(--danger-color)', marginBottom: '1rem' }}>Access Denied</h2>
        <p style={{ color: 'var(--text-muted)' }}>Your account is pending Admin approval.</p>
      </div>
    );
  }

  // Filter books logic - only show books that have at least one valid assignment
  let visibleBooks = books.filter(b => b.assignedUsers && b.assignedUsers.some(uid => users.some(u => u.id === uid)));

  if (currentUser.role !== "Admin" || viewMode === "personal") {
    visibleBooks = visibleBooks.filter(b => b.assignedUsers?.includes(currentUser.id));
  }

  const uniqueAuthors = ["All", ...Array.from(new Set(books.map(b => b.author).filter(Boolean)))];
  if (selectedAuthor !== "All") {
    visibleBooks = visibleBooks.filter(b => b.author === selectedAuthor);
  }

  const visibleUserIds = new Set<string>();
  visibleBooks.forEach(b => {
    b.assignedUsers?.forEach(uid => visibleUserIds.add(uid));
  });

  const tableUsers = (viewMode === "all" && currentUser.role === "Admin")
    ? users.filter((u) => u.role !== "Guest" && visibleUserIds.has(u.id))
    : users.filter((u) => u.id === currentUser.id);

  const copyToClipboard = async (bookId: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(bookId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {}
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

  const calculateUserMoney = (userId: string) => {
    return visibleBooks.reduce((sum, book) => sum + (taskCounts[book.id]?.[userId] || 0) * book.price, 0);
  };

  const calculateGrandTotalCount = () => {
    return visibleBooks.reduce((sum, book) => sum + calculateRowTotal(book.id), 0);
  };

  const calculateGrandTotalMoney = () => {
    return visibleBooks.reduce((sum, book) => sum + calculateRowMoney(book.id, book.price), 0);
  };

  const isPersonal = viewMode === "personal";
  
  // DYNAMIC COLUMN WIDTHS
  const COL_NO = 50;
  const COL_TITLE = isPersonal ? 450 : 200; // Give much more space to Title in personal mode
  const COL_AUTHOR = 150;
  const COL_LINK = 70;
  const COL_PRICE = 80;
  const COL_TOTAL_MONEY = 130;
  const COL_TOTAL_COUNT = 110;

  const BG_SOLID = "var(--surface-color)"; // MATCH THE CARD COLOR FOR SEAMLESS STICKY EFFECT

  return (
    <div style={{ maxWidth: '100vw' }}>
      <style>{`
        .table-container {
          width: 100%;
          overflow-x: auto;
          background: var(--surface-color);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          position: relative;
        }
        .task-table {
          border-collapse: separate;
          border-spacing: 0;
          width: ${isPersonal ? '100%' : 'max-content'};
          min-width: 100%;
          table-layout: ${isPersonal ? 'auto' : 'fixed'};
        }
        .task-table th, .task-table td {
          padding: 12px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          white-space: ${isPersonal ? 'normal' : 'nowrap'};
          background: ${BG_SOLID};
        }
        
        /* STICKY LOGIC - LEFT */
        .sticky-left {
          position: ${isPersonal ? 'static' : 'sticky'} !important;
          z-index: 50;
          background: ${BG_SOLID} !important;
          box-shadow: ${isPersonal ? 'none' : '2px 0 5px rgba(0,0,0,0.5)'};
        }
        .sticky-left-last {
          border-right: ${isPersonal ? 'none' : '2px solid var(--primary-color)'} !important;
        }
        
        /* STICKY LOGIC - RIGHT */
        .sticky-right {
          position: ${isPersonal ? 'static' : 'sticky'} !important;
          z-index: 50;
          background: ${BG_SOLID} !important;
          box-shadow: ${isPersonal ? 'none' : '-2px 0 5px rgba(0,0,0,0.5)'};
        }
        .sticky-right-first {
          border-left: ${isPersonal ? 'none' : '2px solid var(--primary-color)'} !important;
        }

        /* HEADERS */
        .task-table thead th {
          background: #1e293b !important;
          z-index: 60;
          border-bottom: 2px solid var(--border-color);
        }
        .task-table tfoot td {
          background: #1e293b !important;
          z-index: 60;
          border-top: 2px solid var(--border-color);
        }

        .book-title-cell {
          max-width: ${COL_TITLE}px;
          overflow: hidden;
          text-overflow: ellipsis;
          cursor: pointer;
          color: #fff;
          font-weight: 500;
        }
        .book-title-cell:hover { color: var(--primary-color); }
        
        .copy-btn {
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: 0, color: 'var(--text-color)' }}>Tasks Overview</h1>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>Sticky columns for Book info & Totals</p>
          </div>

          {currentUser.role === "Admin" && (
            <div style={{ 
              display: 'flex', 
              background: 'rgba(0,0,0,0.2)', 
              padding: '4px', 
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.05)'
            }}>
              <button 
                onClick={() => setViewMode("personal")}
                style={{
                  padding: '6px 16px',
                  borderRadius: '7px',
                  border: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: viewMode === "personal" ? 'var(--primary-color)' : 'transparent',
                  color: viewMode === "personal" ? '#fff' : 'var(--text-muted)',
                  transition: 'all 0.2s'
                }}
              >
                My Tasks
              </button>
              <button 
                onClick={() => setViewMode("all")}
                style={{
                  padding: '6px 16px',
                  borderRadius: '7px',
                  border: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: viewMode === "all" ? 'var(--primary-color)' : 'transparent',
                  color: viewMode === "all" ? '#fff' : 'var(--text-muted)',
                  transition: 'all 0.2s'
                }}
              >
                All Overview
              </button>
            </div>
          )}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative', zIndex: 1000 }}>
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
                  animation: 'dropdownIn 0.2s ease-out',
                  zIndex: 100,
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

      <div className="table-container">
        <table className="task-table">
          <thead>
            <tr>
              <th className="sticky-left" style={{ left: 0, width: COL_NO }}>NO.</th>
              <th className="sticky-left" style={{ left: COL_NO, width: COL_TITLE }}>BOOK TITLE</th>
              <th className="sticky-left" style={{ left: COL_NO + COL_TITLE, width: COL_AUTHOR }}>AUTHOR</th>
              <th className="sticky-left" style={{ left: COL_NO + COL_TITLE + COL_AUTHOR, width: COL_LINK, textAlign: 'center' }}>LINK</th>
              <th className="sticky-left sticky-left-last" style={{ left: COL_NO + COL_TITLE + COL_AUTHOR + COL_LINK, width: COL_PRICE, textAlign: 'right' }}>PRICE</th>
              
              {tableUsers.map(u => (
                <th key={u.id} style={{ textAlign: 'center', minWidth: isPersonal ? '180px' : '220px', color: u.id === currentUser.id ? 'var(--primary-color)' : 'inherit' }}>{u.username}</th>
              ))}
              
              <th className="sticky-right sticky-right-first" style={{ right: COL_TOTAL_MONEY, width: COL_TOTAL_COUNT, textAlign: 'center' }}>COUNT</th>
              <th className="sticky-right" style={{ right: 0, width: COL_TOTAL_MONEY, textAlign: 'right' }}>MONEY</th>
            </tr>
          </thead>
          <tbody>
            {visibleBooks.map((book, index) => {
              const isAssignedToMe = book.assignedUsers?.includes(currentUser.id);
              const rowOpacity = isAssignedToMe || currentUser.role === "Admin" ? 1 : 0.4;
              const isDimmed = !isAssignedToMe && currentUser.role === "Admin";

              return (
                <tr key={book.id} style={{ opacity: isDimmed ? 0.5 : 1, transition: 'opacity 0.2s' }}>
                  <td className="sticky-left" style={{ left: 0, textAlign: 'center', color: 'var(--text-muted)' }}>{index + 1}</td>
                  <td className="sticky-left book-title-cell" style={{ left: COL_NO }} onClick={() => setViewingBook(book)} title={book.title}>
                    {book.title}
                  </td>
                  <td className="sticky-left" style={{ left: COL_NO + COL_TITLE, color: 'var(--text-muted)' }}>
                    <div style={{ maxWidth: COL_AUTHOR, overflow: 'hidden', textOverflow: 'ellipsis' }}>{book.author}</div>
                  </td>
                  <td className="sticky-left" style={{ left: COL_NO + COL_TITLE + COL_AUTHOR, textAlign: 'center' }}>
                    <button 
                      onClick={() => isAssignedToMe && copyToClipboard(book.id, book.link)} 
                      disabled={!isAssignedToMe}
                      className="copy-btn"
                      style={{ 
                        background: !isAssignedToMe ? 'rgba(255,255,255,0.05)' : copiedId === book.id ? 'rgba(34, 197, 94, 0.2)' : 'rgba(99, 102, 241, 0.1)', 
                        color: !isAssignedToMe ? 'rgba(255,255,255,0.1)' : copiedId === book.id ? 'var(--success-color)' : 'var(--primary-color)',
                        cursor: isAssignedToMe ? 'pointer' : 'not-allowed',
                        opacity: isAssignedToMe ? 1 : 0.5
                      }}
                      title={isAssignedToMe ? "Copy Link" : "You are not assigned to this book"}
                    >
                      {copiedId === book.id ? '✓' : '📋'}
                    </button>
                  </td>
                  <td className="sticky-left sticky-left-last" style={{ left: COL_NO + COL_TITLE + COL_AUTHOR + COL_LINK, textAlign: 'right', fontWeight: 600 }}>
                    ${book.price.toFixed(2)}
                  </td>

                  {tableUsers.map(u => {
                    const count = taskCounts[book.id]?.[u.id] || 0;
                    const canEdit = u.id === currentUser.id && isAssignedToMe;
                    return (
                      <td key={u.id} style={{ textAlign: 'center', background: u.id === currentUser.id ? 'rgba(99, 102, 241, 0.02)' : 'inherit' }}>
                        {canEdit ? (
                          <TaskCountInput bookId={book.id} currentCount={count} onSave={handleSaveCount} />
                        ) : (
                          <span style={{ opacity: count > 0 ? 1 : 0.2, fontWeight: u.id === currentUser.id ? 700 : 400 }}>{count || '-'}</span>
                        )}
                      </td>
                    );
                  })}

                  <td className="sticky-right sticky-right-first" style={{ right: COL_TOTAL_MONEY, textAlign: 'center', fontWeight: 'bold' }}>{calculateRowTotal(book.id)}</td>
                  <td className="sticky-right" style={{ right: 0, textAlign: 'right', fontWeight: 'bold', color: 'var(--success-color)' }}>
                    ${calculateRowMoney(book.id, book.price).toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td className="sticky-left sticky-left-last" style={{ left: 0, textAlign: 'right', fontWeight: 'bold', color: 'var(--danger-color)' }} colSpan={5}>
                TOTALS:
              </td>
              {tableUsers.map(u => (
                <td key={u.id} style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--danger-color)' }}>
                  ${calculateUserMoney(u.id).toFixed(2)}
                </td>
              ))}
              <td className="sticky-right sticky-right-first" style={{ right: COL_TOTAL_MONEY, textAlign: 'center', fontWeight: 'bold', color: 'var(--danger-color)' }}>{calculateGrandTotalCount()}</td>
              <td className="sticky-right" style={{ right: 0, textAlign: 'right', fontWeight: 'bold', color: 'var(--danger-color)' }}>${calculateGrandTotalMoney().toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* MODAL */}
      {viewingBook && createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '2rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
            <h2 style={{ color: 'var(--primary-color)', marginBottom: '1.5rem' }}>Book Details</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
              <p><strong>Title:</strong> {viewingBook.title}</p>
              <p><strong>Author:</strong> {viewingBook.author}</p>
              <p><strong>Price:</strong> ${viewingBook.price.toFixed(2)}</p>
              <p><strong>Link:</strong> <a href={viewingBook.link} target="_blank" rel="noreferrer" style={{ color: 'var(--primary-color)', wordBreak: 'break-all' }}>{viewingBook.link}</a></p>
            </div>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setViewingBook(null)}>Close</button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
