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
  const [error, setError] = useState("");
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

  const handleFile = (f) => {
    setError("");
    if (f && f.type.match(/(pdf|word|officedocument|plain)/i)) {
      setFile(f);
    } else {
      setError("Please upload a valid document (PDF, Word, or TXT).");
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
      setError("Unauthorized access to this gig");
      return;
    }
    if (!file) {
      setError("Please upload your completed work document");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const storageRef = ref(storage, `submissions/${id}/${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      const gigRef = doc(db, "gigs", id);
      await updateDoc(gigRef, {
        status: "submitted",
        submission: downloadURL
      });

      navigate("/");
    } catch (err) {
      setError("Failed to submit work. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="glass-panel p-8 rounded-3xl">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-cyan-400 border-t-transparent"></div>
            <span className="text-white text-lg font-medium">Loading gig details...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!gig || error === "Gig not found") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="glass-panel p-12 rounded-3xl text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-red-500/30 to-pink-500/30 flex items-center justify-center border border-red-400/30">
            <svg className="w-10 h-10 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Gig Not Found</h3>
          <p className="text-slate-400 mb-6">The gig you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate("/")}
            className="glass-button bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 text-white px-6 py-3 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 border border-cyan-400/30"
          >
            Back to Home
          </button>
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

      <div className="relative z-10 max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 mb-8 backdrop-blur-xl">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-white via-cyan-200 to-blue-300 bg-clip-text text-transparent mb-2">
                Submit Your Work
              </h1>
              <p className="text-slate-300 text-sm sm:text-base">
                Upload your completed work for: <span className="text-cyan-300 font-medium">{gig.title}</span>
              </p>
            </div>
            
            <button
              onClick={() => navigate("/")}
              className="glass-button bg-gradient-to-r from-slate-500/20 to-slate-400/20 hover:from-slate-500/30 hover:to-slate-400/30 text-white px-6 py-3 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-slate-500/25 border border-slate-400/30"
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Home
              </span>
            </button>
          </div>
        </div>

        {/* Gig Details */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 mb-8">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Gig Details</h3>
              <p className="text-slate-300 text-sm leading-relaxed mb-4">
                {gig.description}
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 px-4 py-2 rounded-xl border border-green-400/30">
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  <span className="text-green-300 font-semibold">${gig.price}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 px-4 py-2 rounded-xl border border-blue-400/30">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h3a1 1 0 011 1v9a2 2 0 01-2 2H5a2 2 0 01-2-2V8a1 1 0 011-1h3z" />
                </svg>
                <span className="text-blue-300 font-medium">
                  Due: {new Date(gig.deadline.seconds * 1000).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="glass-panel rounded-3xl p-6 mb-8 bg-gradient-to-r from-red-500/10 to-pink-500/10 border border-red-400/30">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Submit Form */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-lg font-semibold text-white mb-4">
                Upload Your Document
              </label>
              <p className="text-slate-400 text-sm mb-6">
                Accepted formats: PDF, Word (.doc, .docx), or Plain Text (.txt)
              </p>
              
              {/* File Drop Zone */}
              <div
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-300 ${
                  dragActive 
                    ? "border-cyan-400/50 bg-cyan-500/10 scale-105" 
                    : "border-slate-400/30 hover:border-cyan-400/30 hover:bg-cyan-500/5"
                }`}
              >
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  id="fileInput"
                />
                
                <div className="space-y-4">
                  {file ? (
                    <div className="space-y-4">
                      <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-green-500/30 to-emerald-500/30 flex items-center justify-center border border-green-400/30">
                        <svg className="w-10 h-10 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-green-300 font-semibold text-lg">File Selected!</p>
                        <p className="text-slate-300 text-sm mt-1">{file.name}</p>
                        <p className="text-slate-400 text-xs mt-2">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-cyan-500/30 to-blue-500/30 flex items-center justify-center border border-cyan-400/30">
                        <svg className="w-10 h-10 text-cyan-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-white text-lg font-semibold">
                          {dragActive ? "Drop your file here" : "Drag & drop your file here"}
                        </p>
                        <p className="text-slate-400 text-sm mt-2">
                          or click anywhere in this area to browse
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              {file && (
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="glass-button bg-gradient-to-r from-slate-500/20 to-slate-400/20 hover:from-slate-500/30 hover:to-slate-400/30 text-white px-6 py-4 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 border border-slate-400/30"
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Remove File
                  </span>
                </button>
              )}
              
              <button
                type="submit"
                disabled={uploading || !file}
                className="flex-1 glass-button bg-gradient-to-r from-emerald-500/20 to-green-500/20 hover:from-emerald-500/30 hover:to-green-500/30 disabled:from-slate-500/20 disabled:to-slate-400/20 text-white px-6 py-4 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/25 border border-emerald-400/30 disabled:border-slate-400/30 disabled:cursor-not-allowed disabled:hover:scale-100 group"
              >
                {uploading ? (
                  <span className="flex items-center justify-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-emerald-400 border-t-transparent"></div>
                    Submitting Work...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5 group-hover:translate-y-[-2px] transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Submit Work
                  </span>
                )}
              </button>
            </div>
          </form>
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

        .glass-button:hover:not(:disabled) {
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

export default Submit;