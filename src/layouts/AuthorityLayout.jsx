import React from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { ToastContainer } from "../components/Toast";
import { ShieldCheck, ArrowLeft, Building2, Bell, Radio, LogOut } from "lucide-react";
import { Button } from "../components/Button";
import { AuthorityAuthProvider, useAuthorityAuth } from "../context/AuthorityAuthContext";
import { AuthorityLoginPage } from "../pages/authority/AuthorityLoginPage";

export function AuthorityLayout() {
  return (
    <AuthorityAuthProvider>
      <AuthorityLayoutContent />
    </AuthorityAuthProvider>
  );
}

function AuthorityLayoutContent() {
  const location = useLocation();
  const { isAuthenticated, departmentName, departmentId, logout } = useAuthorityAuth();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f1f5f9] text-slate-900 selection:bg-amber-100 selection:text-amber-900">
        <Navbar />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex items-center justify-center">
          <AuthorityLoginPage />
        </main>
        <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-slate-700">CivicAI Authority Operations</span>
              <span className="text-slate-400">&bull; Secure Municipal Session</span>
            </div>
            <p className="text-2xs text-slate-400 font-mono">
              FastAPI Ready Backend Schema v1.0
            </p>
          </div>
        </footer>
        <ToastContainer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f1f5f9] text-slate-900 selection:bg-amber-100 selection:text-amber-900">
      {/* Authority Command Center Topbar */}
      <div className="w-full bg-slate-900 text-slate-100 border-b border-slate-800 px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 font-bold tracking-wide text-white uppercase text-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>CivicAI Operations Center</span>
            </div>
            <span className="text-slate-600 hidden sm:inline">|</span>
            <div className="hidden sm:flex items-center gap-1.5 text-slate-300">
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-semibold text-white">{departmentName}</span>
              {departmentId && (
                <span className="text-slate-400 font-mono text-2xs">(ID: {departmentId})</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={logout}
              type="button"
              className="inline-flex items-center gap-1 text-xs text-slate-300 hover:text-rose-400 transition-colors cursor-pointer"
              title="Sign out from department session"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
            <span className="text-slate-600">|</span>
            <Link
              to="/"
              className="inline-flex items-center gap-1 text-xs text-slate-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Switch to Citizen Portal</span>
            </Link>
          </div>
        </div>
      </div>

      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-slate-700">CivicAI Authority Operations</span>
            <span className="text-slate-400">&bull; {departmentName} Active Session</span>
          </div>
          <p className="text-2xs text-slate-400 font-mono">
            FastAPI Ready Backend Schema v1.0
          </p>
        </div>
      </footer>

      <ToastContainer />
    </div>
  );
}
