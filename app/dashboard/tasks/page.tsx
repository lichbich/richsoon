"use client";

import { useState } from "react";
import { useAppContext } from "../../context/AppContext";

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
                  
                  return (
                    <td key={u.id} style={{ textAlign: 'center' }}>
                      {isCurrentUser && isAssigned ? (
                        <input
                          type="number"
                          min="0"
                          value={count || ''}
                          onChange={(e) => updateTaskCount(book.id, parseInt(e.target.value) || 0)}
                          style={{ 
                            width: '60px', 
                            padding: '0.25rem', 
                            textAlign: 'center',
                            margin: '0 auto'
                          }}
                          placeholder="0"
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
