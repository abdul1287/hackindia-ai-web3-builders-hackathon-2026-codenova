import React from "react";
import { Link } from "react-router-dom";
import {
  Camera,
  Cpu,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Building2,
  Clock,
  Compass,
  Sparkles,
  MapPin,
  Flame,
} from "lucide-react";
import { Button } from "../../components/Button";
import { Card, CardContent } from "../../components/Card";
import { StatusBadge } from "../../components/StatusBadge";
import { SeverityBadge } from "../../components/SeverityBadge";
import { useComplaints } from "../../hooks/useComplaints";
import { ComplaintCard } from "../../components/ComplaintCard";

export function HomePage() {
  const { complaints, stats, loading } = useComplaints();

  // Show up to 2 active/recent complaints as live evidence
  const recentComplaints = complaints.slice(0, 2);

  return (
    <div className="space-y-16 md:space-y-20">
      {/* Hero Section */}
      <section className="pt-4 pb-8 sm:pt-10 sm:pb-12 text-center max-w-4xl mx-auto px-4">
        {/* Subtle Pill Tag */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold mb-6 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
          <span>Zero Bureaucracy Civic Tech</span>
          <span className="text-blue-300">&bull;</span>
          <span className="text-slate-600 font-normal">Next-Gen Municipal Resolution</span>
        </div>

        {/* Hero Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
          See a Problem? <br className="hidden sm:inline" />
          <span className="text-blue-600">Just Take a Photo.</span>
        </h1>

        {/* Subtitle */}
        <p className="mt-5 text-base sm:text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          CivicAI automatically detects the hazard, identifies the responsible
          department, drafts the official complaint, and lets you track verified
          resolution in real time.
        </p>

        {/* Primary CTAs */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <Link to="/report" className="w-full sm:w-auto">
            <Button
              size="lg"
              variant="primary"
              leftIcon={<Camera className="w-5 h-5" />}
              className="w-full sm:w-auto shadow-md shadow-blue-600/25 px-7"
            >
              Report an Issue Now
            </Button>
          </Link>

          <Link to="/complaints" className="w-full sm:w-auto">
            <Button
              size="lg"
              variant="outline"
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="w-full sm:w-auto px-6"
            >
              Track Existing Complaints
            </Button>
          </Link>
        </div>

        {/* Quick Highlights Bar */}
        <div className="mt-12 pt-8 border-t border-slate-200/80 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-left">
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
            <p className="text-2xs font-bold uppercase tracking-wider text-slate-500">
              Community Reports
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">
              {stats.total + 1420}+
            </p>
            <span className="text-2xs text-emerald-700 font-medium">
              Registered across city
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
            <p className="text-2xs font-bold uppercase tracking-wider text-slate-500">
              Avg. Dispatch SLA
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">
              4.2 Hours
            </p>
            <span className="text-2xs text-blue-700 font-medium">
              Automated department routing
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
            <p className="text-2xs font-bold uppercase tracking-wider text-slate-500">
              Active In-Progress
            </p>
            <p className="text-2xl font-bold text-amber-600 mt-0.5">
              {stats.active} Cases
            </p>
            <span className="text-2xs text-slate-500 font-medium">
              Field crews deployed
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
            <p className="text-2xs font-bold uppercase tracking-wider text-slate-500">
              Verified Resolved
            </p>
            <p className="text-2xl font-bold text-emerald-600 mt-0.5">
              98.2%
            </p>
            <span className="text-2xs text-slate-500 font-medium">
              Citizen verified closure
            </span>
          </div>
        </div>
      </section>

      {/* 3-Step Simple Process Section */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            How CivicAI Works
          </h2>
          <p className="text-sm sm:text-base text-slate-500 mt-1.5 max-w-xl mx-auto">
            From observation to verified civic repair in three effortless steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {/* Step 1 */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-7 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <Camera className="w-6 h-6" />
                </div>
                <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  STEP 01
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                1. Capture
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Snap a photo of the road hazard, waste overflow, or broken light.
                CivicAI locks the exact GPS location with zero typing required.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-blue-700 font-semibold flex items-center gap-1">
              <span>Automatic Geocoding</span>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white rounded-2xl border border-blue-200/90 p-6 sm:p-7 shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between ring-1 ring-blue-500/10">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                  <Cpu className="w-6 h-6" />
                </div>
                <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  STEP 02
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                2. CivicAI Understands
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Computer vision classifies the issue category, evaluates safety
                severity, identifies the exact municipal authority, and drafts a
                formal complaint.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-blue-100 text-xs text-blue-700 font-semibold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Vision Classification &amp; Routing</span>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-7 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  STEP 03
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                3. Track Resolution
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Receive an official tracking ID. Follow the transparent vertical
                timeline as work crews are dispatched, repairs made, and status
                verified.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-emerald-700 font-semibold flex items-center gap-1">
              <span>Full Public Transparency</span>
            </div>
          </div>
        </div>
      </section>

      {/* Live Recent Complaints Ticker / Showcase */}
      <section className="max-w-5xl mx-auto px-4 pt-4">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Active Public Issues in Your Area
              </h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-2xs font-semibold bg-emerald-100 text-emerald-800">
                Live Feed
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Recently reported civic issues undergoing resolution across municipal wards.
            </p>
          </div>

          <Link
            to="/complaints"
            className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 group"
          >
            <span>View All</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recentComplaints.map((item) => (
            <ComplaintCard key={item.id} complaint={item} />
          ))}
        </div>
      </section>

      {/* Authority Bridge Banner */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="rounded-3xl bg-slate-900 text-white p-7 sm:p-9 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-lg">
          <div className="relative z-10 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-amber-300 text-xs font-semibold mb-3 border border-slate-700">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Municipal Operations Desk</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Are you a Municipal Authority or Field Supervisor?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
              Open the CivicAI Authority Portal to manage incoming tickets, dispatch repair crews, update incident status, and log field inspections.
            </p>
          </div>

          <div className="relative z-10 shrink-0">
            <Link to="/authority">
              <Button
                variant="secondary"
                size="md"
                className="bg-white hover:bg-slate-100 text-slate-900 border-none font-semibold px-5"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Open Authority Portal
              </Button>
            </Link>
          </div>

          {/* Subtle background decoration */}
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-blue-900/30 to-transparent pointer-events-none" />
        </div>
      </section>
    </div>
  );
}
