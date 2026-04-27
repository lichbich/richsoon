"use client";

import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAppContext } from "../../context/AppContext";

export default function BooksPage() {
  const { currentUser, books, users, addBook, bulkAddBooks, editBook, deleteBook, bulkDeleteBooks, updateBookAssignments, isFetchingData } = useAppContext();
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [link, setLink] = useState("");
  const [price, setPrice] = useState("");
  const [selectedAuthor, setSelectedAuthor] = useState("All");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [savingAssignments, setSavingAssignments] = useState<Set<string>>(new Set());
  const [assigningBookId, setAssigningBookId] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState("");

  const activeUsers = users.filter(u => u.role !== "Guest");
  const assigningBook = books.find(b => b.id === assigningBookId);

  // Bulk Selection States
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Bulk Add States
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkAuthor, setBulkAuthor] = useState("");
  const [bulkContent, setBulkContent] = useState("");

  // Auto-fill author when opening modal
  useEffect(() => {
    if (isBulkModalOpen && selectedAuthor !== "All") {
      setBulkAuthor(selectedAuthor);
    }
  }, [isBulkModalOpen, selectedAuthor]);

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


  const startEdit = (book: any) => {
    setEditingId(book.id);
    setTitle(book.title);
    setAuthor(book.author || "");
    setLink(book.link);
    setPrice(book.price.toString());
  };

  const cancelEdit = () => {
    setEditingId(null);
    setTitle("");
    setAuthor("");
    setLink("");
    setPrice("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title && author && link && price) {
      if (editingId) {
        editBook(editingId, title, author, link, parseFloat(price));
        cancelEdit();
      } else {
        addBook(title, author, link, parseFloat(price), []);
        setTitle("");
        setAuthor("");
        setLink("");
        setPrice("");
      }
    }
  };

  const previewBooks = useMemo(() => {
    if (!bulkContent.trim()) return [];
    
    // Create a map of existing books for fast duplicate checking
    const existingMap = new Set(books.map(b => `${b.title.toLowerCase()}_${(b.author || "").toLowerCase()}`));

    return bulkContent.trim().split('\n').map(row => {
      const cols = row.split('\t');
      const title = cols[0]?.trim() || "";
      const link = cols[1]?.trim() || "";
      const priceStr = (cols[2] || "").trim().replace(',', '.');
      const price = parseFloat(priceStr);
      
      const key = `${title.toLowerCase()}_${bulkAuthor.toLowerCase()}`;
      const isDuplicate = existingMap.has(key);

      return { 
        title, 
        link, 
        price: isNaN(price) ? 0 : price, 
        isValid: title && link && !isNaN(price) && cols.length >= 3,
        isDuplicate
      };
    });
  }, [bulkContent, bulkAuthor, books]);

  const handleBulkSubmit = async () => {
    const validBooks = previewBooks.filter(b => b.isValid && !b.isDuplicate).map(b => ({
      title: b.title,
      author: bulkAuthor,
      link: b.link,
      price: b.price,
      assignedUsers: []
    }));

    if (!bulkAuthor) {
      alert("Please enter Author name");
      return;
    }

    if (validBooks.length === 0) {
      const hasDuplicates = previewBooks.some(b => b.isDuplicate);
      if (hasDuplicates) {
        alert("No new books to add. All valid books in your list already exist for this author.");
      } else {
        alert("No valid book data found. Please ensure you copied 3 columns (Title, Link, Price) from Excel.");
      }
      return;
    }

    if (window.confirm(`Are you sure you want to add ${validBooks.length} books for author "${bulkAuthor}"?`)) {
      await bulkAddBooks(validBooks as any);
      setIsBulkModalOpen(false);
      setBulkAuthor("");
      setBulkContent("");
    }
  };

  const toggleAssignment = async (bookId: string, userId: string, currentAssignments: string[]) => {
    const key = `${bookId}:${userId}`;
    setSavingAssignments(prev => new Set(prev).add(key));
    try {
      if (currentAssignments.includes(userId)) {
        await updateBookAssignments(bookId, currentAssignments.filter(id => id !== userId));
      } else {
        await updateBookAssignments(bookId, [...currentAssignments, userId]);
      }
    } finally {
      setSavingAssignments(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleSelectAll = (visibleBooks: any[]) => {
    if (selectedIds.size === visibleBooks.length && visibleBooks.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(visibleBooks.map(b => b.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedIds.size} selected books?`)) {
      await bulkDeleteBooks(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  const uniqueAuthors = ["All", ...Array.from(new Set(books.map(b => b.author).filter(Boolean)))];
  const filteredBooks = selectedAuthor === "All" ? books : books.filter(b => b.author === selectedAuthor);

  const renderSkeletonRows = () => (
    Array.from({ length: 3 }).map((_, i) => (
      <tr key={`skeleton-${i}`}>
        <td><div className="skeleton skeleton-cell" style={{ width: '20px' }} /></td>
        <td><div className="skeleton skeleton-cell" style={{ width: '75%' }} /></td>
        <td><div className="skeleton skeleton-cell" style={{ width: '60%' }} /></td>
        <td><div className="skeleton skeleton-cell" style={{ width: '40px', marginLeft: 'auto' }} /></td>
        <td>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <div className="skeleton" style={{ width: '70px', height: '28px', borderRadius: 'var(--radius-md)' }} />
            <div className="skeleton" style={{ width: '70px', height: '28px', borderRadius: 'var(--radius-md)' }} />
          </div>
        </td>
        <td style={{ textAlign: 'right' }}>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <div className="skeleton" style={{ width: '50px', height: '30px', borderRadius: 'var(--radius-md)' }} />
            <div className="skeleton" style={{ width: '60px', height: '30px', borderRadius: 'var(--radius-md)' }} />
          </div>
        </td>
      </tr>
    ))
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, color: 'var(--text-color)' }}>Book Management</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Add new books and assign them to users</p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {selectedIds.size > 0 && (
            <button 
              onClick={handleBulkDelete}
              className="btn btn-danger"
              style={{ padding: '0.6rem 1.2rem', fontWeight: 600, gap: '0.5rem' }}
            >
              🗑️ Delete Selected ({selectedIds.size})
            </button>
          )}

          <button 
            onClick={() => setIsBulkModalOpen(true)}
            className="btn"
            style={{ 
              backgroundColor: 'rgba(99, 102, 241, 0.1)', 
              color: 'var(--primary-color)',
              border: '1px solid var(--primary-color)',
              padding: '0.6rem 1.2rem',
              fontWeight: 600
            }}
          >
            + Add by Author (Excel)
          </button>

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
                    {uniqueAuthors.map(auth => (
                      <div 
                        key={auth}
                        className={`dropdown-item ${selectedAuthor === auth ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedAuthor(auth);
                          setIsFilterOpen(false);
                          setSelectedIds(new Set()); // Clear selection when filter changes
                        }}
                      >
                        {auth}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {isBulkModalOpen && createPortal(
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '1rem',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div className="card" style={{ 
            width: '100%', 
            maxWidth: '900px', 
            maxHeight: '90vh', 
            overflowY: 'auto',
            padding: '2rem',
            backgroundColor: 'var(--surface-color)',
            border: '1px solid var(--border-color)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
            animation: 'modalSlideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            position: 'relative',
            zIndex: 10001
          }}>
            <style>{`
              @keyframes modalSlideUp {
                from { opacity: 0; transform: translateY(20px) scale(0.98); }
                to { opacity: 1; transform: translateY(0) scale(1); }
              }
            `}</style>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, color: 'var(--primary-color)' }}>Bulk Add Books by Author</h2>
              <button 
                onClick={() => setIsBulkModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.5rem' }}
              >✕</button>
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-color)' }}>Author Name</label>
              <input 
                type="text" 
                value={bulkAuthor} 
                onChange={(e) => setBulkAuthor(e.target.value)} 
                placeholder="e.g. DANIEL IBANEZ" 
                style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.03)' }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                <label style={{ fontWeight: 600, color: 'var(--text-color)' }}>
                  {previewBooks.length > 0 ? `Preview (${previewBooks.length} books found)` : 'Paste Excel Data (3 Columns: Title, Link, Price)'}
                </label>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  {previewBooks.some(b => b.isDuplicate) && (
                    <button 
                      onClick={() => {
                        const nonDuplicates = previewBooks.filter(b => !b.isDuplicate);
                        // Reconstruct content to trigger re-parse
                        const newContent = nonDuplicates.map(b => `${b.title}\t${b.link}\t${b.price.toString().replace('.', ',')}`).join('\n');
                        setBulkContent(newContent);
                      }}
                      style={{ 
                        background: 'rgba(239, 68, 68, 0.1)', 
                        border: '1px solid rgba(239, 68, 68, 0.2)', 
                        color: 'var(--danger-color)', 
                        cursor: 'pointer', 
                        fontSize: '0.75rem', 
                        fontWeight: 600,
                        padding: '4px 10px',
                        borderRadius: '6px'
                      }}
                    >
                      Remove Duplicates
                    </button>
                  )}
                  {previewBooks.length > 0 && (
                    <button 
                      onClick={() => setBulkContent("")}
                      style={{ 
                        background: 'rgba(255, 255, 255, 0.05)', 
                        border: '1px solid var(--border-color)', 
                        color: 'var(--text-muted)', 
                        cursor: 'pointer', 
                        fontSize: '0.75rem', 
                        fontWeight: 600,
                        padding: '4px 10px',
                        borderRadius: '6px'
                      }}
                    >
                      Clear Data
                    </button>
                  )}
                </div>
              </div>

              {previewBooks.length === 0 ? (
                <textarea 
                  value={bulkContent}
                  onChange={(e) => setBulkContent(e.target.value)}
                  placeholder="Paste from Excel here... (Title [Tab] Link [Tab] Price)"
                  style={{ 
                    width: '100%', 
                    height: '300px', 
                    fontFamily: 'monospace', 
                    fontSize: '0.9rem',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    border: '2px dashed var(--border-color)',
                    backgroundColor: 'rgba(0,0,0,0.2)',
                    color: 'var(--text-color)',
                    outline: 'none',
                    transition: 'all 0.2s'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary-color)'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                />
              ) : (
                <div style={{ 
                  maxHeight: '450px', 
                  overflowY: 'auto', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '14px',
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.2)'
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--surface-color)', zIndex: 10 }}>
                      <tr>
                        <th style={{ textAlign: 'left', padding: '12px 15px', color: 'var(--text-muted)' }}>Title</th>
                        <th style={{ textAlign: 'left', padding: '12px 15px', color: 'var(--text-muted)' }}>Link</th>
                        <th style={{ textAlign: 'right', padding: '12px 15px', color: 'var(--text-muted)' }}>Price</th>
                        <th style={{ width: '100px', textAlign: 'center', padding: '12px 15px' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewBooks.map((b, idx) => (
                        <tr key={idx} style={{ 
                          borderTop: '1px solid var(--border-color)', 
                          backgroundColor: b.isDuplicate ? 'rgba(239, 68, 68, 0.15)' : b.isValid ? 'transparent' : 'rgba(239, 68, 68, 0.05)',
                          transition: 'background-color 0.2s'
                        }}>
                          <td style={{ padding: '10px 15px', color: b.isDuplicate || !b.isValid ? 'var(--danger-color)' : 'var(--text-color)', fontWeight: 500 }}>
                            {b.title || '(Missing Title)'}
                            {b.isDuplicate && <div style={{ fontSize: '0.7rem', fontWeight: 'normal', opacity: 0.8 }}>Already exists</div>}
                          </td>
                          <td style={{ padding: '10px 15px', color: 'var(--primary-color)', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', opacity: 0.8 }}>
                            {b.link || '(Missing Link)'}
                          </td>
                          <td style={{ padding: '10px 15px', textAlign: 'right', fontWeight: 600 }}>
                            ${b.price.toFixed(2)}
                          </td>
                          <td style={{ padding: '10px 15px', textAlign: 'center', fontSize: '1.1rem' }}>
                            {b.isDuplicate ? '⚠️' : b.isValid ? '✅' : '❌'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
              <button 
                onClick={() => setIsBulkModalOpen(false)}
                className="btn"
                style={{ padding: '0.8rem 1.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'var(--text-color)' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleBulkSubmit}
                className="btn btn-primary"
                disabled={previewBooks.filter(b => b.isValid && !b.isDuplicate).length === 0}
                style={{ padding: '0.8rem 2.5rem', fontWeight: 600, fontSize: '1rem', opacity: previewBooks.filter(b => b.isValid && !b.isDuplicate).length === 0 ? 0.5 : 1 }}
              >
                Import {previewBooks.filter(b => b.isValid && !b.isDuplicate).length} New Books
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Assignment Modal */}
      {assigningBookId && createPortal(
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '1rem',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div className="card" style={{ 
            width: '100%', 
            maxWidth: '500px', 
            maxHeight: '80vh', 
            display: 'flex',
            flexDirection: 'column',
            padding: '1.5rem',
            backgroundColor: 'var(--surface-color)',
            border: '1px solid var(--border-color)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            animation: 'modalSlideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, color: 'var(--primary-color)' }}>Manage Access</h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '350px' }}>
                  {assigningBook?.title}
                </p>
              </div>
              <button onClick={() => setAssigningBookId(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <input 
                type="text" 
                placeholder="Search users..." 
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                style={{ width: '100%', padding: '0.6rem 1rem', fontSize: '0.9rem', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '10px' }}
              />
            </div>

            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1.5rem', paddingRight: '0.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {activeUsers
                  .filter(u => u.username.toLowerCase().includes(userSearch.toLowerCase()))
                  .map(user => {
                    const isAssigned = assigningBook?.assignedUsers?.includes(user.id) || false;
                    const isSaving = savingAssignments.has(`${assigningBookId}:${user.id}`);
                    return (
                      <label key={user.id} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        padding: '0.8rem 1rem',
                        borderRadius: '10px',
                        backgroundColor: isAssigned ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        border: `1px solid ${isAssigned ? 'rgba(99, 102, 241, 0.2)' : 'transparent'}`
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                          <div style={{ 
                            width: '32px', height: '32px', borderRadius: '50%', 
                            backgroundColor: isAssigned ? 'var(--primary-color)' : 'rgba(255,255,255,0.1)', 
                            color: 'white',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.8rem', fontWeight: 600
                          }}>
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          <span style={{ fontWeight: 500, fontSize: '0.95rem', color: isAssigned ? '#fff' : 'var(--text-color)' }}>{user.username}</span>
                        </div>
                        {isSaving ? (
                          <span className="spinner spinner-dark" style={{ width: '16px', height: '16px' }} />
                        ) : (
                          <input 
                            type="checkbox" 
                            checked={isAssigned}
                            onChange={() => toggleAssignment(assigningBookId!, user.id, assigningBook?.assignedUsers || [])}
                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                          />
                        )}
                      </label>
                    );
                  })}
              </div>
            </div>

            <button 
              className="btn btn-primary" 
              onClick={() => {
                setAssigningBookId(null);
                setUserSearch("");
              }}
              style={{ width: '100%', padding: '0.8rem', fontWeight: 600 }}
            >
              Done
            </button>
          </div>
        </div>,
        document.body
      )}

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1.5rem', color: 'var(--primary-color)' }}>
          {editingId ? "Edit Book" : "Add New Book"}
        </h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '150px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Book Title" />
          </div>
          <div style={{ flex: 1, minWidth: '150px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Author</label>
            <input type="text" value={author} onChange={(e) => setAuthor(e.target.value)} required placeholder="Author Name" />
          </div>
          <div style={{ flex: 1, minWidth: '150px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Link</label>
            <input type="url" value={link} onChange={(e) => setLink(e.target.value)} required placeholder="https://..." />
          </div>
          <div style={{ width: '100px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Price ($)</label>
            <input type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} required placeholder="0.00" />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
              {editingId ? "Save" : "Add Book"}
            </button>
            {editingId && (
              <button type="button" onClick={cancelEdit} className="btn" style={{ padding: '0.75rem 1rem', border: '1px solid var(--border-color)', backgroundColor: 'transparent', color: 'var(--text-color)' }}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="card" style={{ padding: '0', overflowX: 'auto' }}>
        <table style={{ width: '100%', minWidth: '800px' }}>
          <thead>
            <tr>
              <th style={{ width: '40px', textAlign: 'center' }}>
                <input 
                  type="checkbox" 
                  checked={filteredBooks.length > 0 && selectedIds.size === filteredBooks.length}
                  onChange={() => handleToggleSelectAll(filteredBooks)}
                  style={{ width: 'auto', cursor: 'pointer' }}
                />
              </th>
              <th style={{ width: '25%' }}>Book Title</th>
              <th style={{ width: '15%' }}>Author</th>
              <th style={{ width: '10%', textAlign: 'right' }}>Price</th>
              <th style={{ width: '25%' }}>Access Control</th>
              <th style={{ width: '25%', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isFetchingData && filteredBooks.length === 0 ? (
              renderSkeletonRows()
            ) : (
              filteredBooks.map(book => (
              <tr key={book.id} style={{ backgroundColor: selectedIds.has(book.id) ? 'rgba(99, 102, 241, 0.05)' : 'transparent' }}>
                <td style={{ textAlign: 'center' }}>
                  <input 
                    type="checkbox" 
                    checked={selectedIds.has(book.id)}
                    onChange={() => handleToggleSelect(book.id)}
                    style={{ width: 'auto', cursor: 'pointer' }}
                  />
                </td>
                <td style={{ fontWeight: 500 }}>{book.title}</td>
                <td style={{ color: 'var(--text-muted)' }}>{book.author}</td>
                <td style={{ textAlign: 'right' }}>${book.price.toFixed(2)}</td>
                <td>
                  <button 
                    onClick={() => setAssigningBookId(book.id)}
                    className="btn"
                    style={{ 
                      padding: '0.5rem 1rem', 
                      fontSize: '0.85rem', 
                      backgroundColor: 'rgba(99, 102, 241, 0.1)', 
                      color: 'var(--primary-color)',
                      border: '1px solid rgba(99, 102, 241, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      fontWeight: 600,
                      borderRadius: '8px'
                    }}
                  >
                    👤 {book.assignedUsers?.length || 0} Assigned
                  </button>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button 
                    onClick={() => startEdit(book)}
                    className="btn" 
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.875rem', marginRight: '0.5rem', backgroundColor: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary-color)' }}
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to delete "${book.title}"?`)) {
                        deleteBook(book.id);
                      }
                    }}
                    className="btn btn-danger" 
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.875rem' }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
