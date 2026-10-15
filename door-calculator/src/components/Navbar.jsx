import React, { useState } from "react";
import { useAuth } from "../lib/authContext";
import { USER_ROLES } from "../lib/dataModels";
import {
  Compass,
  FileSearch,
  Inbox,
  Hammer,
  DollarSign,
  ShieldCheck,
  LogIn,
  LogOut,
  ChevronDown,
  Sparkles,
} from "lucide-react";

export const Navbar = ({ activeTab, setActiveTab, onOpenLogin, submissionCount = 0 }) => {
  const { user, profile, role, isStaff, isAdmin, signOut, setDemoRole } =
    useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showDemoMenu, setShowDemoMenu] = useState(false);

  const getRoleBadge = () => {
    switch (role) {
      case USER_ROLES.ADMIN:
        return (
          <span className="bg-amber-50 text-amber-700 border border-amber-200 text-xs px-2 py-0.5 rounded-full font-semibold">
            Admin
          </span>
        );
      case USER_ROLES.STAFF:
        return (
          <span className="bg-teal-50 text-teal-700 border border-teal-200 text-xs px-2 py-0.5 rounded-full font-semibold">
            Staff
          </span>
        );
      case USER_ROLES.PENDING:
        return (
          <span className="bg-yellow-50 text-yellow-700 border border-yellow-200 text-xs px-2 py-0.5 rounded-full font-semibold">
            Pending
          </span>
        );
      default:
        return (
          <span className="bg-stone-100 text-stone-600 border border-stone-200 text-xs px-2 py-0.5 rounded-full font-medium">
            Public Visitor
          </span>
        );
    }
  };

  return (
    <header className="bg-white text-stone-800 border-b border-stone-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab("designer")}
              className="flex items-center gap-2.5 text-left group focus:outline-none cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-[#00A69C] flex items-center justify-center text-white shadow-sm group-hover:bg-[#009087] transition-all">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-lg tracking-tight text-stone-900">DoorSolver</span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 bg-stone-100 text-stone-600 rounded border border-stone-200 font-bold">
                    2.0
                  </span>
                </div>
                <div className="text-[11px] text-stone-500 font-medium">Trim Choice Doors & Millwork</div>
              </div>
            </button>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1.5">
            {/* Public Tab */}
            <button
              onClick={() => setActiveTab("designer")}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === "designer"
                  ? "bg-[#00A69C] text-white shadow-xs"
                  : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Door Designer</span>
            </button>

            {/* Share Code Lookup Tab */}
            <button
              onClick={() => setActiveTab("lookup")}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === "lookup"
                  ? "bg-[#00A69C] text-white shadow-xs"
                  : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
              }`}
            >
              <FileSearch className="w-4 h-4" />
              <span>Share Code Lookup</span>
            </button>

            {/* Staff / Admin Gated Tabs */}
            {isStaff && (
              <>
                <div className="h-5 w-px bg-stone-200 mx-1"></div>

                <button
                  onClick={() => setActiveTab("inbox")}
                  className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all relative cursor-pointer ${
                    activeTab === "inbox"
                      ? "bg-[#00A69C] text-white shadow-xs"
                      : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
                  }`}
                >
                  <Inbox className="w-4 h-4" />
                  <span>Submissions Inbox</span>
                  {submissionCount > 0 && (
                    <span className="bg-teal-600 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full shadow-xs">
                      {submissionCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab("jobs")}
                  className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    activeTab === "jobs"
                      ? "bg-[#00A69C] text-white shadow-xs"
                      : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
                  }`}
                >
                  <Hammer className="w-4 h-4" />
                  <span>Jobs & Cut Lists</span>
                </button>

                <button
                  onClick={() => setActiveTab("quotes")}
                  className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    activeTab === "quotes"
                      ? "bg-[#00A69C] text-white shadow-xs"
                      : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
                  }`}
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Quotes & Pricing</span>
                </button>
              </>
            )}

            {/* Admin Only Tab */}
            {isAdmin && (
              <button
                onClick={() => setActiveTab("admin")}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  activeTab === "admin"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "text-amber-700 hover:text-amber-800 hover:bg-amber-50"
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Admin Portal</span>
              </button>
            )}
          </nav>

          {/* Right Side: Auth / Role Controls */}
          <div className="flex items-center gap-3">
            {/* Quick Demo Role Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowDemoMenu(!showDemoMenu)}
                className="flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                title="Switch role for testing"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#00A69C]" />
                <span>Role: <strong className="text-stone-900 capitalize">{role}</strong></span>
                <ChevronDown className="w-3 h-3 text-stone-500" />
              </button>

              {showDemoMenu && (
                <div
                  className="absolute right-0 mt-2 w-52 bg-white border border-stone-200 rounded-xl shadow-xl py-1.5 z-50 text-xs"
                  onClick={() => setShowDemoMenu(false)}
                >
                  <div className="px-3 py-1.5 text-[10px] font-bold text-stone-400 uppercase tracking-wider border-b border-stone-100">
                    Switch Active Role (Test)
                  </div>
                  <button
                    onClick={() => setDemoRole(USER_ROLES.PUBLIC)}
                    className="w-full text-left px-3.5 py-2 text-stone-700 hover:bg-stone-50 flex items-center justify-between cursor-pointer"
                  >
                    <span>Public Visitor</span>
                    {role === USER_ROLES.PUBLIC && <span className="text-[#00A69C] font-bold">✓</span>}
                  </button>
                  <button
                    onClick={() => setDemoRole(USER_ROLES.PENDING)}
                    className="w-full text-left px-3.5 py-2 text-stone-700 hover:bg-stone-50 flex items-center justify-between cursor-pointer"
                  >
                    <span>Pending User</span>
                    {role === USER_ROLES.PENDING && <span className="text-[#00A69C] font-bold">✓</span>}
                  </button>
                  <button
                    onClick={() => setDemoRole(USER_ROLES.STAFF)}
                    className="w-full text-left px-3.5 py-2 text-stone-700 hover:bg-stone-50 flex items-center justify-between cursor-pointer"
                  >
                    <span>Staff Estimator</span>
                    {role === USER_ROLES.STAFF && <span className="text-[#00A69C] font-bold">✓</span>}
                  </button>
                  <button
                    onClick={() => setDemoRole(USER_ROLES.ADMIN)}
                    className="w-full text-left px-3.5 py-2 text-stone-700 hover:bg-stone-50 flex items-center justify-between cursor-pointer"
                  >
                    <span>Administrator</span>
                    {role === USER_ROLES.ADMIN && <span className="text-[#00A69C] font-bold">✓</span>}
                  </button>
                </div>
              )}
            </div>

            {/* Auth Dropdown / Button */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 bg-stone-100 hover:bg-stone-200 text-stone-800 px-3 py-1.5 rounded-lg border border-stone-300 transition-all text-xs font-semibold cursor-pointer"
                >
                  <div className="w-5 h-5 rounded-full bg-[#00A69C] text-white flex items-center justify-center font-bold text-[10px]">
                    {profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : "U"}
                  </div>
                  <span className="hidden sm:inline">{profile?.fullName || user.email}</span>
                  {getRoleBadge()}
                  <ChevronDown className="w-3.5 h-3.5 text-stone-500" />
                </button>

                {showUserMenu && (
                  <div
                    className="absolute right-0 mt-2 w-56 bg-white border border-stone-200 rounded-xl shadow-xl py-1 z-50 text-xs"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <div className="px-4 py-2 border-b border-stone-100">
                      <div className="font-semibold text-stone-900">{profile?.fullName || "Employee"}</div>
                      <div className="text-stone-500 truncate text-[11px]">{user.email}</div>
                      <div className="mt-1.5">{getRoleBadge()}</div>
                    </div>
                    <button
                      onClick={signOut}
                      className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="bg-[#00A69C] hover:bg-[#009087] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Staff Sign In</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
