import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, RoleGuard } from './routes/ProtectedRoute';

// Public
import LandingPage        from './pages/public/LandingPage';
import RoleSelectPage     from './pages/public/RoleSelectPage';
import LoginPage          from './pages/public/LoginPage';
import RegisterPage       from './pages/public/RegisterPage';
import UnauthorizedPage   from './pages/public/UnauthorizedPage';

// Founder
import FounderDashboard       from './pages/founder/FounderDashboard';
import StartupManagementPage  from './pages/founder/StartupManagementPage';
import AIAnalysisPage         from './pages/founder/AIAnalysisPage';
import AnalyticsPage          from './pages/founder/AnalyticsPage';
import BonusToolsPage         from './pages/founder/BonusToolsPage';

import SettingsPage           from './pages/founder/SettingsPage';
import InvestorMatchPage      from './pages/founder/InvestorMatchPage';
import InvestorProfilePage    from './pages/founder/InvestorProfilePage';
import MeetingRequestsPage    from './pages/founder/MeetingRequestsPage';

// Investor
import InvestorDashboard    from './pages/investor/InvestorDashboard';
import DiscoverPage         from './pages/investor/DiscoverPage';
import StartupDetailsPage   from './pages/investor/StartupDetailsPage';
import InvestmentToolsPage  from './pages/investor/InvestmentToolsPage';
import ComparePage          from './pages/investor/ComparePage';
import WatchlistPage        from './pages/investor/WatchlistPage';
import InvestorMyProfilePage from './pages/investor/InvestorMyProfilePage';
import SentMeetingsPage      from './pages/investor/SentMeetingsPage';

// Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsersPage from './pages/admin/AdminUsersPage';

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/"            element={<LandingPage />} />
      <Route path="/login"       element={<RoleSelectPage />} />
      <Route path="/login/form"  element={<LoginPage />} />
      <Route path="/register"    element={<RoleSelectPage />} />
      <Route path="/register/form" element={<LoginPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Founder Routes */}
      <Route path="/founder" element={<ProtectedRoute><RoleGuard roles={['FOUNDER']}><Navigate to="/founder/dashboard" replace /></RoleGuard></ProtectedRoute>} />
      <Route path="/founder/dashboard"  element={<ProtectedRoute><RoleGuard roles={['FOUNDER']}><FounderDashboard /></RoleGuard></ProtectedRoute>} />
      <Route path="/founder/startup"    element={<ProtectedRoute><RoleGuard roles={['FOUNDER']}><StartupManagementPage /></RoleGuard></ProtectedRoute>} />
      <Route path="/founder/ai-analysis" element={<ProtectedRoute><RoleGuard roles={['FOUNDER']}><AIAnalysisPage /></RoleGuard></ProtectedRoute>} />
      <Route path="/founder/analytics"  element={<ProtectedRoute><RoleGuard roles={['FOUNDER']}><AnalyticsPage /></RoleGuard></ProtectedRoute>} />

      <Route path="/founder/bonus-tools" element={<ProtectedRoute><RoleGuard roles={['FOUNDER']}><BonusToolsPage /></RoleGuard></ProtectedRoute>} />
      <Route path="/founder/settings"         element={<ProtectedRoute><RoleGuard roles={['FOUNDER']}><SettingsPage /></RoleGuard></ProtectedRoute>} />
      <Route path="/founder/investor-match"      element={<ProtectedRoute><RoleGuard roles={['FOUNDER']}><InvestorMatchPage /></RoleGuard></ProtectedRoute>} />
      <Route path="/founder/investor-profile/:id" element={<ProtectedRoute><RoleGuard roles={['FOUNDER']}><InvestorProfilePage /></RoleGuard></ProtectedRoute>} />
      <Route path="/founder/meetings"             element={<ProtectedRoute><RoleGuard roles={['FOUNDER']}><MeetingRequestsPage /></RoleGuard></ProtectedRoute>} />

      {/* Investor Routes */}
      <Route path="/investor" element={<ProtectedRoute><RoleGuard roles={['INVESTOR']}><Navigate to="/investor/dashboard" replace /></RoleGuard></ProtectedRoute>} />
      <Route path="/investor/dashboard"        element={<ProtectedRoute><RoleGuard roles={['INVESTOR']}><InvestorDashboard /></RoleGuard></ProtectedRoute>} />
      <Route path="/investor/discover"         element={<ProtectedRoute><RoleGuard roles={['INVESTOR']}><DiscoverPage /></RoleGuard></ProtectedRoute>} />
      <Route path="/investor/startup-details"  element={<ProtectedRoute><RoleGuard roles={['INVESTOR']}><Navigate to="/investor/startup/1" replace /></RoleGuard></ProtectedRoute>} />
      <Route path="/investor/startup/:id"      element={<ProtectedRoute><RoleGuard roles={['INVESTOR']}><StartupDetailsPage /></RoleGuard></ProtectedRoute>} />
      <Route path="/investor/investment-tools" element={<ProtectedRoute><RoleGuard roles={['INVESTOR']}><InvestmentToolsPage /></RoleGuard></ProtectedRoute>} />
      <Route path="/investor/compare"          element={<ProtectedRoute><RoleGuard roles={['INVESTOR']}><ComparePage /></RoleGuard></ProtectedRoute>} />
      <Route path="/investor/watchlist"        element={<ProtectedRoute><RoleGuard roles={['INVESTOR']}><WatchlistPage /></RoleGuard></ProtectedRoute>} />
      <Route path="/investor/my-profile"       element={<ProtectedRoute><RoleGuard roles={['INVESTOR']}><InvestorMyProfilePage /></RoleGuard></ProtectedRoute>} />
      <Route path="/investor/meetings"         element={<ProtectedRoute><RoleGuard roles={['INVESTOR']}><SentMeetingsPage /></RoleGuard></ProtectedRoute>} />
      <Route path="/investor/settings"         element={<ProtectedRoute><RoleGuard roles={['INVESTOR']}><SettingsPage /></RoleGuard></ProtectedRoute>} />

      {/* Admin Routes */}
      <Route path="/admin"           element={<ProtectedRoute><RoleGuard roles={['ADMIN']}><Navigate to="/admin/dashboard" replace /></RoleGuard></ProtectedRoute>} />
      <Route path="/admin/dashboard" element={<ProtectedRoute><RoleGuard roles={['ADMIN']}><AdminDashboard /></RoleGuard></ProtectedRoute>} />
      <Route path="/admin/users"     element={<ProtectedRoute><RoleGuard roles={['ADMIN']}><AdminUsersPage /></RoleGuard></ProtectedRoute>} />
      <Route path="/admin/settings"  element={<ProtectedRoute><RoleGuard roles={['ADMIN']}><SettingsPage /></RoleGuard></ProtectedRoute>} />
      <Route path="/admin/*"         element={<ProtectedRoute><RoleGuard roles={['ADMIN']}><AdminDashboard /></RoleGuard></ProtectedRoute>} />


      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
