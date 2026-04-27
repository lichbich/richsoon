"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "./context/AppContext";

export default function Home() {
  const { currentUser, isLoading } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (currentUser) {
      router.push("/dashboard/tasks");
    } else {
      router.push("/login");
    }
  }, [currentUser, isLoading, router]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div className="animate-fade-in" style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--primary-color)' }}>
        Loading Richsoon...
      </div>
    </div>
  );
}
