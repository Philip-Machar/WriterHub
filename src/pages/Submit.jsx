import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, auth, storage } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

function Submit() {
  const { id } = useParams();
  const [gig, setGig] = useState(null);
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGig = async () => {
      const gigRef = doc(db, "gigs", id);
      const gigSnap = await getDoc(gigRef);

      if (gigSnap.exists()) {
        setGig({ id: gigSnap.id, ...gigSnap.data() });
      }
      setLoading(false);
    };

    fetchGig();
  }, [id]);

  const handleFile = (f) => {
    if (f && f.type.match(/(pdf|word|officedocument|plain)/i)) {
      setFile(f);
    } else {
      alert("Please upload a valid document (PDF, Word, or TXT).");
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragover");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;

    if (!user || gig.claimedBy !== user.uid) {
      alert("Unauthorized");
      return;
    }
    if (!file) {
      alert("Please upload your completed work document.");
      return;
    }

    setUploading(true);

    const storageRef = ref(storage, `submissions/${id}/${file.name}`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);

    const gigRef = doc(db, "gigs", id);
    await updateDoc(gigRef, {
      status: "submitted",
      submission: downloadURL
    });

    setUploading(false);
    navigate("/");
  };

  if (loading) return <div className="text-center mt-10">Loading...</div>;
  if (!gig) return <div className="text-center mt-10">Gig not found.</div>;

  return (
    <div className="max-w-xl mx-auto mt-10 p-4">
      <h1 className="text-2xl font-bold mb-4">Submit Work for: {gig.title}</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 border p-4 rounded shadow bg-white">
        
        <label className="font-semibold">Upload Document (PDF, Word, TXT):</label>

        <div
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed p-6 rounded text-center cursor-pointer ${
            dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"
          }`}
        >
          {file ? (
            <p className="text-green-600">File selected: {file.name}</p>
          ) : (
            <p>Drag & Drop your file here, or click to choose</p>
          )}

          <input
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            onChange={handleChange}
            className="hidden"
            id="fileInput"
          />
        </div>

        <label
          htmlFor="fileInput"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-center cursor-pointer"
        >
          Choose File
        </label>

        <button
          disabled={uploading}
          className={`bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 ${
            uploading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {uploading ? "Submitting..." : "Submit Work"}
        </button>
      </form>
    </div>
  );
}

export default Submit;
