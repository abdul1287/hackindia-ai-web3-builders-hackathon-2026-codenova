import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CitizenLayout } from "./layouts/CitizenLayout";
import { AuthorityLayout } from "./layouts/AuthorityLayout";

// Citizen Pages
import { HomePage } from "./pages/citizen/HomePage";
import { ReportPage } from "./pages/citizen/ReportPage";
import { AnalyzePage } from "./pages/citizen/AnalyzePage";
import { ReviewPage } from "./pages/citizen/ReviewPage";
import { MyComplaintsPage } from "./pages/citizen/MyComplaintsPage";
import { ComplaintDetailPage } from "./pages/citizen/ComplaintDetailPage";

// Authority Pages
import { AuthorityDashboardPage } from "./pages/authority/AuthorityDashboardPage";
import { AuthorityDetailPage } from "./pages/authority/AuthorityDetailPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Citizen Experience Routes */}
        <Route element={<CitizenLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/report" element={<ReportPage />} />
          <Route path="/analyze" element={<AnalyzePage />} />
          <Route path="/review" element={<ReviewPage />} />
          <Route path="/complaints" element={<MyComplaintsPage />} />
          <Route path="/complaints/:id" element={<ComplaintDetailPage />} />
        </Route>

        {/* Authority Operations Experience Routes */}
        <Route path="/authority" element={<AuthorityLayout />}>
          <Route index element={<AuthorityDashboardPage />} />
          <Route path="complaints/:id" element={<AuthorityDetailPage />} />
        </Route>

        {/* Fallback to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
