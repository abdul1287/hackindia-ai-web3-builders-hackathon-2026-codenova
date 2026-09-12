import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Building2, Lock, KeyRound, AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "../../components/Button";
import { AUTHORITY_DEPARTMENTS, useAuthorityAuth } from "../../context/AuthorityAuthContext";

export function AuthorityLoginPage() {
  const { login } = useAuthorityAuth();

  const [departmentName, setDepartmentName] = useState("Public Works Department");
  const [departmentId, setDepartmentId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!departmentName.trim()) {
      setError("Please select your municipal department.");
      return;
    }
    if (!departmentId.trim()) {
      setError("Please enter your Department ID.");
      return;
    }
    if (!password.trim()) {
      setError("Please enter your password.");
      return;
    }

    setIsSubmitting(true);
    const res = login(departmentId, password, departmentName);
    setIsSubmitting(false);

    if (!res.success) {
      setError(res.error || "Login failed. Please verify the credentials.");
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
        {/* Header Badge & Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
            <span>CivicAI Operations Center</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Authority Member Login
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xs mx-auto">
            Select your department and enter your operator credentials to access authorized municipal grievance queues.
          </p>
        </div>

        {/* Validation Error Banner */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Department Name Dropdown */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Department Name</span>
              </span>
              <span className="text-2xs text-rose-500 font-normal">* Required</span>
            </label>
            <div className="relative">
              <select
                value={departmentName}
                onChange={(e) => setDepartmentName(e.target.value)}
                className="w-full h-11 px-3.5 pr-8 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-shadow appearance-none cursor-pointer"
              >
                <option value="" disabled>Select your municipal department...</option>
                {AUTHORITY_DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
            <p className="text-2xs text-slate-400">
              Determines which departmental grievances you are authorized to inspect.
            </p>
          </div>

          {/* Department ID */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                <span>Department ID</span>
              </span>
              <span className="text-2xs text-rose-500 font-normal">* Required</span>
            </label>
            <input
              type="text"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              placeholder="e.g. 32632839 or PWD-OPERATOR-04"
              className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-shadow font-mono text-xs"
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-blue-600" />
                <span>Password</span>
              </span>
              <span className="text-2xs text-rose-500 font-normal">* Required</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-shadow text-xs"
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            className="w-full mt-2 font-semibold shadow-sm"
            leftIcon={<ShieldCheck className="w-4 h-4" />}
          >
            Access Department Portal
          </Button>
        </form>

        {/* Prototype Note */}
        <div className="pt-4 border-t border-slate-100 text-center space-y-2">
          <p className="text-2xs text-slate-400 leading-relaxed">
            Prototype authentication: Enter any Department ID &amp; Password, and pick your department to view authorized complaints.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 transition-colors font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Citizen Portal</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
