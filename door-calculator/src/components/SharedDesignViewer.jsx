import React, { useState, useEffect } from "react";
import { dataService } from "../lib/supabase";
import { useAuth } from "../lib/authContext";
import { generatePublicSpecPdf } from "../lib/pdfGenerator";
import DoorCardSvg from "./DoorCardSvg";
import {
  Search,
  Download,
  Calendar,
  Layers,
  Sparkles,
  Edit3,
  FileSearch,
  Hammer,
  ShieldAlert,
} from "lucide-react";
import toast from "react-hot-toast";

export const SharedDesignViewer = ({
  initialCode = "",
  onEditInDesigner,
  onImportToJob,
}) => {
  const { isStaff } = useAuth();
  const [searchCode, setSearchCode] = useState(initialCode);
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleLookup = async (codeToSearch = searchCode) => {
    const cleanCode = codeToSearch.trim().toUpperCase();
    if (!cleanCode) {
      toast.error("Please enter a valid Share Code (e.g. TC-8492)");
      return;
    }

    setLoading(true);
    setHasSearched(true);
    try {
      const data = await dataService.getSubmissionByShareCode(cleanCode);
      if (data) {
        setSubmission(data);
        toast.success(`Design ${cleanCode} loaded!`);
      } else {
        setSubmission(null);
        toast.error(`No submission found for ${cleanCode}`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Error retrieving submission");
      setSubmission(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialCode) {
      handleLookup(initialCode);
    }
  }, [initialCode]);

  const handleDownloadPdf = () => {
    if (!submission) return;
    const doors = submission.designSpec?.doors || [];
    const firstDoorProportions = doors[0]?.visualProportions || {};

    generatePublicSpecPdf({
      jobName: submission.jobName,
      doorType: submission.doorType,
      species: submission.species,
      profile: submission.profile,
      finish: submission.finish,
      doors,
      shareCode: submission.shareCode,
      proportions: firstDoorProportions,
    });
    toast.success("Spec sheet PDF downloaded!");
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Search Header */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-sm text-center max-w-2xl mx-auto">
        <div className="w-12 h-12 bg-teal-50 text-[#00A69C] border border-teal-200 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xs">
          <FileSearch className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-stone-900 mb-2">Look Up a Shared Door Design</h2>
        <p className="text-sm text-stone-500 mb-6">
          Enter the custom Share Code (e.g. <strong className="text-stone-700">TC-8492</strong>) provided by the customer.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLookup();
          }}
          className="flex items-center gap-2 max-w-md mx-auto"
        >
          <input
            type="text"
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
            placeholder="e.g. TC-8492"
            className="w-full uppercase font-mono tracking-wider bg-stone-50 border border-stone-300 rounded-xl px-4 py-2.5 text-base text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#00A69C] focus:ring-1 focus:ring-[#00A69C] focus:bg-white text-center shadow-2xs"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-[#00A69C] hover:bg-[#009087] text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm whitespace-nowrap cursor-pointer"
          >
            <FileSearch className="w-4 h-4" />
            <span>Look Up</span>
          </button>
        </form>
      </div>

      {/* Result Display */}
      {submission && (
        <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
          {/* Submission Banner */}
          <div className="bg-stone-50 border-b border-stone-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-bold bg-teal-50 text-[#00A69C] border border-teal-200 px-2.5 py-1 rounded-md">
                  {submission.shareCode}
                </span>
                <h3 className="text-xl font-bold text-stone-900">{submission.jobName}</h3>
              </div>
              <div className="text-xs text-stone-500 flex items-center gap-3 mt-1.5">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Saved on {new Date(submission.createdAt).toLocaleDateString()}
                </span>
                <span>•</span>
                <span>Public Design Specification (Sanitized)</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={handleDownloadPdf}
                className="bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-2xs"
              >
                <Download className="w-4 h-4 text-[#00A69C]" />
                <span>Download Spec PDF</span>
              </button>

              <button
                onClick={() => onEditInDesigner(submission)}
                className="bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-2xs"
              >
                <Edit3 className="w-4 h-4 text-stone-500" />
                <span>Modify in Designer</span>
              </button>

              {isStaff && (
                <button
                  onClick={() => onImportToJob(submission)}
                  className="bg-[#00A69C] hover:bg-[#009087] text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-sm cursor-pointer"
                >
                  <Hammer className="w-4 h-4" />
                  <span>Import as Shop Job</span>
                </button>
              )}
            </div>
          </div>

          {/* Details Content */}
          <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Design Metadata & Doors Schedule */}
            <div className="lg:col-span-2 space-y-6">
              {/* Attributes Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200">
                  <div className="text-[11px] uppercase font-bold text-stone-400">Door Style</div>
                  <div className="text-sm font-bold text-stone-900 mt-0.5">{submission.doorType}</div>
                </div>
                <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200">
                  <div className="text-[11px] uppercase font-bold text-stone-400">Species</div>
                  <div className="text-sm font-bold text-[#00A69C] mt-0.5">{submission.species}</div>
                </div>
                <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200">
                  <div className="text-[11px] uppercase font-bold text-stone-400">Profile</div>
                  <div className="text-sm font-bold text-stone-900 mt-0.5">{submission.profile}</div>
                </div>
                <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200">
                  <div className="text-[11px] uppercase font-bold text-stone-400">Finish</div>
                  <div className="text-sm font-bold text-stone-900 mt-0.5">{submission.finish}</div>
                </div>
              </div>

              {/* Doors Schedule Table */}
              <div>
                <h4 className="text-sm font-bold text-stone-800 mb-3 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#00A69C]" />
                  <span>Door Schedule</span>
                </h4>
                <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs text-stone-700">
                    <thead className="bg-stone-50 text-stone-500 uppercase font-semibold border-b border-stone-200">
                      <tr>
                        <th className="px-4 py-3">#</th>
                        <th className="px-4 py-3">Width</th>
                        <th className="px-4 py-3">Height</th>
                        <th className="px-4 py-3">Qty</th>
                        <th className="px-4 py-3">Proportions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200">
                      {(submission.designSpec?.doors || []).map((door, idx) => {
                        const props = door.visualProportions || {};
                        return (
                          <tr key={idx} className="hover:bg-stone-50/60">
                            <td className="px-4 py-3 font-bold text-stone-400">{idx + 1}</td>
                            <td className="px-4 py-3 font-bold text-stone-900">{door.width}"</td>
                            <td className="px-4 py-3 font-bold text-stone-900">{door.height}"</td>
                            <td className="px-4 py-3 font-bold text-[#00A69C]">{door.qty}</td>
                            <td className="px-4 py-3 text-stone-500 font-mono text-[11px]">
                              Stiles: {props.stileWidth}" • Top: {props.topRailWidth}" • Bot: {props.bottomRailWidth}"
                              {props.lockRailWidth ? ` • Lock: ${props.lockRailWidth}"` : ""}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Security / Privacy notice */}
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 flex items-start gap-3 text-xs text-stone-500">
                <ShieldAlert className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                <p>
                  This public view contains only safe visual parameters. Authoritative tooling parameters, groove/tongue depths, cut formulas, and commercial quotes are managed privately by Trim Choice.
                </p>
              </div>
            </div>

            {/* Right: SVG Visual Representation */}
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-6 flex flex-col items-center justify-center">
              <div className="text-xs uppercase font-bold text-stone-500 mb-4 tracking-wider">
                Scaled Drawing Preview
              </div>
              <div className="w-full max-w-[220px] aspect-[1/2.2] flex items-center justify-center bg-white rounded-xl p-3 border border-stone-200 shadow-2xs">
                {submission.designSpec?.doors?.[0] && (
                  <DoorCardSvg
                    width={parseFloat(submission.designSpec.doors[0].width) || 36}
                    height={parseFloat(submission.designSpec.doors[0].height) || 96}
                    settings={{
                      ...submission.designSpec.doors[0].visualProportions,
                    }}
                    doorType={submission.doorType}
                  />
                )}
              </div>
              <div className="text-[11px] text-stone-400 mt-4 text-center">
                Visual representation of Door #1 ({submission.designSpec?.doors?.[0]?.width}" x {submission.designSpec?.doors?.[0]?.height}")
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty Initial State (Before Search) */}
      {!hasSearched && !submission && (
        <div className="bg-white border border-stone-200 rounded-2xl p-8 max-w-2xl mx-auto text-center space-y-4 shadow-sm">
          <div className="text-sm font-bold text-stone-800">How to use Share Codes:</div>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            Customers and contractors generate 6-character share codes from the Door Designer. Enter one above to view the door schedule, download spec sheets, or import directly into shop production.
          </p>
          <div className="flex items-center justify-center gap-2 pt-2 text-xs text-stone-500">
            <span>Try sample codes:</span>
            <button
              onClick={() => {
                setSearchCode("TC-8492");
                handleLookup("TC-8492");
              }}
              className="font-mono text-[#00A69C] hover:text-teal-700 bg-stone-50 border border-stone-200 hover:border-teal-300 px-2.5 py-1 rounded-lg transition-all cursor-pointer font-bold shadow-2xs"
            >
              TC-8492
            </button>
            <button
              onClick={() => {
                setSearchCode("TC-4921");
                handleLookup("TC-4921");
              }}
              className="font-mono text-[#00A69C] hover:text-teal-700 bg-stone-50 border border-stone-200 hover:border-teal-300 px-2.5 py-1 rounded-lg transition-all cursor-pointer font-bold shadow-2xs"
            >
              TC-4921
            </button>
          </div>
        </div>
      )}

      {/* Empty State after search with no result */}
      {hasSearched && !loading && !submission && (
        <div className="bg-white border border-stone-200 rounded-2xl p-8 max-w-lg mx-auto text-center space-y-3 shadow-sm">
          <div className="text-rose-600 font-bold text-sm">No Design Found for "{searchCode}"</div>
          <p className="text-xs text-stone-500">
            Please verify the 6-character code with your customer or check if a new design was submitted recently.
          </p>
          <div className="pt-2">
            <button
              onClick={() => {
                setSearchCode("TC-8492");
                handleLookup("TC-8492");
              }}
              className="text-xs text-[#00A69C] hover:underline font-semibold"
            >
              Load Sample Design (TC-8492)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SharedDesignViewer;
