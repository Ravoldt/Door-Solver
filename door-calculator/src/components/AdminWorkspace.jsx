import React, { useState, useEffect } from "react";
import { dataService } from "../lib/supabase";
import { useAuth } from "../lib/authContext";
import { DEFAULT_PRICE_BOOK, USER_ROLES } from "../lib/dataModels";
import { formatCents } from "../lib/pricingEngine";
import {
  ShieldCheck,
  Users,
  BookOpen,
  History,
  Plus,
} from "lucide-react";
import toast from "react-hot-toast";

export const AdminWorkspace = () => {
  const { user } = useAuth();
  const [activeAdminTab, setActiveAdminTab] = useState("users");
  const [profiles, setProfiles] = useState([]);
  const [priceBooks, setPriceBooks] = useState([]);
  const [auditEvents, setAuditEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Price Book Modal State
  const [showNewPBModal, setShowNewPBModal] = useState(false);
  const [newPBVersion, setNewPBVersion] = useState("v1.1.0");
  const [newPBName, setNewPBName] = useState("Updated 2026 Price Book");
  const [newPBRules, setNewPBRules] = useState(DEFAULT_PRICE_BOOK.rules);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [profs, pbs, audits] = await Promise.all([
        dataService.getProfiles(),
        dataService.getPriceBooks(),
        dataService.getAuditEvents(),
      ]);
      setProfiles(profs || []);
      setPriceBooks(pbs || [DEFAULT_PRICE_BOOK]);
      setAuditEvents(audits || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  // Role modification
  const handleUpdateRole = async (profileId, newRole, email) => {
    try {
      await dataService.updateProfileRole(profileId, newRole);
      await dataService.logAuditEvent(
        "USER_ROLE_UPDATED",
        "profiles",
        profileId,
        { email, newRole },
        user?.id
      );
      toast.success(`Updated role for ${email} to ${newRole.toUpperCase()}`);
      await loadAdminData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update role");
    }
  };

  // Publish new price book
  const handlePublishPriceBook = async () => {
    try {
      const created = await dataService.createPriceBook(
        {
          version: newPBVersion,
          name: newPBName,
          status: "published",
          rules: newPBRules,
        },
        user?.id
      );

      await dataService.logAuditEvent(
        "PRICE_BOOK_PUBLISHED",
        "price_books",
        created.id,
        { version: newPBVersion, name: newPBName },
        user?.id
      );

      toast.success(`Price Book ${newPBVersion} published!`);
      setShowNewPBModal(false);
      await loadAdminData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to publish price book");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fadeIn">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-stone-900 flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-amber-600" />
            <span>Administrator Control Center</span>
          </h2>
          <p className="text-sm text-stone-500 mt-1">
            Manage user authorization, published price-book revisions, and security audit logs.
          </p>
        </div>

        {/* Sub-Tabs */}
        <div className="flex items-center gap-1 bg-stone-100 border border-stone-200 p-1 rounded-xl shadow-2xs">
          <button
            onClick={() => setActiveAdminTab("users")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeAdminTab === "users"
                ? "bg-amber-600 text-white shadow-xs"
                : "text-stone-600 hover:text-stone-900 hover:bg-stone-200/60"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>User Roles</span>
          </button>

          <button
            onClick={() => setActiveAdminTab("pricing")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeAdminTab === "pricing"
                ? "bg-amber-600 text-white shadow-xs"
                : "text-stone-600 hover:text-stone-900 hover:bg-stone-200/60"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Price Books</span>
          </button>

          <button
            onClick={() => setActiveAdminTab("audit")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeAdminTab === "audit"
                ? "bg-amber-600 text-white shadow-xs"
                : "text-stone-600 hover:text-stone-900 hover:bg-stone-200/60"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Audit Trail</span>
          </button>
        </div>
      </div>

      {/* 1. USER ROLES TAB */}
      {activeAdminTab === "users" && (
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-stone-900">Employee & User Authorization</h3>
              <p className="text-xs text-stone-500">
                Approve pending signups and assign Staff or Admin roles.
              </p>
            </div>
            <span className="text-xs text-stone-500 font-semibold">Total: {profiles.length} Accounts</span>
          </div>

          <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs text-stone-700">
              <thead className="bg-stone-50 text-stone-500 uppercase font-semibold border-b border-stone-200">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Current Role</th>
                  <th className="px-4 py-3 text-right">Assign Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {profiles.map((p) => {
                  const isPending = p.role === USER_ROLES.PENDING;
                  const isStaff = p.role === USER_ROLES.STAFF;
                  const isAdmin = p.role === USER_ROLES.ADMIN;

                  return (
                    <tr key={p.id} className="hover:bg-stone-50/60">
                      <td className="px-4 py-3 font-semibold text-stone-900">
                        {p.fullName || p.full_name || "Employee"}
                      </td>
                      <td className="px-4 py-3 font-mono text-stone-500">{p.email}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2.5 py-1 rounded-full font-bold text-[11px] uppercase ${
                            isAdmin
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : isStaff
                              ? "bg-teal-50 text-teal-700 border border-teal-200"
                              : "bg-yellow-50 text-yellow-700 border border-yellow-200 animate-pulse"
                          }`}
                        >
                          {p.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        {isPending && (
                          <button
                            onClick={() => handleUpdateRole(p.id, USER_ROLES.STAFF, p.email)}
                            className="bg-[#00A69C] hover:bg-[#009087] text-white px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                          >
                            Approve as Staff
                          </button>
                        )}
                        {!isAdmin && (
                          <button
                            onClick={() => handleUpdateRole(p.id, USER_ROLES.ADMIN, p.email)}
                            className="bg-stone-50 hover:bg-stone-100 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                          >
                            Make Admin
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => handleUpdateRole(p.id, USER_ROLES.STAFF, p.email)}
                            className="bg-stone-50 hover:bg-stone-100 text-stone-600 border border-stone-200 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                          >
                            Set to Staff
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. PRICE BOOKS TAB */}
      {activeAdminTab === "pricing" && (
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-stone-900">Versioned Price Books</h3>
              <p className="text-xs text-stone-500">
                Publish immutable price revisions so historical quotes never change unexpectedly.
              </p>
            </div>
            <button
              onClick={() => setShowNewPBModal(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Publish New Version</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {priceBooks.map((pb) => (
              <div
                key={pb.id}
                className="bg-stone-50 border border-stone-200 rounded-xl p-5 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-md">
                    {pb.version}
                  </span>
                  <span className="text-[11px] font-bold uppercase text-[#00A69C] bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                    {pb.status}
                  </span>
                </div>

                <div className="font-bold text-sm text-stone-900">{pb.name}</div>

                <div className="text-xs text-stone-500 space-y-1.5 pt-2 border-t border-stone-200">
                  <div className="flex justify-between">
                    <span>Base 2-Panel Rate:</span>
                    <span className="font-mono font-bold text-stone-800">
                      {formatCents(pb.rules?.baseStyleRatesCents?.["2 Panel"] ?? 14500)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Poplar Sq Ft Rate:</span>
                    <span className="font-mono font-bold text-stone-800">
                      {formatCents(pb.rules?.speciesSqFtRateCents?.["Poplar"] ?? 650)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Default Markup:</span>
                    <span className="font-mono font-bold text-stone-800">
                      {pb.rules?.defaultMarkupPercent ?? 25}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. AUDIT TRAIL TAB */}
      {activeAdminTab === "audit" && (
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-stone-900">System Security & Audit Trail</h3>
          <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs text-stone-700">
              <thead className="bg-stone-50 text-stone-500 uppercase font-semibold border-b border-stone-200">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Entity</th>
                  <th className="px-4 py-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-mono text-[11px]">
                {auditEvents.map((evt) => (
                  <tr key={evt.id} className="hover:bg-stone-50/60">
                    <td className="px-4 py-3 text-stone-500">
                      {new Date(evt.createdAt || evt.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-bold text-amber-700">{evt.action}</td>
                    <td className="px-4 py-3 text-stone-700">{evt.entityType || evt.entity_type}</td>
                    <td className="px-4 py-3 text-stone-500 truncate max-w-xs">
                      {JSON.stringify(evt.details)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Publish New Price Book Modal */}
      {showNewPBModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-stone-200 rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4 text-stone-900">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-bold text-base text-stone-900">Publish New Price Book Version</h3>
              <button onClick={() => setShowNewPBModal(false)} className="text-stone-400 hover:text-stone-700 cursor-pointer">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-600 mb-1 font-semibold">Version String</label>
                <input
                  type="text"
                  value={newPBVersion}
                  onChange={(e) => setNewPBVersion(e.target.value)}
                  placeholder="v1.1.0"
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-stone-900 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-stone-600 mb-1 font-semibold">Version Title</label>
                <input
                  type="text"
                  value={newPBName}
                  onChange={(e) => setNewPBName(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-stone-900 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-stone-600 mb-1 font-semibold">Base 2-Panel Rate ($)</label>
                  <input
                    type="number"
                    value={(newPBRules.baseStyleRatesCents?.["2 Panel"] ?? 14500) / 100}
                    onChange={(e) =>
                      setNewPBRules({
                        ...newPBRules,
                        baseStyleRatesCents: {
                          ...newPBRules.baseStyleRatesCents,
                          "2 Panel": Math.round(parseFloat(e.target.value) * 100) || 14500,
                        },
                      })
                    }
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-stone-900 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-stone-600 mb-1 font-semibold">Poplar Sq Ft ($)</label>
                  <input
                    type="number"
                    step="0.25"
                    value={(newPBRules.speciesSqFtRateCents?.["Poplar"] ?? 650) / 100}
                    onChange={(e) =>
                      setNewPBRules({
                        ...newPBRules,
                        speciesSqFtRateCents: {
                          ...newPBRules.speciesSqFtRateCents,
                          Poplar: Math.round(parseFloat(e.target.value) * 100) || 650,
                        },
                      })
                    }
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-stone-900 font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-stone-100 flex justify-end gap-2">
              <button
                onClick={() => setShowNewPBModal(false)}
                className="bg-stone-100 hover:bg-stone-200 text-stone-700 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handlePublishPriceBook}
                className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
              >
                Publish Price Book
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminWorkspace;
