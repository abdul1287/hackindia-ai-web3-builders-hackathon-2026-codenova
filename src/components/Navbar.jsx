import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Camera,
  Layers,
  ShieldCheck,
  Menu,
  X,
  Sparkles,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { Button } from "./Button";
import { cn } from "../utils/cn";

export function Navbar() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAuthority = location.pathname.startsWith("/authority");

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "Report Issue", href: "/report" },
    { label: "My Complaints", href: "/complaints" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo & Civic Branding */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shadow-blue-500/20 group-hover:bg-blue-700 transition-colors">
                <svg
                  className="w-5 h-5 fill-current"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-bold tracking-tight text-slate-900">
                    CivicAI
                  </span>
                  <span className="text-2xs font-mono font-bold uppercase tracking-wider px-1.5 py-0.25 rounded bg-blue-50 text-blue-700 border border-blue-200/70">
                    GovTech
                  </span>
                </div>
                <span className="text-2xs text-slate-500 font-medium -mt-0.5">
                  Citizen Issue Resolution
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links (Citizen Mode) */}
            {!isAuthority && (
              <nav className="hidden md:flex items-center gap-1">
                {navLinks.map((link) => {
                  const isActive =
                    link.href === "/"
                      ? location.pathname === "/"
                      : location.pathname.startsWith(link.href);
                  return (
                    <Link
                      key={link.href}
                      to={link.href}
                      className={cn(
                        "px-3 py-1.5 text-sm font-medium rounded-lg transition-colors",
                        isActive
                          ? "bg-slate-100 text-blue-700 font-semibold"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      )}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </nav>
            )}

            {/* Authority View Badge if in Authority Mode */}
            {isAuthority && (
              <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                <span>Authority Operations Portal</span>
              </div>
            )}
          </div>

          {/* Right Actions */}
          <div className="hidden sm:flex items-center gap-2.5">
            {isAuthority ? (
              <Link to="/">
                <Button variant="outline" size="sm">
                  Exit to Citizen View
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/authority">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-600 hover:text-slate-900 text-xs gap-1.5"
                  >
                    <ShieldCheck className="w-4 h-4 text-slate-500" />
                    <span>Authority Portal</span>
                  </Button>
                </Link>

                <Link to="/report">
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<Camera className="w-4 h-4" />}
                    className="shadow-sm shadow-blue-600/20"
                  >
                    Report an Issue
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger button */}
          <div className="flex sm:hidden items-center gap-1.5">
            <Link to="/report">
              <Button
                variant="primary"
                size="sm"
                className="px-2.5 py-1 text-xs"
                leftIcon={<Camera className="w-3.5 h-3.5" />}
              >
                Report
              </Button>
            </Link>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-4 space-y-2 shadow-lg animate-in slide-in-from-top-2">
          {navLinks.map((link) => {
            const isActive =
              link.href === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center justify-between px-3 py-2 text-sm font-medium rounded-xl transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-700 font-semibold"
                    : "text-slate-700 hover:bg-slate-50"
                )}
              >
                <span>{link.label}</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
            );
          })}

          <div className="pt-2 mt-2 border-t border-slate-100 flex flex-col gap-2">
            <Link
              to="/authority"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between px-3 py-2 text-sm font-medium rounded-xl bg-slate-50 text-slate-800 hover:bg-slate-100 border border-slate-200"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Authority Operations Portal</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
