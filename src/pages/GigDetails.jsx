import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export default function GigDetails() {
  const { id } = useParams();
  const [gig, setGig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [claiming, setClaiming] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGig = async () => {
      try {
        const gigRef = doc(db, "gigs", id);
        const gigSnap = await getDoc(gigRef);
        if (gigSnap.exists()) {
          setGig({ id: gigSnap.id, ...gigSnap.data() });
        } else {
          setError("Gig not found");
        }
      } catch (err) {
        setError("Failed to load gig details");
      }
      setLoading(false);
    };
    fetchGig();
  }, [id]);

  const handleClaim = async () => {
    if (!auth.currentUser) {
      navigate("/login");
      return;
    }
    setClaiming(true);
    try {
      const gigRef = doc(db, "gigs", id);
      await updateDoc(gigRef, {
        status: "claimed",
        claimedBy: auth.currentUser.uid
      });
      setGig(prev => ({ ...prev, status: "claimed", claimedBy: auth.currentUser.uid }));
    } catch (err) {
      setError("Failed to claim gig");
    }
    setClaiming(false);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="glass-panel p-8 rounded-3xl flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-cyan-400 border-t-transparent mb-4"></div>
        <span className="text-white text-lg font-medium">Loading gig details...</span>
      </div>
    </div>
  );
  if (error || !gig) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="glass-panel p-8 rounded-3xl text-center">
        <span className="text-red-400 text-lg font-medium">{error || "Gig not found"}</span>
        <button onClick={() => navigate("/")} className="glass-button mt-6">Back to Home</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden flex items-center justify-center p-4">
      <div className="glass-panel max-w-2xl w-full p-8 rounded-3xl shadow-2xl">
        <h1 className="text-3xl font-bold text-white mb-4">{gig.title}</h1>
        <div className="mb-6">
          <span className="inline-block bg-cyan-900/20 text-cyan-200 px-4 py-2 rounded-xl mr-2 mb-2 font-semibold">Price: ${gig.price}</span>
          <span className="inline-block bg-blue-900/20 text-blue-200 px-4 py-2 rounded-xl mr-2 mb-2 font-semibold">Deadline: {gig.deadline?.seconds ? new Date(gig.deadline.seconds * 1000).toLocaleDateString() : "N/A"}</span>
          <span className="inline-block bg-purple-900/20 text-purple-200 px-4 py-2 rounded-xl mr-2 mb-2 font-semibold">Status: {gig.status}</span>
          <span className="inline-block bg-slate-900/20 text-slate-200 px-4 py-2 rounded-xl mr-2 mb-2 font-semibold">Payment: {gig.paymentStatus || "unpaid"}</span>
        </div>
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-cyan-200 mb-2">Description</h2>
          <p className="text-slate-200 whitespace-pre-line leading-relaxed">{gig.description}</p>
        </div>
        <div className="flex flex-wrap items-center">
          {gig.status === "available" && (
            <button onClick={handleClaim} disabled={claiming} className="glass-button bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 border border-cyan-400/30">
              {claiming ? "Claiming..." : "Claim Gig"}
            </button>
          )}
          {gig.status === "claimed" && gig.claimedBy === auth.currentUser?.uid && (
            <button onClick={() => navigate(`/submit/${gig.id}`)} className="glass-button bg-gradient-to-r from-emerald-500/20 to-green-500/20 hover:from-emerald-500/30 hover:to-green-500/30 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 border border-emerald-400/30">
              Submit Work
            </button>
          )}
          <button onClick={() => navigate("/")} className="glass-button bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 border border-cyan-400/30 ml-4 mt-4 sm:mt-0">Back to Home</button>
        </div>
      </div>
    </div>
  );
} 