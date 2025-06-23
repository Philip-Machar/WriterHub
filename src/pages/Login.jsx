import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userRole, setUserRole] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
  
      const userRef = doc(db, "users", userCred.user.uid);
      const userSnap = await getDoc(userRef);
  
      if (userSnap.exists()) {
        setUserRole(userSnap.data().role);
      } else {
        await setDoc(userRef, {
          email,
          role: "writer"
        });
        setUserRole("writer");
      }
  
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      // Store user role in Firestore
      await setDoc(doc(db, "users", userCred.user.uid), {
        email,
        role: "writer" // Default role is 'writer'
      });
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-100">
      <div className="max-w-sm w-full bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">{isCreating ? "Create Account" : "Login"}</h2>
        
        {error && <p className="text-red-500 mb-2">{error}</p>}
        
        <form onSubmit={isCreating ? handleSignup : handleLogin} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            className="border p-2 rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          
          <input
            type="password"
            placeholder="Password"
            className="border p-2 rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
            {isCreating ? "Sign Up" : "Login"}
          </button>
        </form>

        <p className="mt-4 text-sm">
          {isCreating ? "Already have an account?" : "Don't have an account?"}{" "}
          <button onClick={() => setIsCreating(!isCreating)} className="text-blue-600 underline">
            {isCreating ? "Login" : "Sign Up"}
          </button>
        </p>
      </div>
    </div>
  );
}
