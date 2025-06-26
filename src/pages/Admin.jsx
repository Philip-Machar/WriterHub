import { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

function Admin() {
  const [gigs, setGigs] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [deadline, setDeadline] = useState("");
  const [editingGigId, setEditingGigId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claimedEmails, setClaimedEmails] = useState({});
  const [posterApplicants, setPosterApplicants] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserRole, setCurrentUserRole] = useState("");
  const [userLoading, setUserLoading] = useState(true);
  const navigate = useNavigate();

  const fetchGigs = async () => {
    setLoading(true);
    const gigsCol = collection(db, "gigs");
    const gigsSnapshot = await getDocs(gigsCol);
    const gigsList = gigsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setGigs(gigsList);
    setLoading(false);

    // Fetch claimed user emails
    const claimedByUids = gigsList
      .filter(gig => gig.claimedBy)
      .map(gig => gig.claimedBy);
    const uniqueUids = [...new Set(claimedByUids)];
    const emails = {};
    await Promise.all(uniqueUids.map(async (uid) => {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        emails[uid] = userDoc.data().email;
      }
    }));
    setClaimedEmails(emails);
  };

  const fetchPosterApplicants = async () => {
    const usersCol = collection(db, "users");
    const usersSnapshot = await getDocs(usersCol);
    const applicants = usersSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(user => user.posterApplicationStatus === "pending");
    setPosterApplicants(applicants);
  };

  useEffect(() => {
    const fetchUser = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setCurrentUser({ uid: user.uid, email: user.email });
          setCurrentUserRole(userDoc.data().role);
        }
      }
      setUserLoading(false);
    };
    fetchUser();
  }, []);

  const handleAddOrUpdateGig = async (e) => {
    e.preventDefault();
    if (!title || !description || !price || !deadline) return alert("All fields required");

    if (editingGigId) {
      const gigRef = doc(db, "gigs", editingGigId);
      await updateDoc(gigRef, {
        title,
        description,
        price: parseFloat(price),
        deadline: new Date(deadline)
      });
    } else {
      // Only allow posters and admins to create gigs
      if (currentUserRole !== "admin" && currentUserRole !== "poster") {
        alert("You do not have permission to post gigs.");
        return;
      }
      await addDoc(collection(db, "gigs"), {
        title,
        description,
        price: parseFloat(price),
        deadline: new Date(deadline),
        status: "available",
        paymentStatus: "unpaid",
        postedBy: currentUser?.uid || null
      });
    }

    resetForm();
    fetchGigs();
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
    if (confirm("Are you sure you want to delete this gig?")) {
      await deleteDoc(doc(db, "gigs", gigId));
      fetchGigs();
    }
  };

  const approveGig = async (gigId) => {
    await updateDoc(doc(db, "gigs", gigId), { status: "approved" });
    fetchGigs();
  };

  const markAsPaid = async (gigId) => {
    await updateDoc(doc(db, "gigs", gigId), { paymentStatus: "paid" });
    fetchGigs();
  };

  const approveApplicant = async (gigId, applicant) => {
    await updateDoc(doc(db, "gigs", gigId), {
      claimedBy: applicant.uid,
      status: "claimed",
      applicants: []
    });
    fetchGigs();
  };

  const approvePoster = async (userId) => {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { role: "poster", posterApplicationStatus: "approved" });
    fetchPosterApplicants();
  };

  const rejectPoster = async (userId) => {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { posterApplicationStatus: "rejected" });
    fetchPosterApplicants();
  };

  const resetForm = () => {
    setEditingGigId(null);
    setTitle("");
    setDescription("");
    setPrice("");
    setDeadline("");
  };

  const handleLogout = () => {
    auth.signOut();
    navigate("/login");
  };

  useEffect(() => {
    fetchGigs();
    fetchPosterApplicants();
  }, []);

  if (loading || userLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="glass-panel p-8 rounded-3xl">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-cyan-400 border-t-transparent"></div>
            <span className="text-white text-lg font-medium">Loading admin panel...</span>
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
                Admin Dashboard
              </h1>
              <p className="text-slate-300 text-sm sm:text-base">
                Manage gigs and oversee platform operations
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate("/")}
                className="glass-button bg-gradient-to-r from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30 text-white px-6 py-3 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25 border border-blue-400/30"
              >
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Back to Home
                </span>
              </button>

              <button
                onClick={handleLogout}
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

        {/* Poster Applications Management */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 mb-8">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent mb-6">
            📝 Poster Applications
          </h2>
          {posterApplicants.length === 0 ? (
            <p className="text-slate-300">No pending poster applications.</p>
          ) : (
            <div className="space-y-4">
              {posterApplicants.map(applicant => (
                <div key={applicant.id} className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between bg-cyan-900/10 rounded-xl px-4 py-3">
                  <span className="text-cyan-100 font-medium">{applicant.email}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => approvePoster(applicant.id)}
                      className="glass-button bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-white px-4 py-2 rounded-xl font-semibold border border-emerald-400/30 hover:scale-105 transition-all"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => rejectPoster(applicant.id)}
                      className="glass-button bg-gradient-to-r from-red-500/20 to-pink-500/20 text-white px-4 py-2 rounded-xl font-semibold border border-red-400/30 hover:scale-105 transition-all"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Gig Form */}
        {(currentUserRole === "admin" || currentUserRole === "poster") && (
        <div className="glass-panel rounded-3xl p-6 sm:p-8 mb-8">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent mb-6">
            {editingGigId ? "✏️ Edit Gig" : "✨ Create New Gig"}
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
        )}

        {/* Gigs Management Section */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent mb-6">
            🎯 Manage Gigs ({gigs.length})
          </h2>

          {gigs.length === 0 && (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-slate-600/50 to-slate-500/50 flex items-center justify-center">
                <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No gigs created yet</h3>
              <p className="text-slate-400">Create your first gig using the form above</p>
            </div>
          )}

          <div className="space-y-6">
            {gigs.map((gig) => {
              // Only show edit/delete for posters if they posted the gig
              const canEditOrDelete =
                currentUserRole === "admin" || (currentUserRole === "poster" && gig.postedBy === currentUser?.uid);
              return (
                <div key={gig.id} className="glass-panel rounded-2xl p-6 hover:shadow-2xl hover:shadow-cyan-500/10 transition-all duration-500 hover:scale-[1.01] group">
                  <div className="flex flex-col lg:flex-row lg:justify-between gap-6">
                    <div className="flex-1 space-y-4">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-200 transition-colors duration-300">
                          {gig.title}
                        </h3>
                        <p className="text-slate-300 text-sm leading-relaxed">
                          {gig.description}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-3 text-sm">
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
                            {gig.deadline?.seconds
                              ? new Date(gig.deadline.seconds * 1000).toLocaleDateString()
                              : "N/A"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 px-3 py-2 rounded-xl border border-purple-400/30">
                          <div className={`w-2 h-2 rounded-full ${
                            gig.status === "available" ? "bg-green-400 animate-pulse" : 
                            gig.status === "claimed" ? "bg-yellow-400" : 
                            gig.status === "submitted" ? "bg-orange-400" : 
                            "bg-blue-400"
                          }`}></div>
                          <span className={`font-medium ${
                            gig.status === "available" ? "text-green-300" : 
                            gig.status === "claimed" ? "text-yellow-300" : 
                            gig.status === "submitted" ? "text-orange-300" : 
                            "text-blue-300"
                          }`}>
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

                      {/* Applicants Section */}
                      {gig.applicants && gig.applicants.length > 0 && !gig.claimedBy && (
                        <div className="w-full mt-3 mb-4">
                          <div className="rounded-xl bg-cyan-900/20 px-4 py-2 flex flex-col gap-2">
                            <span className="font-semibold text-cyan-300 mb-1">Applicants:</span>
                            {gig.applicants.map(applicant => (
                              <div key={applicant.uid} className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between bg-cyan-900/10 rounded-lg px-3 py-2">
                                <span className="text-cyan-100 break-all">{applicant.email}</span>
                                <button
                                  onClick={() => approveApplicant(gig.id, applicant)}
                                  className="glass-button bg-gradient-to-r from-emerald-500/20 to-green-500/20 hover:from-emerald-500/30 hover:to-green-500/30 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-300 hover:scale-105 border border-emerald-400/30"
                                >
                                  Approve
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {(gig.claimedBy && claimedEmails[gig.claimedBy]) && (
                        <div className="w-full mt-3 mb-4">
                          <div className="rounded-xl bg-cyan-900/20 px-4 py-2 flex flex-col sm:flex-row sm:items-center gap-2">
                            <span className="font-semibold text-cyan-300">Claimed by:</span>
                            <span className="text-cyan-100 break-all">{claimedEmails[gig.claimedBy]}</span>
                          </div>
                        </div>
                      )}

                      {/* Submission Section */}
                      {gig.status === "submitted" && (
                        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-400/20 rounded-2xl p-4">
                          <h4 className="font-semibold text-amber-200 mb-2 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Submitted Work:
                          </h4>
                          {gig.submission?.startsWith("http") ? (
                            <a
                              href={gig.submission}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-cyan-400 hover:text-cyan-300 underline transition-colors duration-300"
                            >
                              📎 Download Submitted File
                            </a>
                          ) : (
                            <p className="bg-white/5 p-3 rounded-xl text-slate-200 text-sm">
                              {gig.submission}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-3 lg:min-w-[200px]">
                      {canEditOrDelete && (
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
                      )}

                      {gig.status === "submitted" && (
                        <button
                          onClick={() => approveGig(gig.id)}
                          className="glass-button bg-gradient-to-r from-blue-500/20 to-indigo-500/20 hover:from-blue-500/30 hover:to-indigo-500/30 text-white px-4 py-3 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25 border border-blue-400/30"
                        >
                          <span className="flex items-center justify-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Approve
                          </span>
                        </button>
                      )}

                      {gig.status === "approved" && gig.paymentStatus !== "paid" && (
                        <button
                          onClick={() => markAsPaid(gig.id)}
                          className="glass-button bg-gradient-to-r from-emerald-500/20 to-green-500/20 hover:from-emerald-500/30 hover:to-green-500/30 text-white px-4 py-3 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/25 border border-emerald-400/30"
                        >
                          <span className="flex items-center justify-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            Mark Paid
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
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

        .glass-input {
          backdrop-filter: blur(20px);
          box-shadow: 
            0 4px 16px 0 rgba(31, 38, 135, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.05);
        }

        .glass-input:focus {
          box-shadow: 
            0 4px 16px 0 rgba(31, 38, 135, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.1),
            0 0 0 1px rgba(34, 211, 238, 0.3);
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

export default Admin;