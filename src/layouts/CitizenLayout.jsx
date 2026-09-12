import React from "react";
import { Outlet, Link } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { ToastContainer } from "../components/Toast";
import { resetMockDatabase } from "../services/api";
import { showToast } from "../components/Toast";
import { RotateCcw, Sparkles } from "lucide-react";

export function CitizenLayout() {
  const handleResetData = () => {
    resetMockDatabase();
    showToast({
      title: "Demo Data Reset",
      message: "Restored sample complaints database.",
      type: "info",
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Outlet />
      </main>

      {/* Clean CivicTech Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-8 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-700">CivicAI</span>
            <span className="text-slate-300">|</span>
            <span>Intelligent Public Grievance Redressal</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 text-2xs font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              API Demo Mode Active
            </span>

            <button
              type="button"
              onClick={handleResetData}
              className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer py-1 px-2 rounded hover:bg-slate-100"
              title="Reset sample complaints to original demo state"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Demo DB</span>
            </button>
          </div>
        </div>
      </footer>

      <ToastContainer />
    </div>
  );
}
