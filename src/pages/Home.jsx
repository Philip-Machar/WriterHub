import { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { collection, getDocs, doc, updateDoc, getDoc } from "firebase/firestore";
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

  const handleClaim = async (gigId) => {
    const user = auth.currentUser;
    if (!user) {
      navigate("/login");
      return;
    }

    const gigRef = doc(db, "gigs", gigId);
    await updateDoc(gigRef, {
      status: "claimed",
      claimedBy: user.uid
    });

    fetchGigs();
  };

  if (loading) {
    return <div className="text-center mt-10">Loading gigs...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Available Writing Gigs</h1>
        
        <div className="flex gap-2">
          {userRole === "admin" && (
            <button
              onClick={() => navigate("/admin")}
              className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900"
            >
              Admin Panel
            </button>
          )}

          <button
            onClick={() => {
              auth.signOut();
              navigate("/login");
            }}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        Logged in as: {auth.currentUser?.email}
      </p>

      {gigs.length === 0 && <p>No gigs available.</p>}

      {gigs.map((gig) => (
        <div key={gig.id} className="border p-4 rounded-lg mb-4 shadow">
          <h2 className="text-lg font-semibold">{gig.title}</h2>
          <p className="text-gray-700">{gig.description}</p>
          <p className="text-sm text-gray-500">Price: ${gig.price}</p>
          <p className="text-sm text-gray-500">
            Deadline: {new Date(gig.deadline.seconds * 1000).toLocaleDateString()}
          </p>
          <p className="text-sm mt-1">
            Status:{" "}
            <span className={gig.status === "available" ? "text-green-600" : "text-yellow-500"}>
              {gig.status}
            </span>
          </p>
          <p className="text-sm text-gray-500">
            Payment Status: {gig.paymentStatus || "unpaid"}
          </p>

          {gig.status === "available" && (
            <button
              onClick={() => handleClaim(gig.id)}
              className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Claim Gig
            </button>
          )}

          {gig.status === "claimed" && gig.claimedBy === auth.currentUser?.uid && (
            <button
              onClick={() => navigate(`/submit/${gig.id}`)}
              className="mt-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Submit Work
            </button>
          )}

          {gig.status === "submitted" && gig.claimedBy === auth.currentUser?.uid && (
            <p className="mt-2 text-yellow-600 font-medium">You submitted this gig.</p>
          )}
        </div>
      ))}
    </div>
  );
}

export default Home;
