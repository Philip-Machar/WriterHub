import { Navigate, useLocation } from "react-router-dom";
import { auth, db } from "../firebase";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function PrivateRoute({ children, adminOnly }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setRole(userSnap.data().role);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden flex items-center justify-center">
      {/* Floating Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-cyan-400/20 to-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-purple-400/20 to-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-gradient-to-r from-indigo-400/20 to-cyan-500/20 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>
      <div className="relative z-10">
        <div className="glass-panel p-12 rounded-3xl flex flex-col items-center shadow-2xl">
          {/* Beautiful Spinner */}
          <div className="relative mb-6">
            <div className="w-16 h-16 rounded-full border-4 border-cyan-400 border-t-transparent animate-spin-slow shadow-lg shadow-cyan-400/30"></div>
            <div className="absolute inset-0 rounded-full bg-cyan-400/10 blur-2xl animate-pulse"></div>
          </div>
          <span className="text-white text-2xl font-bold mb-2 tracking-wide">Checking permissions...</span>
          <span className="text-cyan-200 text-lg opacity-80">Please wait while we verify your access</span>
        </div>
      </div>
      <style jsx>{`
        .drop-shadow-glow {
          filter: drop-shadow(0 0 24px #7f5af0aa) drop-shadow(0 0 32px #a3c9f9aa);
        }
        .animate-spin-slow {
          animation: spin 2s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
}
