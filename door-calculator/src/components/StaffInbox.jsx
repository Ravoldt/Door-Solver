import React, { useState, useEffect } from "react";
import { dataService } from "../lib/supabase";
import {
  Inbox,
  Search,
  Hammer,
  Eye,
  Calendar,
} from "lucide-react";
import toast from "react-hot-toast";

export const StaffInbox = ({ onSelectSubmission, onImportToJob }) => {
  const [submissions, setSubmissions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const loadSubmissions = async () => {
    setLoading(true);
    try {
      const data = await dataService.getAllSubmissions();
      setSubmissions(data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load submissions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubmissions();
  }, []);

  const filtered = submissions.filter((s) => {
    const term = searchTerm.toLowerCase();
    return (
      s.shareCode?.toLowerCase().includes(term) ||
      s.jobName?.toLowerCase().includes(term) ||
      s.species?.toLowerCase().includes(term) ||
      s.doorType?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fadeIn">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-stone-900 flex items-center gap-2.5">
            <Inbox className="w-6 h-6 text-[#00A69C]" />
            <span>Customer Submissions Inbox</span>
          </h2>
          <p className="text-sm text-stone-500 mt-1">
            Browse shared customer designs and import them into internal shop manufacturing jobs.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-stone-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by code, job, species..."
            className="w-full bg-white border border-stone-300 rounded-xl pl-10 pr-4 py-2 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#00A69C] focus:ring-1 focus:ring-[#00A69C] shadow-2xs"
          />
        </div>
      </div>

      {/* Submissions List */}
      {loading ? (
        <div className="text-center py-16 text-stone-500">Loading submissions...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center text-stone-500 shadow-sm">
          <Inbox className="w-10 h-10 mx-auto text-stone-400 mb-3" />
          <h3 className="text-base font-bold text-stone-800">No Submissions Found</h3>
          <p className="text-xs text-stone-500 mt-1">
            {searchTerm ? "Try searching for a different keyword or code." : "Public customer designs will appear here once saved."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((item) => {
            const spec = item.designSpec || {};
            const doors = spec.doors || [];
            const totalDoors = doors.reduce((acc, d) => acc + (parseInt(d.qty, 10) || 1), 0);

            return (
              <div
                key={item.id}
                className="bg-white border border-stone-200 hover:border-teal-400/80 rounded-2xl p-5 shadow-xs hover:shadow-md flex flex-col justify-between transition-all group"
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="font-mono text-xs font-bold bg-teal-50 text-[#00A69C] border border-teal-200 px-2.5 py-1 rounded-md">
                      {item.shareCode}
                    </span>
                    <span className="text-[11px] text-stone-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Title & Specs */}
                  <h3 className="font-bold text-base text-stone-900 group-hover:text-[#00A69C] transition-colors line-clamp-1">
                    {item.jobName}
                  </h3>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-stone-50 px-2.5 py-1.5 rounded-lg border border-stone-200">
                      <span className="text-stone-500 text-[10px] uppercase font-bold block">Style</span>
                      <span className="font-semibold text-stone-800">{item.doorType}</span>
                    </div>
                    <div className="bg-stone-50 px-2.5 py-1.5 rounded-lg border border-stone-200">
                      <span className="text-stone-500 text-[10px] uppercase font-bold block">Species</span>
                      <span className="font-bold text-[#00A69C]">{item.species}</span>
                    </div>
                    <div className="bg-stone-50 px-2.5 py-1.5 rounded-lg border border-stone-200">
                      <span className="text-stone-500 text-[10px] uppercase font-bold block">Profile</span>
                      <span className="font-semibold text-stone-800">{item.profile}</span>
                    </div>
                    <div className="bg-stone-50 px-2.5 py-1.5 rounded-lg border border-stone-200">
                      <span className="text-stone-500 text-[10px] uppercase font-bold block">Doors</span>
                      <span className="font-bold text-stone-900">{totalDoors} units</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="mt-5 pt-4 border-t border-stone-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onSelectSubmission(item)}
                    className="text-stone-600 hover:text-stone-900 text-xs font-semibold flex items-center gap-1.5 py-1.5 px-2 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Spec</span>
                  </button>

                  <button
                    onClick={() => onImportToJob(item)}
                    className="bg-[#00A69C] hover:bg-[#009087] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    <Hammer className="w-3.5 h-3.5" />
                    <span>Import to Job</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StaffInbox;
