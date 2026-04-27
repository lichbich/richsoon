"use client";

import { useState } from "react";
import { useAppContext } from "../../context/AppContext";

export default function BooksPage() {
  const { currentUser, books, users, addBook, editBook, deleteBook, updateBookAssignments, isFetchingData } = useAppContext();
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [link, setLink] = useState("");
  const [price, setPrice] = useState("");
  const [selectedAuthor, setSelectedAuthor] = useState("All");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [savingAssignments, setSavingAssignments] = useState<Set<string>>(new Set());

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

  const activeUsers = users.filter(u => u.role !== "Guest");

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

  const uniqueAuthors = ["All", ...Array.from(new Set(books.map(b => b.author).filter(Boolean)))];
  const filteredBooks = selectedAuthor === "All" ? books : books.filter(b => b.author === selectedAuthor);

  const renderSkeletonRows = () => (
    Array.from({ length: 3 }).map((_, i) => (
      <tr key={`skeleton-${i}`}>
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
              <th style={{ width: '20%' }}>Book Title</th>
              <th style={{ width: '15%' }}>Author</th>
              <th style={{ width: '10%', textAlign: 'right' }}>Price</th>
              <th style={{ width: '40%' }}>Assigned Users</th>
              <th style={{ width: '15%', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isFetchingData && filteredBooks.length === 0 ? (
              renderSkeletonRows()
            ) : (
              filteredBooks.map(book => (
              <tr key={book.id}>
                <td style={{ fontWeight: 500 }}>{book.title}</td>
                <td style={{ color: 'var(--text-muted)' }}>{book.author}</td>
                <td style={{ textAlign: 'right' }}>${book.price.toFixed(2)}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {activeUsers.map(user => {
                      const isAssigned = book.assignedUsers?.includes(user.id);
                      const isSaving = savingAssignments.has(`${book.id}:${user.id}`);
                      return (
                        <label key={user.id} style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.4rem',
                          cursor: isSaving ? 'wait' : 'pointer',
                          padding: '0.3rem 0.6rem',
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: isAssigned ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                          border: `1px solid ${isAssigned ? 'var(--primary-color)' : 'var(--border-color)'}`,
                          opacity: isSaving ? 0.6 : 1,
                          transition: 'all 0.2s ease',
                          position: 'relative',
                        }}>
                          {isSaving ? (
                            <span className="spinner spinner-dark" style={{ width: '14px', height: '14px', borderWidth: '2px' }} />
                          ) : (
                            <input 
                              type="checkbox" 
                              checked={isAssigned}
                              onChange={() => toggleAssignment(book.id, user.id, book.assignedUsers || [])}
                              style={{ width: 'auto', margin: 0 }}
                            />
                          )}
                          <span style={{ 
                            fontSize: '0.875rem',
                            color: isAssigned ? 'var(--primary-color)' : 'var(--text-color)'
                          }}>
                            {user.username}
                          </span>
                        </label>
                      );
                    })}
                  </div>
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
