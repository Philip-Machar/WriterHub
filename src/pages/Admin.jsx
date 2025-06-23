import { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

function Admin() {
  const [gigs, setGigs] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [deadline, setDeadline] = useState("");
  const [editingGigId, setEditingGigId] = useState(null);
  const navigate = useNavigate();

  const fetchGigs = async () => {
    const gigsCol = collection(db, "gigs");
    const gigsSnapshot = await getDocs(gigsCol);
    const gigsList = gigsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setGigs(gigsList);
  };

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
      await addDoc(collection(db, "gigs"), {
        title,
        description,
        price: parseFloat(price),
        deadline: new Date(deadline),
        status: "available",
        paymentStatus: "unpaid"
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
  }, []);

  return (
    <div className="max-w-4xl mx-auto mt-10 p-4">
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Panel</h1>

        <div className="flex gap-2">
          <button
            onClick={() => navigate("/")}
            className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900"
          >
            Back to Home
          </button>

          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Gig Form */}
      <div className="border p-4 rounded mb-6 shadow">
        <h2 className="text-lg font-bold mb-2">{editingGigId ? "Edit Gig" : "Post a New Gig"}</h2>
        <form onSubmit={handleAddOrUpdateGig} className="flex flex-col gap-2">
          <input
            type="text"
            placeholder="Title"
            className="border p-2 rounded"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <textarea
            placeholder="Description"
            className="border p-2 rounded"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
          <input
            type="number"
            placeholder="Price"
            className="border p-2 rounded"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
          <input
            type="date"
            className="border p-2 rounded"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            required
          />
          <div className="flex gap-2">
            <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              {editingGigId ? "Update Gig" : "Add Gig"}
            </button>
            {editingGigId && (
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Gigs List */}
      <h2 className="text-lg font-semibold mb-4">Manage Gigs</h2>

      {gigs.length === 0 && <p>No gigs posted yet.</p>}

      {gigs.map((gig) => (
        <div key={gig.id} className="border p-4 rounded mb-4 shadow">
          <h2 className="text-lg font-semibold">{gig.title}</h2>
          <p>{gig.description}</p>
          <p>Price: ${gig.price}</p>
          <p>
            Deadline:{" "}
            {gig.deadline?.seconds
              ? new Date(gig.deadline.seconds * 1000).toLocaleDateString()
              : "N/A"}
          </p>
          <p>Status: {gig.status}</p>
          <p>Payment: {gig.paymentStatus || "unpaid"}</p>

          {/* Submission View */}
          {gig.status === "submitted" && (
            <div className="mt-2">
              <h3 className="font-semibold mb-1">Submitted Work:</h3>
              {gig.submission?.startsWith("http") ? (
                <a
                  href={gig.submission}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  Download Submitted File
                </a>
              ) : (
                <p className="bg-gray-100 p-2 rounded">{gig.submission}</p>
              )}

              <button
                onClick={() => approveGig(gig.id)}
                className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Approve Gig
              </button>
            </div>
          )}

          {gig.status === "approved" && gig.paymentStatus !== "paid" && (
            <button
              onClick={() => markAsPaid(gig.id)}
              className="mt-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Mark as Paid
            </button>
          )}

          {/* Edit & Delete Buttons */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => editGig(gig)}
              className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
            >
              Edit
            </button>
            <button
              onClick={() => deleteGig(gig.id)}
              className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default Admin;
