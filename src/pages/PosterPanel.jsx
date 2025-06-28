import { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc, query, where } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function PosterPanel() {
  const [gigs, setGigs] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [deadline, setDeadline] = useState("");
  const [editingGigId, setEditingGigId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserAndGigs = async () => {
      const user = auth.currentUser;
      if (!user) {
        navigate("/");
        return;
      }
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists() || userDoc.data().role !== "poster") {
        navigate("/");
        return;
      }
      setUserRole("poster");
      // Fetch only gigs posted by this user
      const gigsQuery = query(collection(db, "gigs"), where("postedBy", "==", user.uid));
      const gigsSnapshot = await getDocs(gigsQuery);
      const gigsList = gigsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setGigs(gigsList);
      setLoading(false);
    };
    fetchUserAndGigs();
  }, [navigate]);

  const resetForm = () => {
    setEditingGigId(null);
    setTitle("");
    setDescription("");
    setPrice("");
    setDeadline("");
  };

  const handleAddOrUpdateGig = async (e) => {
    e.preventDefault();
    if (!title || !description || !price || !deadline) return alert("All fields required");
    const user = auth.currentUser;
    if (!user) return;
    if (editingGigId) {
      const gigRef = doc(db, "gigs", editingGigId);
      await updateDoc(gigRef, {
        title,
        description,
        price: parseFloat(price),
        deadline: new Date(deadline)
      });
    } else {
      await addDoc(collection(db, "gigs"), {
        title,
        description,
        price: parseFloat(price),
        deadline: new Date(deadline),
        status: "available",
        paymentStatus: "unpaid",
        postedBy: user.uid
      });
    }
    resetForm();
    setLoading(true);
    // Refresh gigs
    const gigsQuery = query(collection(db, "gigs"), where("postedBy", "==", auth.currentUser.uid));
    const gigsSnapshot = await getDocs(gigsQuery);
    const gigsList = gigsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setGigs(gigsList);
    setLoading(false);
  };

  const editGig = (gig) => {
    setEditingGigId(gig.id);
    setTitle(gig.title);
    setDescription(gig.description);
    setPrice(gig.price);
    setDeadline(
      gig.deadline?.seconds
        ? new Date(gig.deadline.seconds * 1000).toISOString().split("T")[0]
        : ""
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteGig = async (gigId) => {
    if (window.confirm("Are you sure you want to delete this gig?")) {
      await deleteDoc(doc(db, "gigs", gigId));
      setGigs(gigs.filter(g => g.id !== gigId));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="glass-panel p-8 rounded-3xl">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-cyan-400 border-t-transparent"></div>
            <span className="text-white text-lg font-medium">Loading your gigs...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      <div className="relative z-10 max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Back to Home Button */}
        <button
          onClick={() => navigate("/")}
          className="glass-button bg-gradient-to-r from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30 text-white px-6 py-3 rounded-2xl font-semibold mb-6 border border-blue-400/30"
        >
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </span>
        </button>
        <div className="glass-panel rounded-3xl p-6 sm:p-8 mb-8">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent mb-6">
            {editingGigId ? "✏️ Edit Your Gig" : "✨ Post a New Gig"}
          </h2>
          <form onSubmit={handleAddOrUpdateGig} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-slate-300 text-sm font-medium">Title</label>
                <input
                  type="text"
                  placeholder="Enter gig title..."
                  className="w-full glass-input bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all duration-300"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-slate-300 text-sm font-medium">Price ($)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  className="w-full glass-input bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all duration-300"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-slate-300 text-sm font-medium">Description</label>
              <textarea
                placeholder="Describe the gig requirements..."
                rows={4}
                className="w-full glass-input bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all duration-300 resize-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-slate-300 text-sm font-medium">Deadline</label>
              <input
                type="date"
                className="w-full glass-input bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all duration-300"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                className="glass-button bg-gradient-to-r from-emerald-500/20 to-green-500/20 hover:from-emerald-500/30 hover:to-green-500/30 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/25 border border-emerald-400/30"
              >
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  {editingGigId ? "Update Gig" : "Create Gig"}
                </span>
              </button>
              {editingGigId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="glass-button bg-gradient-to-r from-slate-500/20 to-slate-400/20 hover:from-slate-500/30 hover:to-slate-400/30 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-slate-500/25 border border-slate-400/30"
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Cancel
                  </span>
                </button>
              )}
            </div>
          </form>
        </div>
        
        {/* Statistics Overview */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 mb-8">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent mb-6">
            📊 Your Gig Statistics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-400/20 rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold text-blue-300 mb-1">{gigs.length}</div>
              <div className="text-blue-200 text-sm">Total Gigs</div>
            </div>
            <div className="bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-400/20 rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold text-emerald-300 mb-1 flex items-center justify-center gap-2">
                {gigs.filter(g => g.status === "approved" && g.completedWork).length}
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="text-emerald-200 text-sm">Completed Work</div>
            </div>
            <div className="bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-400/20 rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold text-amber-300 mb-1">
                {gigs.filter(g => g.status === "available" || g.status === "claimed" || g.status === "submitted").length}
              </div>
              <div className="text-amber-200 text-sm">In Progress</div>
            </div>
          </div>
        </div>
        
        <div className="glass-panel rounded-3xl p-6 sm:p-8">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent mb-6">
            Your Gigs ({gigs.length})
          </h2>
          {gigs.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-slate-600/50 to-slate-500/50 flex items-center justify-center">
                <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No gigs posted yet</h3>
              <p className="text-slate-400">Use the form above to post your first gig</p>
            </div>
          ) : (
            <div className="space-y-6">
              {gigs.map((gig) => (
                <div key={gig.id} className="glass-panel rounded-2xl p-6 hover:shadow-2xl hover:shadow-cyan-500/10 transition-all duration-500 hover:scale-[1.01] group">
                  <div className="flex flex-col lg:flex-row lg:justify-between gap-6">
                    <div className="flex-1 space-y-4">
                      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-200 transition-colors duration-300">
                        {gig.title}
                      </h3>
                      <p className="text-slate-300 text-sm leading-relaxed">
                        {gig.description}
                      </p>
                      <div className="flex flex-wrap gap-3 text-sm mt-2">
                        <div className="flex items-center gap-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 px-3 py-2 rounded-xl border border-green-400/30">
                          <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                          <span className="text-green-300 font-semibold">${gig.price}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 px-3 py-2 rounded-xl border border-blue-400/30">
                          <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h3a1 1 0 011 1v9a2 2 0 01-2 2H5a2 2 0 01-2-2V8a1 1 0 011-1h3z" />
                          </svg>
                          <span className="text-blue-300 font-medium">
                            {gig.deadline?.seconds ? new Date(gig.deadline.seconds * 1000).toLocaleDateString() : "N/A"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 px-3 py-2 rounded-xl border border-purple-400/30">
                          <div className={`w-2 h-2 rounded-full ${gig.status === "available" ? "bg-green-400 animate-pulse" : gig.status === "claimed" ? "bg-yellow-400" : gig.status === "submitted" ? "bg-orange-400" : gig.status === "approved" ? "bg-emerald-400" : "bg-blue-400"}`}></div>
                          <span className={`font-medium ${gig.status === "available" ? "text-green-300" : gig.status === "claimed" ? "text-yellow-300" : gig.status === "submitted" ? "text-orange-300" : gig.status === "approved" ? "text-emerald-300" : "text-blue-300"}`}>
                            {gig.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 bg-gradient-to-r from-slate-500/20 to-slate-400/20 px-3 py-2 rounded-xl border border-slate-400/30">
                          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                          <span className="text-slate-300 font-medium">
                            {gig.paymentStatus || "unpaid"}
                          </span>
                        </div>
                      </div>
                      
                      {/* Completed Work Section */}
                      {gig.status === "approved" && gig.completedWork && (
                        <div className="mt-4 p-4 bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-400/20 rounded-2xl">
                          <h4 className="font-semibold text-emerald-200 mb-2 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            ✅ Completed Work Available
                          </h4>
                          <p className="text-emerald-100 text-sm mb-3">
                            Your work has been completed and approved. You can now download the final document.
                          </p>
                          <a
                            href={gig.completedWork}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500/20 to-green-500/20 hover:from-emerald-500/30 hover:to-green-500/30 text-emerald-200 px-4 py-2 rounded-xl font-semibold transition-all duration-300 hover:scale-105 border border-emerald-400/30"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Download Completed Work
                          </a>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-3 lg:min-w-[200px] mt-4 lg:mt-0">
                      <div className="flex gap-2">
                        <button
                          onClick={() => editGig(gig)}
                          className="flex-1 glass-button bg-gradient-to-r from-amber-500/20 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 text-white px-4 py-3 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-amber-500/25 border border-amber-400/30"
                        >
                          <span className="flex items-center justify-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </span>
                        </button>
                        <button
                          onClick={() => deleteGig(gig.id)}
                          className="flex-1 glass-button bg-gradient-to-r from-red-500/20 to-pink-500/20 hover:from-red-500/30 hover:to-pink-500/30 text-white px-4 py-3 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-red-500/25 border border-red-400/30"
                        >
                          <span className="flex items-center justify-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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