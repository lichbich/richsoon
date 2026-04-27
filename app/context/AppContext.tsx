"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";

export type Role = "Admin" | "User" | "Guest";

export interface User {
  id: string;
  username: string;
  role: Role;
  last_active?: number;
  avatarUrl?: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  link: string;
  price: number;
  assignedUsers: string[];
}

type TaskCounts = Record<string, Record<string, number>>;

interface AppState {
  currentUser: User | null;
  isLoading: boolean;
  isFetchingData: boolean;
  users: User[];
  books: Book[];
  taskCounts: TaskCounts;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (username: string, password: string) => Promise<boolean>;
  updateUserRole: (userId: string, newRole: Role) => void;
  deleteUser: (userId: string) => void;
  updateTaskCount: (bookId: string, count: number) => Promise<void>;
  addBook: (title: string, author: string, link: string, price: number, assignedUsers: string[]) => void;
  editBook: (bookId: string, title: string, author: string, link: string, price: number) => void;
  deleteBook: (bookId: string) => void;
  updateBookAssignments: (bookId: string, assignedUsers: string[]) => Promise<void>;
  updateProfile: (userId: string, data: { username?: string, password?: string, avatarUrl?: string }) => Promise<boolean>;
  fetchData: () => Promise<void>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://manarich.onrender.com/api";

const AppContext = createContext<AppState | undefined>(undefined);

const SESSION_KEY = 'richsoon_session';

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingData, setIsFetchingData] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [taskCounts, setTaskCounts] = useState<TaskCounts>({});

  // Restore session from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SESSION_KEY);
      if (saved) {
        const user = JSON.parse(saved) as User;
        setCurrentUser(user);
      }
    } catch (err) {
      localStorage.removeItem(SESSION_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchData = async () => {
    setIsFetchingData(true);
    try {
      const [usersRes, booksRes, tasksRes] = await Promise.all([
        fetch(`${API_URL}/users`).catch(() => null),
        fetch(`${API_URL}/books`).catch(() => null),
        fetch(`${API_URL}/taskCounts`).catch(() => null)
      ]);
      
      if (usersRes?.ok) setUsers(await usersRes.json() || []);
      if (booksRes?.ok) setBooks(await booksRes.json() || []);
      if (tasksRes?.ok) setTaskCounts(await tasksRes.json() || {});
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setIsFetchingData(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Heartbeat mechanism
  useEffect(() => {
    if (!currentUser) return;

    const pingHeartbeat = () => {
      fetch(`${API_URL}/users/${currentUser.id}/heartbeat`, { method: 'POST' }).catch(() => {});
    };

    // Ping immediately on login/mount
    pingHeartbeat();

    // Ping every 1 minute
    const interval = setInterval(pingHeartbeat, 60 * 1000);

    // Send beacon on unload
    const handleUnload = () => {
      navigator.sendBeacon(`${API_URL}/users/${currentUser.id}/offline`);
    };
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleUnload);
      handleUnload(); // Also set offline when component unmounts (e.g., logout)
    };
  }, [currentUser]);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setCurrentUser(data.user);
        localStorage.setItem(SESSION_KEY, JSON.stringify(data.user));
        return true;
      } else {
        alert(data.error || "Login failed");
        return false;
      }
    } catch (err) {
      alert("Error connecting to server");
      return false;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(SESSION_KEY);
  };

  const register = async (username: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, role: "Guest" }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        alert(errorData.error || "Registration failed");
        return false;
      }
      
      fetchData();
      alert("Registered successfully. Please wait for an Admin to approve your role.");
      return true;
    } catch (err) {
      alert("Registration failed");
      return false;
    }
  };

  const updateUserRole = async (userId: string, newRole: Role) => {
    if (currentUser?.role !== "Admin") return;
    try {
      await fetch(`${API_URL}/users/${userId}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      fetchData();
    } catch (err) {}
  };

  const deleteUser = async (userId: string) => {
    if (currentUser?.role !== "Admin") return;
    try {
      await fetch(`${API_URL}/users/${userId}`, { method: "DELETE" });
      fetchData();
    } catch (err) {}
  };

  const updateTaskCount = async (bookId: string, count: number) => {
    if (!currentUser || currentUser.role === "Guest") return;
    try {
      await fetch(`${API_URL}/taskCounts/${bookId}/${currentUser.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count }),
      });
      fetchData();
    } catch (err) {}
  };

  const addBook = async (title: string, author: string, link: string, price: number, assignedUsers: string[]) => {
    if (currentUser?.role !== "Admin") return;
    try {
      await fetch(`${API_URL}/books`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, author, link, price, assignedUsers }),
      });
      fetchData();
    } catch (err) {}
  };

  const editBook = async (bookId: string, title: string, author: string, link: string, price: number) => {
    if (currentUser?.role !== "Admin") return;
    try {
      await fetch(`${API_URL}/books/${bookId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, author, link, price }),
      });
      fetchData();
    } catch (err) {}
  };

  const deleteBook = async (bookId: string) => {
    if (currentUser?.role !== "Admin") return;
    try {
      await fetch(`${API_URL}/books/${bookId}`, { method: "DELETE" });
      fetchData();
    } catch (err) {}
  };

  const updateBookAssignments = async (bookId: string, assignedUsers: string[]) => {
    if (currentUser?.role !== "Admin") return;
    try {
      await fetch(`${API_URL}/books/${bookId}/assignments`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedUsers }),
      });
      fetchData();
    } catch (err) {}
  };

  const updateProfile = async (userId: string, data: { username?: string, password?: string, avatarUrl?: string }): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/users/${userId}/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        if (currentUser?.id === userId) {
          setCurrentUser(resData.user);
          localStorage.setItem(SESSION_KEY, JSON.stringify(resData.user));
        }
        fetchData();
        return true;
      } else {
        alert(resData.error || "Failed to update profile");
        return false;
      }
    } catch (err) {
      console.error(err);
      alert("Error updating profile");
      return false;
    }
  };

  return (
    <AppContext.Provider
      value={{
        isLoading,
        isFetchingData,
        currentUser,
        users,
        books,
        taskCounts,
        login,
        logout,
        register,
        updateUserRole,
        deleteUser,
        updateTaskCount,
        addBook,
        editBook,
        deleteBook,
        updateBookAssignments,
        updateProfile,
        fetchData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
