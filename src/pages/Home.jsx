import { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { collection, getDocs, doc, updateDoc, getDoc, arrayUnion } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

function Home() {
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("");
  const navigate = useNavigate();

  const fetchGigs = async () => {
    const gigsCol = collection(db, "gigs");
    const gigsSnapshot = await getDocs(gigsCol);
    const gigsList = gigsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setGigs(gigsList);
    setLoading(false);
  };

  useEffect(() => {
    const fetchEverything = async () => {
      await fetchGigs();

      const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
      if (userDoc.exists()) {
        setUserRole(userDoc.data().role);
      }
    };

    fetchEverything();
  }, []);

  const handleApply = async (gig) => {
    const user = auth.currentUser;
    if (!user) {
      console.log("Please login to apply for gigs");
      return;
    }
    // If already applied or gig is claimed, do nothing
    if (gig.claimedBy || (gig.applicants && gig.applicants.some(a => a.uid === user.uid))) return;
    const gigRef = doc(db, "gigs", gig.id);
    await updateDoc(gigRef, {
      applicants: arrayUnion({ uid: user.uid, email: user.email })
    });
    fetchGigs();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="glass-panel p-8 rounded-3xl">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-cyan-400 border-t-transparent"></div>
            <span className="text-white text-lg font-medium">Loading gigs...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Floating Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-cyan-400/20 to-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-purple-400/20 to-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-gradient-to-r from-indigo-400/20 to-cyan-500/20 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 mb-8 backdrop-blur-xl">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-white via-cyan-200 to-blue-300 bg-clip-text text-transparent mb-2">
                Available Writing Gigs
              </h1>
              <p className="text-slate-300 text-sm sm:text-base">
                Logged in as: <span className="text-cyan-300 font-medium">{auth.currentUser?.email}</span>
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              {userRole === "admin" && (
                <button
                  onClick={() => navigate("/admin")}
                  className="glass-button bg-gradient-to-r from-purple-500/20 to-indigo-500/20 hover:from-purple-500/30 hover:to-indigo-500/30 text-white px-6 py-3 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25 border border-purple-400/30"
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Admin Panel
                  </span>
                </button>
              )}
              <button
                onClick={() => navigate("/about")}
                className="glass-button bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 text-white px-6 py-3 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/25 border border-cyan-400/30"
              >
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h10a2 2 0 012 2v14a2 2 0 01-2 2z" />
                  </svg>
                  About
                </span>
              </button>
              <button
                onClick={() => {
                  auth.signOut();
                  console.log("Logout");
                  // navigate("/login");
                }}
                className="glass-button bg-gradient-to-r from-red-500/20 to-pink-500/20 hover:from-red-500/30 hover:to-pink-500/30 text-white px-6 py-3 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-red-500/25 border border-red-400/30"
              >
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* No Gigs Message */}
        {gigs.length === 0 && (
          <div className="glass-panel rounded-3xl p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-slate-600/50 to-slate-500/50 flex items-center justify-center">
                <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No gigs available</h3>
              <p className="text-slate-400">Check back later for new writing opportunities</p>
            </div>
          </div>
        )}

        {/* Gigs Grid */}
        <div className="grid gap-6 md:gap-8">
          {gigs.map((gig) => (
            <div
              key={gig.id}
              className="glass-panel rounded-3xl p-6 sm:p-8 hover:shadow-2xl hover:shadow-cyan-500/10 transition-all duration-500 hover:scale-[1.01] group cursor-pointer"
              onClick={() => navigate(`/gig/${gig.id}`)}
            >
              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
                <div className="flex-1 space-y-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 group-hover:text-cyan-200 transition-colors duration-300">
                      {gig.title}
                    </h2>
                    <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                      {gig.description.length > 300 ? gig.description.slice(0, 300) + "..." : gig.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 px-4 py-2 rounded-xl border border-green-400/30">
                      <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                      <span className="text-green-300 font-semibold">${gig.price}</span>
                    </div>

                    <div className="flex items-center gap-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 px-4 py-2 rounded-xl border border-blue-400/30">
                      <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h3a1 1 0 011 1v9a2 2 0 01-2 2H5a2 2 0 01-2-2V8a1 1 0 011-1h3z" />
                      </svg>
                      <span className="text-blue-300 font-medium">
                        {new Date(gig.deadline.seconds * 1000).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 px-4 py-2 rounded-xl border border-purple-400/30">
                      <div className={`w-2 h-2 rounded-full ${gig.status === "available" ? "bg-green-400 animate-pulse" : gig.status === "claimed" ? "bg-yellow-400" : "bg-blue-400"}`}></div>
                      <span className={`font-medium ${gig.status === "available" ? "text-green-300" : gig.status === "claimed" ? "text-yellow-300" : "text-blue-300"}`}>
                        {gig.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 bg-gradient-to-r from-slate-500/20 to-slate-400/20 px-4 py-2 rounded-xl border border-slate-400/30">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      <span className="text-slate-300 font-medium">
                        {gig.paymentStatus || "unpaid"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row lg:flex-col gap-3 lg:min-w-[200px]">
                  {gig.status === "available" && !gig.claimedBy && (
                    <button
                      onClick={e => { e.stopPropagation(); handleApply(gig); }}
                      disabled={gig.applicants && gig.applicants.some(a => a.uid === auth.currentUser?.uid)}
                      className={`glass-button bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 text-white px-6 py-4 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/25 border border-cyan-400/30 group/btn ${gig.applicants && gig.applicants.some(a => a.uid === auth.currentUser?.uid) ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5 group-hover/btn:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                        </svg>
                        {gig.applicants && gig.applicants.some(a => a.uid === auth.currentUser?.uid) ? 'Applied' : 'Apply for Gig'}
                      </span>
                    </button>
                  )}
                  {gig.claimedBy === auth.currentUser?.uid && (
                    <button
                      onClick={e => { e.stopPropagation(); navigate(`/submit/${gig.id}`); }}
                      className="glass-button bg-gradient-to-r from-emerald-500/20 to-green-500/20 hover:from-emerald-500/30 hover:to-green-500/30 text-white px-6 py-4 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/25 border border-emerald-400/30 group/btn"
                    >
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5 group-hover/btn:translate-y-[-2px] transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        Submit Work
                      </span>
                    </button>
                  )}
                  {gig.status === "submitted" && gig.claimedBy === auth.currentUser?.uid && (
                    <div className="bg-gradient-to-r from-amber-500/20 to-yellow-500/20 px-6 py-4 rounded-2xl border border-amber-400/30 text-center">
                      <div className="flex items-center justify-center gap-2 text-amber-300 font-semibold">
                        <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Submitted
                      </div>
                      <p className="text-xs text-amber-200 mt-1">Work under review</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx global>{`
        .glass-panel {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 
            0 8px 32px 0 rgba(31, 38, 135, 0.37),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .glass-button {
          backdrop-filter: blur(20px);
          box-shadow: 
            0 4px 16px 0 rgba(31, 38, 135, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .glass-button:hover {
          box-shadow: 
            0 8px 32px 0 rgba(31, 38, 135, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.15);
        }

        @media (max-width: 640px) {
          .glass-panel {
            backdrop-filter: blur(15px);
          }
        }
      `}</style>
    </div>
  );
}

export default Home;