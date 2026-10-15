import React, { useState, useEffect, useRef } from "react";
import { dataService } from "../lib/supabase";
import { useAuth } from "../lib/authContext";
import {
  DEFAULT_PRODUCTION_PRESETS,
  JOB_STATUSES,
  PREDEFINED_SPECIES,
  PREDEFINED_PROFILES,
  PREDEFINED_FINISHES,
} from "../lib/dataModels";
import { calculateShopParts } from "../lib/calculationEngine";
import { generateShopCutListPdf } from "../lib/pdfGenerator";
import { toFraction, roundDimension, parseFraction } from "../utils";
import DimensionInput from "./DimensionInput";
import { ConfirmModal } from "./ConfirmModal";
import {
  Hammer,
  Plus,
  Trash2,
  Save,
  Download,
  DollarSign,
  Settings,
  Layers,
  ChevronDown,
  CheckCircle2,
  Calendar,
  User,
  Phone,
  Mail,
  FileText,
  Sliders,
  Sparkles,
  Zap,
} from "lucide-react";
import toast from "react-hot-toast";

const parseDimension = (value, fallback = 0) => {
  if (value == null || value === "") return fallback;
  const parsedValue = parseFraction(value);
  return Number.isNaN(parsedValue) ? fallback : parsedValue;
};

const COMMON_SIZES = [
  { label: "30x80", width: 30, height: 80 },
  { label: "32x84", width: 32, height: 84 },
  { label: "36x96", width: 36, height: 96 },
  { label: "18x30", width: 18, height: 30 },
  { label: "15x30", width: 15, height: 30 },
  { label: "24x42", width: 24, height: 42 },
];

export const JobsWorkspace = ({ onCreateQuoteForJob, selectedJobId = null }) => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [activeJob, setActiveJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [showPresetsModal, setShowPresetsModal] = useState(false);
  const [showBatchProportionsModal, setShowBatchProportionsModal] = useState(false);

  // Deletion modals state
  const [jobToDelete, setJobToDelete] = useState(null);
  const [doorIndexToDelete, setDoorIndexToDelete] = useState(null);

  // Batch Proportions state
  const [batchProps, setBatchProps] = useState({
    stileWidth: 5,
    topRailWidth: 5,
    lockRailWidth: 6.25,
    bottomRailWidth: 9,
  });

  const loadJobs = async () => {
    setLoading(true);
    try {
      const data = await dataService.getJobs();
      setJobs(data || []);
      if (selectedJobId) {
        const found = data.find((j) => j.id === selectedJobId);
        if (found) setActiveJob(found);
      } else if (data.length > 0 && !activeJob) {
        setActiveJob(data[0]);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load shop jobs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, [selectedJobId]);

  // Recalculate parts cache whenever activeJob's doors or presets change
  const activeParts = activeJob
    ? calculateShopParts(
        activeJob.doors || [],
        activeJob.productionPresets || DEFAULT_PRODUCTION_PRESETS,
        activeJob.doorType || "2 Panel",
        activeJob.profile || "Shaker"
      )
    : null;

  const handleCreateNewJob = async () => {
    const defaultJob = {
      jobName: "New Custom Shop Job",
      customerName: "New Customer",
      doorType: "2 Panel",
      species: "Poplar",
      profile: "Shaker",
      finish: "Stain",
      doors: [
        {
          id: "d-" + Date.now(),
          qty: 1,
          width: 36,
          height: 96,
          visualProportions: { stileWidth: 5, topRailWidth: 5, lockRailWidth: 6.25, bottomRailWidth: 9, heightToLockRail: 36 },
        },
      ],
      productionPresets: DEFAULT_PRODUCTION_PRESETS,
    };
    try {
      const created = await dataService.createJob(defaultJob);
      await dataService.logAuditEvent("JOB_CREATED", "jobs", created.id, { jobCode: created.jobCode }, user?.id);
      toast.success(`Job ${created.jobCode} created!`);
      await loadJobs();
      setActiveJob(created);
    } catch (err) {
      console.error(err);
      toast.error("Failed to create job");
    }
  };

  const handleSaveJob = async () => {
    if (!activeJob) return;
    try {
      await dataService.updateJob(activeJob.id, {
        job_name: activeJob.jobName || activeJob.job_name,
        customer_name: activeJob.customerName || activeJob.customer_name,
        customer_email: activeJob.customerEmail || activeJob.customer_email,
        customer_phone: activeJob.customerPhone || activeJob.customer_phone,
        door_type: activeJob.doorType || activeJob.door_type,
        species: activeJob.species,
        profile: activeJob.profile,
        finish: activeJob.finish,
        status: activeJob.status,
        doors: activeJob.doors,
        production_presets: activeJob.productionPresets || activeJob.production_presets,
        notes: activeJob.notes,
      });
      await dataService.logAuditEvent("JOB_UPDATED", "jobs", activeJob.id, { jobCode: activeJob.jobCode || activeJob.job_code }, user?.id);
      toast.success("Job updated and cut list recalculated!");
      await loadJobs();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save job");
    }
  };

  const handleDownloadCutListPdf = () => {
    if (!activeJob || !activeParts) return;
    generateShopCutListPdf({
      jobCode: activeJob.jobCode || activeJob.job_code,
      jobName: activeJob.jobName || activeJob.job_name,
      doorType: activeJob.doorType || activeJob.door_type,
      species: activeJob.species,
      profile: activeJob.profile,
      finish: activeJob.finish,
      parts: activeParts,
      notes: activeJob.notes,
    });
    toast.success("Shop Cut List PDF downloaded!");
  };

  // Door row manipulation
  const handleAddDoorRow = (width = 36, height = 96, qty = 1) => {
    if (!activeJob) return;
    const doors = [...(activeJob.doors || [])];
    doors.push({
      id: "d-" + Date.now() + Math.random().toString(36).substring(2, 5),
      qty,
      width,
      height,
      visualProportions: { ...(doors[0]?.visualProportions || batchProps) },
    });
    setActiveJob({ ...activeJob, doors });
  };

  // Confirm row deletion with undo toast
  const handleConfirmRemoveDoorRow = () => {
    if (!activeJob || doorIndexToDelete == null) return;
    const doors = [...(activeJob.doors || [])];
    const removed = doors[doorIndexToDelete];
    const removedIndex = doorIndexToDelete;

    doors.splice(doorIndexToDelete, 1);
    setActiveJob({ ...activeJob, doors });
    setDoorIndexToDelete(null);

    toast(
      (t) => (
        <div className="flex items-center justify-between gap-3 text-xs">
          <span>Door size row removed.</span>
          <button
            onClick={() => {
              const restored = [...(activeJob.doors || [])];
              restored.splice(removedIndex, 0, removed);
              setActiveJob({ ...activeJob, doors: restored });
              toast.dismiss(t.id);
              toast.success("Row restored!");
            }}
            className="text-teal-400 font-bold hover:underline"
          >
            Undo
          </button>
        </div>
      ),
      { duration: 4000 }
    );
  };

  // Confirm delete full job
  const handleConfirmDeleteJob = async () => {
    if (!jobToDelete) return;
    const deletedJob = jobToDelete;
    try {
      await dataService.deleteJob(deletedJob.id);
      await dataService.logAuditEvent("JOB_DELETED", "jobs", deletedJob.id, { jobCode: deletedJob.jobCode }, user?.id);
      setJobToDelete(null);
      await loadJobs();
      setActiveJob(jobs.find((j) => j.id !== deletedJob.id) || null);

      toast(
        (t) => (
          <div className="flex items-center justify-between gap-3 text-xs">
            <span>Job {deletedJob.jobCode} deleted.</span>
            <button
              onClick={async () => {
                await dataService.createJob(deletedJob);
                await loadJobs();
                toast.dismiss(t.id);
                toast.success("Job restored!");
              }}
              className="text-teal-400 font-bold hover:underline"
            >
              Undo
            </button>
          </div>
        ),
        { duration: 5000 }
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete job");
    }
  };

  const handleUpdateDoor = (index, field, value) => {
    if (!activeJob) return;
    const doors = [...(activeJob.doors || [])];
    doors[index] = { ...doors[index], [field]: value };
    setActiveJob({ ...activeJob, doors });
  };

  const handleApplyBatchProportions = () => {
    if (!activeJob) return;
    const doors = (activeJob.doors || []).map((d) => ({
      ...d,
      visualProportions: {
        ...(d.visualProportions || {}),
        ...batchProps,
      },
    }));
    setActiveJob({ ...activeJob, doors });
    setShowBatchProportionsModal(false);
    toast.success("Applied proportions to all doors in this job!");
  };

  const filteredJobs = jobs.filter((j) => {
    if (statusFilter === "all") return true;
    return j.status === statusFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fadeIn">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-stone-900 flex items-center gap-2.5">
            <Hammer className="w-6 h-6 text-[#00A69C]" />
            <span>Shop Jobs & Cut Lists</span>
          </h2>
          <p className="text-sm text-stone-500 mt-1">
            Authoritative manufacturing workspace, tooling parameters, and production cut lists.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-stone-300 text-stone-700 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-[#00A69C] shadow-2xs cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="in_production">In Production</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>

          <button
            onClick={handleCreateNewJob}
            className="bg-[#00A69C] hover:bg-[#009087] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Job</span>
          </button>
        </div>
      </div>

      {/* Main Jobs Layout: Sidebar + Detail Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar: Job List */}
        <div className="lg:col-span-1 bg-white border border-stone-200 rounded-2xl p-4 space-y-2 h-[780px] overflow-y-auto shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-stone-400 px-2 mb-2">
            Active Jobs ({filteredJobs.length})
          </div>

          {filteredJobs.map((job) => {
            const isSelected = activeJob?.id === job.id;
            const totalDoors = (job.doors || []).reduce((acc, d) => acc + (parseInt(d.qty, 10) || 1), 0);

            return (
              <button
                key={job.id}
                onClick={() => setActiveJob(job)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-teal-50/70 border-teal-300 shadow-2xs"
                    : "bg-stone-50 border-stone-200 hover:bg-stone-100"
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-mono text-xs font-bold text-[#00A69C]">
                    {job.jobCode || job.job_code}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                      job.status === "in_production"
                        ? "bg-teal-100 text-teal-800"
                        : job.status === "completed"
                        ? "bg-stone-200 text-stone-700"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {job.status}
                  </span>
                </div>
                <div className="font-bold text-sm text-stone-900 line-clamp-1">
                  {job.jobName || job.job_name}
                </div>
                <div className="flex items-center justify-between text-xs text-stone-500 mt-2">
                  <span>{job.customerName || job.customer_name || "Direct Customer"}</span>
                  <span className="font-mono text-stone-400">{totalDoors} doors</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Area: Job Editor & Cut List */}
        {activeJob ? (
          <div className="lg:col-span-3 space-y-6">
            {/* Action Bar */}
            <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#00A69C] bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    {activeJob.jobCode || activeJob.job_code}
                  </span>
                  <input
                    type="text"
                    value={activeJob.jobName || activeJob.job_name}
                    onChange={(e) =>
                      setActiveJob({ ...activeJob, jobName: e.target.value, job_name: e.target.value })
                    }
                    className="text-xl font-bold text-stone-900 bg-transparent border-b border-transparent hover:border-stone-300 focus:border-[#00A69C] focus:outline-none px-1"
                  />
                </div>
                <div className="text-xs text-stone-500 flex items-center gap-4">
                  <span>Customer: <strong className="text-stone-800">{activeJob.customerName || activeJob.customer_name}</strong></span>
                  <span>Species: <strong className="text-stone-800">{activeJob.species}</strong></span>
                  <span>Profile: <strong className="text-stone-800">{activeJob.profile}</strong></span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setShowPresetsModal(true)}
                  className="bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-300 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                >
                  <Settings className="w-3.5 h-3.5 text-stone-500" />
                  <span>Presets</span>
                </button>

                <button
                  onClick={handleDownloadCutListPdf}
                  className="bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-300 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5 text-[#00A69C]" />
                  <span>Shop Cut PDF</span>
                </button>

                <button
                  onClick={() => onCreateQuoteForJob(activeJob)}
                  className="bg-stone-50 hover:bg-teal-50 text-[#00A69C] border border-teal-200 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Create Quote</span>
                </button>

                <button
                  onClick={handleSaveJob}
                  className="bg-[#00A69C] hover:bg-[#009087] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </button>

                <button
                  onClick={() => setJobToDelete(activeJob)}
                  className="bg-white hover:bg-stone-100 text-stone-600 hover:text-rose-600 border border-stone-300 hover:border-rose-300 p-2 rounded-xl transition-all cursor-pointer shadow-2xs"
                  title="Delete this job"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Specifications Form */}
            <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block text-stone-500 font-semibold mb-1">Door Style</label>
                <select
                  value={activeJob.doorType || activeJob.door_type}
                  onChange={(e) =>
                    setActiveJob({ ...activeJob, doorType: e.target.value, door_type: e.target.value })
                  }
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-[#00A69C] cursor-pointer"
                >
                  <option value="1 Panel">1 Panel</option>
                  <option value="2 Panel">2 Panel</option>
                  <option value="3 Panel">3 Panel</option>
                </select>
              </div>

              <div>
                <label className="block text-stone-500 font-semibold mb-1">Wood Species</label>
                <select
                  value={activeJob.species}
                  onChange={(e) => setActiveJob({ ...activeJob, species: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-[#00A69C] font-bold focus:outline-none focus:border-[#00A69C] cursor-pointer"
                >
                  {PREDEFINED_SPECIES.map((sp) => (
                    <option key={sp} value={sp}>{sp}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-stone-500 font-semibold mb-1">Tooling Profile</label>
                <select
                  value={activeJob.profile}
                  onChange={(e) => setActiveJob({ ...activeJob, profile: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-[#00A69C] cursor-pointer"
                >
                  {PREDEFINED_PROFILES.map((pr) => (
                    <option key={pr} value={pr}>{pr}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-stone-500 font-semibold mb-1">Status</label>
                <select
                  value={activeJob.status}
                  onChange={(e) => setActiveJob({ ...activeJob, status: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 font-bold capitalize focus:outline-none focus:border-[#00A69C] cursor-pointer"
                >
                  <option value="draft">Draft</option>
                  <option value="in_production">In Production</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            {/* Door Schedule Table with Rapid Entry */}
            <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#00A69C]" />
                  <h3 className="font-bold text-base text-stone-900">Job Doors & Sizing</h3>
                </div>

                {/* Estimator Accelerators */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowBatchProportionsModal(true)}
                    className="bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-300 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Sliders className="w-3.5 h-3.5 text-[#00A69C]" />
                    <span>Batch Proportions</span>
                  </button>

                  <button
                    onClick={() => handleAddDoorRow(36, 96, 1)}
                    className="bg-[#00A69C] hover:bg-[#009087] text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Row (Enter)</span>
                  </button>
                </div>
              </div>

              {/* Quick Presets Bar */}
              <div className="flex items-center gap-1.5 flex-wrap bg-stone-50 p-2.5 rounded-xl border border-stone-200 text-xs">
                <span className="text-stone-500 text-[11px] font-bold flex items-center gap-1 mr-1">
                  <Zap className="w-3.5 h-3.5 text-amber-500" /> Quick Add:
                </span>
                {COMMON_SIZES.map((cs) => (
                  <button
                    key={cs.label}
                    onClick={() => handleAddDoorRow(cs.width, cs.height, 1)}
                    className="bg-white hover:bg-stone-100 text-stone-700 px-2.5 py-1 rounded-lg border border-stone-200 hover:border-teal-400 transition-colors font-mono text-[11px] font-bold cursor-pointer shadow-2xs"
                  >
                    + {cs.label}
                  </button>
                ))}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-stone-700">
                  <thead className="bg-stone-50 text-stone-500 uppercase font-semibold border-b border-stone-200">
                    <tr>
                      <th className="px-3 py-2.5">#</th>
                      <th className="px-3 py-2.5">Qty</th>
                      <th className="px-3 py-2.5">Width (in)</th>
                      <th className="px-3 py-2.5">Height (in)</th>
                      <th className="px-3 py-2.5">Stile Width</th>
                      <th className="px-3 py-2.5">Top Rail</th>
                      <th className="px-3 py-2.5">Bot Rail</th>
                      <th className="px-3 py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {(activeJob.doors || []).map((door, idx) => {
                      const props = door.visualProportions || {};
                      const isLastRow = idx === (activeJob.doors || []).length - 1;

                      return (
                        <tr key={door.id || idx} className="hover:bg-stone-50 transition-colors">
                          <td className="px-3 py-2 font-bold text-stone-400">{idx + 1}</td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min="1"
                              value={door.qty}
                              onChange={(e) => handleUpdateDoor(idx, "qty", parseInt(e.target.value, 10) || 1)}
                              className="w-16 bg-stone-50 border border-stone-300 rounded-lg px-2 py-1 text-[#00A69C] font-bold focus:border-[#00A69C] focus:ring-1 focus:ring-[#00A69C] outline-none"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <DimensionInput
                              value={door.width}
                              onChange={(val) => handleUpdateDoor(idx, "width", val)}
                              className="w-24 bg-stone-50 border border-stone-300 rounded-lg px-2 py-1 text-stone-900 font-bold focus:border-[#00A69C] focus:ring-1 focus:ring-[#00A69C] outline-none"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <DimensionInput
                              value={door.height}
                              onChange={(val) => handleUpdateDoor(idx, "height", val)}
                              className="w-24 bg-stone-50 border border-stone-300 rounded-lg px-2 py-1 text-stone-900 font-bold focus:border-[#00A69C] focus:ring-1 focus:ring-[#00A69C] outline-none"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <DimensionInput
                              value={props.stileWidth || 5}
                              onChange={(val) =>
                                handleUpdateDoor(idx, "visualProportions", {
                                  ...props,
                                  stileWidth: parseDimension(val, 5),
                                })
                              }
                              className="w-20 bg-stone-50 border border-stone-300 rounded-lg px-2 py-1 text-stone-700 focus:border-[#00A69C] focus:ring-1 focus:ring-[#00A69C] outline-none"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <DimensionInput
                              value={props.topRailWidth || 5}
                              onChange={(val) =>
                                handleUpdateDoor(idx, "visualProportions", {
                                  ...props,
                                  topRailWidth: parseDimension(val, 5),
                                })
                              }
                              className="w-20 bg-stone-50 border border-stone-300 rounded-lg px-2 py-1 text-stone-700 focus:border-[#00A69C] focus:ring-1 focus:ring-[#00A69C] outline-none"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <DimensionInput
                              value={props.bottomRailWidth || 9}
                              onChange={(val) =>
                                handleUpdateDoor(idx, "visualProportions", {
                                  ...props,
                                  bottomRailWidth: parseDimension(val, 9),
                                })
                              }
                              className="w-20 bg-stone-50 border border-stone-300 rounded-lg px-2 py-1 text-stone-700 focus:border-[#00A69C] focus:ring-1 focus:ring-[#00A69C] outline-none"
                            />
                          </td>
                          <td className="px-3 py-2 text-right">
                            <button
                              onClick={() => setDoorIndexToDelete(idx)}
                              className="text-stone-500 hover:text-rose-600 p-1.5 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
                              title="Delete door size row"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Authoritative Parts Cut-List Output */}
            {activeParts && (
              <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                  <div>
                    <h3 className="font-bold text-base text-stone-900">Authoritative Shop Cut List</h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Calculated using {activeJob.profile} tooling offsets
                    </p>
                  </div>
                  <span className="bg-teal-50 text-[#00A69C] border border-teal-200 text-xs font-bold px-3 py-1 rounded-full shadow-2xs">
                    Total: {activeParts.totalDoors} Doors
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Stiles */}
                  <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
                    <h4 className="font-bold text-xs uppercase text-[#00A69C] tracking-wider mb-3">
                      Stiles (Cut Sizes)
                    </h4>
                    <div className="space-y-2">
                      {activeParts.stiles.map((s, i) => (
                        <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-stone-200/60">
                          <span className="font-bold text-[#00A69C] bg-white px-2 py-0.5 rounded border border-stone-200 shadow-2xs">
                            {s.qty}x
                          </span>
                          <span className="font-mono text-stone-800 font-semibold">
                            {toFraction(s.thickness)}" x {toFraction(s.width)}" x {toFraction(s.length)}"
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Rails */}
                  <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
                    <h4 className="font-bold text-xs uppercase text-[#00A69C] tracking-wider mb-3">
                      Rails (Cut Sizes)
                    </h4>
                    <div className="space-y-2">
                      {activeParts.rails.map((r, i) => (
                        <div key={`tr-${i}`} className="flex items-center justify-between text-xs py-1 border-b border-stone-200/60">
                          <span className="text-stone-500 font-medium">Top ({r.qty}x):</span>
                          <span className="font-mono text-stone-800 font-semibold">
                            {toFraction(r.width)}" x {toFraction(r.length)}"
                          </span>
                        </div>
                      ))}
                      {activeParts.middleRails.map((r, i) => (
                        <div key={`mr-${i}`} className="flex items-center justify-between text-xs py-1 border-b border-stone-200/60">
                          <span className="text-stone-500 font-medium">Lock/Mid ({r.qty}x):</span>
                          <span className="font-mono text-stone-800 font-semibold">
                            {toFraction(r.width)}" x {toFraction(r.length)}"
                          </span>
                        </div>
                      ))}
                      {activeParts.bottomRails.map((r, i) => (
                        <div key={`br-${i}`} className="flex items-center justify-between text-xs py-1 border-b border-stone-200/60">
                          <span className="text-stone-500 font-medium">Bottom ({r.qty}x):</span>
                          <span className="font-mono text-stone-800 font-semibold">
                            {toFraction(r.width)}" x {toFraction(r.length)}"
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Panels */}
                  <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
                    <h4 className="font-bold text-xs uppercase text-[#00A69C] tracking-wider mb-3">
                      Panels (Cut Sizes)
                    </h4>
                    <div className="space-y-2">
                      {activeParts.panels.map((group, gi) =>
                        group.items.map((item, ii) => (
                          <div key={`${gi}-${ii}`} className="flex items-center justify-between text-xs py-1 border-b border-stone-200/60">
                            <span className="text-stone-500 font-medium">
                              {item.label || group.section} ({item.qty}x):
                            </span>
                            <span className="font-mono text-[#00A69C] font-bold">
                              {toFraction(item.width)}" x {toFraction(item.height)}"
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="lg:col-span-3 bg-white border border-stone-200 rounded-2xl p-12 text-center text-stone-500 shadow-sm">
            Select a job or create a new job to start manufacturing.
          </div>
        )}
      </div>

      {/* Batch Proportions Modal */}
      {showBatchProportionsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-bold text-base text-stone-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#00A69C]" />
                <span>Apply Proportions to All Doors</span>
              </h3>
              <button
                onClick={() => setShowBatchProportionsModal(false)}
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-stone-600 mb-1 font-semibold">Stile Width</label>
                <DimensionInput
                  value={batchProps.stileWidth}
                  onChange={(val) => setBatchProps((p) => ({ ...p, stileWidth: parseDimension(val, 5) }))}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-stone-900 font-bold"
                />
              </div>

              <div>
                <label className="block text-stone-600 mb-1 font-semibold">Top Rail</label>
                <DimensionInput
                  value={batchProps.topRailWidth}
                  onChange={(val) => setBatchProps((p) => ({ ...p, topRailWidth: parseDimension(val, 5) }))}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-stone-900 font-bold"
                />
              </div>

              <div>
                <label className="block text-stone-600 mb-1 font-semibold">Bottom Rail</label>
                <DimensionInput
                  value={batchProps.bottomRailWidth}
                  onChange={(val) => setBatchProps((p) => ({ ...p, bottomRailWidth: parseDimension(val, 9) }))}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-stone-900 font-bold"
                />
              </div>

              <div>
                <label className="block text-stone-600 mb-1 font-semibold">Lock Rail</label>
                <DimensionInput
                  value={batchProps.lockRailWidth}
                  onChange={(val) => setBatchProps((p) => ({ ...p, lockRailWidth: parseDimension(val, 6.25) }))}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-stone-900 font-bold"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-stone-100">
              <button
                onClick={() => setShowBatchProportionsModal(false)}
                className="bg-stone-100 hover:bg-stone-200 text-stone-700 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyBatchProportions}
                className="bg-[#00A69C] hover:bg-[#009087] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm cursor-pointer"
              >
                Apply to All Doors
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tooling Presets Modal */}
      {showPresetsModal && activeJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-stone-200 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden text-stone-900 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-bold text-base text-stone-900 flex items-center gap-2">
                <Settings className="w-4 h-4 text-[#00A69C]" />
                <span>Internal Manufacturing Presets</span>
              </h3>
              <button onClick={() => setShowPresetsModal(false)} className="text-stone-400 hover:text-stone-700 cursor-pointer">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-stone-500 mb-1 font-semibold">Groove Depth (in)</label>
                <DimensionInput
                  value={activeJob.productionPresets?.grooveDepth ?? 1.5}
                  onChange={(val) =>
                    setActiveJob({
                      ...activeJob,
                      productionPresets: {
                        ...activeJob.productionPresets,
                        grooveDepth: parseDimension(val, 1.5),
                      },
                    })
                  }
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-stone-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-stone-500 mb-1 font-semibold">Tongue Length (in)</label>
                <DimensionInput
                  value={activeJob.productionPresets?.tongueLength ?? 1.5}
                  onChange={(val) =>
                    setActiveJob({
                      ...activeJob,
                      productionPresets: {
                        ...activeJob.productionPresets,
                        tongueLength: parseDimension(val, 1.5),
                      },
                    })
                  }
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-stone-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-stone-500 mb-1 font-semibold">Vertical Panel Clearance (in)</label>
                <DimensionInput
                  value={activeJob.productionPresets?.verticalPanelClearance ?? 0.875}
                  onChange={(val) =>
                    setActiveJob({
                      ...activeJob,
                      productionPresets: {
                        ...activeJob.productionPresets,
                        verticalPanelClearance: parseDimension(val, 0.875),
                      },
                    })
                  }
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-stone-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-stone-500 mb-1 font-semibold">Horizontal Panel Clearance (in)</label>
                <DimensionInput
                  value={activeJob.productionPresets?.horizontalPanelClearance ?? 0.5}
                  onChange={(val) =>
                    setActiveJob({
                      ...activeJob,
                      productionPresets: {
                        ...activeJob.productionPresets,
                        horizontalPanelClearance: parseDimension(val, 0.5),
                      },
                    })
                  }
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-stone-900 font-mono"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-stone-100 flex justify-end">
              <button
                onClick={() => {
                  setShowPresetsModal(false);
                  toast.success("Presets updated!");
                }}
                className="bg-[#00A69C] hover:bg-[#009087] text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
              >
                Apply Presets
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Door Row Confirm Modal */}
      <ConfirmModal
        isOpen={doorIndexToDelete != null}
        title="Remove Door Size Row?"
        message="Are you sure you want to remove this door size from the shop cut list?"
        confirmLabel="Remove Row"
        onConfirm={handleConfirmRemoveDoorRow}
        onCancel={() => setDoorIndexToDelete(null)}
      />

      {/* Delete Job Confirm Modal */}
      <ConfirmModal
        isOpen={Boolean(jobToDelete)}
        title={`Delete Job ${jobToDelete?.jobCode || ""}?`}
        message="This will permanently delete this job record, customer info, and parts cut lists. You can undo immediately from the toast notification."
        confirmLabel="Delete Job"
        onConfirm={handleConfirmDeleteJob}
        onCancel={() => setJobToDelete(null)}
      />
    </div>
  );
};
