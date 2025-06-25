import React from "react";
import { useNavigate } from "react-router-dom";

export default function About() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center relative overflow-hidden p-4">
      {/* Floating Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-cyan-400/20 to-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-purple-400/20 to-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-gradient-to-r from-indigo-400/20 to-cyan-500/20 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>
      <div className="glass-panel max-w-4xl w-full p-10 rounded-3xl shadow-2xl relative z-10">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-cyan-200 via-blue-300 to-purple-300 bg-clip-text text-transparent">About WriterHub</h1>
        <p className="text-slate-200 text-lg mb-6 leading-relaxed">
          <span className="font-semibold text-cyan-200">WriterHub</span> is a premium platform connecting talented writers with clients seeking high-quality written content. Our mission is to empower writers, streamline the gig process, and ensure every project is delivered with excellence and creativity. Whether you're a seasoned professional or a passionate newcomer, WriterHub is your space to grow, collaborate, and succeed.
        </p>
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-cyan-200 mb-2">Our Values</h2>
          <ul className="list-disc list-inside text-slate-300 space-y-2">
            <li><span className="font-medium text-white">Quality First:</span> We believe in delivering only the best content, every time.</li>
            <li><span className="font-medium text-white">Transparency:</span> Clear communication and fair compensation for all.</li>
            <li><span className="font-medium text-white">Community:</span> Building a supportive network of writers and clients.</li>
            <li><span className="font-medium text-white">Innovation:</span> Leveraging technology to make writing gigs seamless and rewarding.</li>
          </ul>
        </div>
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-cyan-200 mb-2">Contact Us</h2>
          <div className="space-y-2 text-slate-200">
            <div>Email: <a href="mailto:contact@writerhub.com" className="text-cyan-300 underline hover:text-cyan-200 transition">contact@writerhub.com</a></div>
            <div>Twitter: <a href="https://twitter.com/writerhub" target="_blank" rel="noopener noreferrer" className="text-cyan-300 underline hover:text-cyan-200 transition">@writerhub</a></div>
            <div>LinkedIn: <a href="https://linkedin.com/company/writerhub" target="_blank" rel="noopener noreferrer" className="text-cyan-300 underline hover:text-cyan-200 transition">WriterHub</a></div>
          </div>
        </div>
        <button onClick={() => navigate("/")} className="glass-button bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 border border-cyan-400/30 mt-4">Back to Home</button>
      </div>
    </div>
  );
} 