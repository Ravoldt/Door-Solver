import React, { useState } from "react";
import { DESIGNER_OPTIONS } from "../lib/dataModels";
import { dataService } from "../lib/supabase";
import { generatePublicSpecPdf } from "../lib/pdfGenerator";
import { parseFraction, toFraction } from "../utils";
import DoorCadPreview from "./DoorCadPreview";
import DimensionInput from "./DimensionInput";
import { Download, Share2, Compass } from "lucide-react";
import toast from "react-hot-toast";

const parseDimension = (value, fallback = 0) => {
  if (value == null || value === "") return fallback;
  const parsedValue = parseFraction(value);
  return Number.isNaN(parsedValue) ? fallback : parsedValue;
};

export const PublicDesigner = ({ onOpenShareModal, preloadedSubmission = null }) => {
  // Job Name defaults to empty string so placeholder "Custom Door Project" can be overwritten immediately
  const [jobName, setJobName] = useState(preloadedSubmission?.jobName || "");

  // 1. Door Handing
  const [doorHanding, setDoorHanding] = useState(preloadedSubmission?.doorHanding || "Unknown Handing");

  // 2. Door Style (1 Panel, 2 Panel, 3 Panel)
  const [doorStyle, setDoorStyle] = useState(
    ["1 Panel", "2 Panel", "3 Panel"].includes(preloadedSubmission?.doorType)
      ? preloadedSubmission.doorType
      : "2 Panel"
  );

  // 3. Door Top (Square, Roman, Segmented Arch, Full Arch)
  const [doorTop, setDoorTop] = useState(preloadedSubmission?.doorTop || "Square");

  // 4. Panel Substitution (None, Top Panel, All Panels)
  const [panelSubstitution, setPanelSubstitution] = useState(preloadedSubmission?.panelSubstitution || "None");

  // 5. Material (Species without MDF + Custom)
  const initialMaterial = preloadedSubmission?.material || preloadedSubmission?.species || "Poplar";
  const isInitialCustom = !DESIGNER_OPTIONS.MATERIALS.filter((m) => m !== "Custom").includes(initialMaterial);
  const [materialChoice, setMaterialChoice] = useState(isInitialCustom ? "Custom" : initialMaterial);
  const [customMaterialText, setCustomMaterialText] = useState(isInitialCustom ? initialMaterial : "");

  const activeMaterial = materialChoice === "Custom" ? (customMaterialText.trim() || "Custom Material") : materialChoice;

  // 6. Width
  const [width, setWidth] = useState(preloadedSubmission?.doors?.[0]?.width || 30);

  // 7. Height
  const [height, setHeight] = useState(preloadedSubmission?.doors?.[0]?.height || 80);

  // 8. Thickness (Text field allowing fractions & decimals)
  const [thickness, setThickness] = useState(preloadedSubmission?.doors?.[0]?.thickness || "1 3/4");

  // 9. Profile (Shaker, Ovolo)
  const [profile, setProfile] = useState(
    preloadedSubmission?.profile === "Ovolo" ? "Ovolo" : "Shaker"
  );

  // 10. Panel (Flat, Raised)
  const [panel, setPanel] = useState(
    preloadedSubmission?.panel === "Raised" ? "Raised" : "Flat"
  );

  // 11. Construction & Proportions
  const [proportions, setProportions] = useState(
    preloadedSubmission?.doors?.[0]?.visualProportions || {
      stileWidth: 4.5,
      topRailWidth: 4.5,
      lockRailWidth: 5.5,
      intermediateRailWidth: 5,
      bottomRailWidth: 8.75,
      heightToLockRail: 36,
    }
  );

  const [isSaving, setIsSaving] = useState(false);

  const numWidth = parseDimension(width, 30);
  const numHeight = parseDimension(height, 80);
  const effectiveJobName = jobName.trim() || "Custom Door Project";

  // Save & Share Design
  const handleShareDesign = async () => {
    setIsSaving(true);
    try {
      const publicSpec = {
        jobName: effectiveJobName,
        doorHanding,
        doorType: doorStyle,
        doorTop,
        panelSubstitution,
        material: activeMaterial,
        species: activeMaterial,
        profile,
        panel,
        finish: "Raw",
        doors: [
          {
            id: "door-1",
            qty: 1,
            width: numWidth,
            height: numHeight,
            thickness: String(thickness),
            visualProportions: { ...proportions },
          },
        ],
      };

      const savedSubmission = await dataService.saveDesignSubmission(publicSpec);
      onOpenShareModal(savedSubmission);
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate share code");
    } finally {
      setIsSaving(false);
    }
  };

  // Download Spec Sheet PDF
  const handleDownloadSpecPdf = () => {
    generatePublicSpecPdf({
      jobName: effectiveJobName,
      doorType: doorStyle,
      species: activeMaterial,
      profile,
      finish: "Raw",
      doors: [
        {
          id: "door-1",
          qty: 1,
          width: numWidth,
          height: numHeight,
          visualProportions: proportions,
        },
      ],
      shareCode: "CAD-SPEC",
      proportions,
    });
    toast.success("CAD Spec Sheet PDF downloaded!");
  };

  // Light Mode styling classes
  const labelCls = "text-xs font-semibold text-stone-700 w-32 shrink-0";
  const selectCls =
    "w-full bg-white border border-stone-300 hover:border-stone-400 text-stone-900 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-[#00A69C] focus:ring-1 focus:ring-[#00A69C] transition-all cursor-pointer shadow-2xs";
  const inputCls =
    "w-full bg-white border border-stone-300 hover:border-stone-400 text-stone-900 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-[#00A69C] focus:ring-1 focus:ring-[#00A69C] transition-all shadow-2xs";
  const sectionTitleCls =
    "text-xs font-bold uppercase tracking-wider text-[#00A69C] border-b border-stone-200 pb-1.5 mb-3";

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-stone-50 text-stone-900 overflow-hidden animate-fadeIn">
      {/* Top Header Navigation Bar (Light Mode) */}
      <div className="bg-white border-b border-stone-200 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-2xs">
        {/* Project Title with fake placeholder text */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-[#00A69C]">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <input
              type="text"
              value={jobName}
              onChange={(e) => setJobName(e.target.value)}
              placeholder="Custom Door Project"
              className="bg-transparent border-b border-transparent hover:border-stone-300 focus:border-[#00A69C] text-sm font-bold text-stone-900 placeholder:text-stone-400 px-1 py-0.5 outline-none max-w-[220px] sm:max-w-xs transition-colors"
            />
          </div>
        </div>

        {/* Global Header Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleDownloadSpecPdf}
            className="bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 font-semibold px-3.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#00A69C]" />
            <span>Download Spec PDF</span>
          </button>

          <button
            onClick={handleShareDesign}
            disabled={isSaving}
            className="bg-[#00A69C] hover:bg-[#009087] text-white font-bold px-4 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{isSaving ? "Saving..." : "Save & Share Code"}</span>
          </button>
        </div>
      </div>

      {/* Main Split-Pane Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Form Options Sidebar (Light Mode) */}
        <div className="w-full lg:w-[400px] bg-white border-r border-stone-200 flex flex-col h-full overflow-y-auto shadow-sm shrink-0">
          <div className="p-5 space-y-6">
            {/* DOOR SETTINGS */}
            <div>
              <div className={sectionTitleCls}>General Specifications</div>
              <div className="space-y-3">
                {/* 1. Door Handing */}
                <div className="flex items-center justify-between">
                  <span className={labelCls}>Door Handing</span>
                  <select
                    value={doorHanding}
                    onChange={(e) => setDoorHanding(e.target.value)}
                    className={selectCls}
                  >
                    {DESIGNER_OPTIONS.DOOR_HANDINGS.map((dh) => (
                      <option key={dh} value={dh}>
                        {dh}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Door Style */}
                <div className="flex items-center justify-between">
                  <span className={labelCls}>Door Style</span>
                  <select
                    value={doorStyle}
                    onChange={(e) => setDoorStyle(e.target.value)}
                    className={selectCls}
                  >
                    {DESIGNER_OPTIONS.DOOR_STYLES.map((ds) => (
                      <option key={ds} value={ds}>
                        {ds}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Door Top */}
                <div className="flex items-center justify-between">
                  <span className={labelCls}>Door Top</span>
                  <select
                    value={doorTop}
                    onChange={(e) => setDoorTop(e.target.value)}
                    className={selectCls}
                  >
                    {DESIGNER_OPTIONS.DOOR_TOPS.map((dt) => (
                      <option key={dt} value={dt}>
                        {dt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 4. Panel Substitution */}
                <div className="flex items-center justify-between">
                  <span className={labelCls}>Panel Substitution</span>
                  <select
                    value={panelSubstitution}
                    onChange={(e) => setPanelSubstitution(e.target.value)}
                    className={selectCls}
                  >
                    {DESIGNER_OPTIONS.PANEL_SUBSTITUTIONS.map((ps) => (
                      <option key={ps} value={ps}>
                        {ps}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 5. Material */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className={labelCls}>Material</span>
                    <select
                      value={materialChoice}
                      onChange={(e) => setMaterialChoice(e.target.value)}
                      className={selectCls}
                    >
                      {DESIGNER_OPTIONS.MATERIALS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                  {materialChoice === "Custom" && (
                    <div className="flex items-center justify-end">
                      <input
                        type="text"
                        value={customMaterialText}
                        onChange={(e) => setCustomMaterialText(e.target.value)}
                        placeholder="Enter custom species/material..."
                        className={inputCls}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* DIMENSIONS */}
            <div>
              <div className={sectionTitleCls}>Dimensions</div>
              <div className="space-y-3 text-xs">
                {/* 6. Width */}
                <div className="flex items-center justify-between">
                  <span className={labelCls}>Width (in)</span>
                  <div className="w-full">
                    <DimensionInput
                      value={width}
                      onChange={(val) => setWidth(val)}
                      className={inputCls}
                    />
                  </div>
                </div>

                {/* 7. Height */}
                <div className="flex items-center justify-between">
                  <span className={labelCls}>Height (in)</span>
                  <div className="w-full">
                    <DimensionInput
                      value={height}
                      onChange={(val) => setHeight(val)}
                      className={inputCls}
                    />
                  </div>
                </div>

                {/* 8. Thickness (Text field allowing fractions & decimals) */}
                <div className="flex items-center justify-between">
                  <span className={labelCls}>Thickness (in)</span>
                  <div className="w-full">
                    <DimensionInput
                      value={thickness}
                      onChange={(val) => setThickness(val)}
                      placeholder="e.g. 1 3/4 or 1.75"
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* PROFILES & PANEL */}
            <div>
              <div className={sectionTitleCls}>Profiles</div>
              <div className="space-y-3">
                {/* 9. Profile (Shaker, Ovolo) */}
                <div className="flex items-center justify-between">
                  <span className={labelCls}>Profile</span>
                  <select
                    value={profile}
                    onChange={(e) => setProfile(e.target.value)}
                    className={selectCls}
                  >
                    {DESIGNER_OPTIONS.PROFILES.map((pr) => (
                      <option key={pr} value={pr}>
                        {pr}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 10. Panel (Flat, Raised) */}
                <div className="flex items-center justify-between">
                  <span className={labelCls}>Panel</span>
                  <select
                    value={panel}
                    onChange={(e) => setPanel(e.target.value)}
                    className={selectCls}
                  >
                    {DESIGNER_OPTIONS.PANELS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 11. CONSTRUCTION & PROPORTIONS (Filtered by current style) */}
            <div>
              <div className={sectionTitleCls}>Construction & Proportions</div>
              <div className="space-y-3 text-xs">
                {/* Stile Width (Required for 1, 2, 3 Panel) */}
                <div className="flex items-center justify-between">
                  <span className={labelCls}>Stile Width (in)</span>
                  <DimensionInput
                    value={proportions.stileWidth}
                    onChange={(val) =>
                      setProportions((p) => ({ ...p, stileWidth: parseDimension(val, 4.5) }))
                    }
                    className={inputCls}
                  />
                </div>

                {/* Top Rail Width (Required for 1, 2, 3 Panel) */}
                <div className="flex items-center justify-between">
                  <span className={labelCls}>Top Rail (in)</span>
                  <DimensionInput
                    value={proportions.topRailWidth}
                    onChange={(val) =>
                      setProportions((p) => ({ ...p, topRailWidth: parseDimension(val, 4.5) }))
                    }
                    className={inputCls}
                  />
                </div>

                {/* Lock Rail Width (Required ONLY for 2 Panel) */}
                {doorStyle === "2 Panel" && (
                  <div className="flex items-center justify-between">
                    <span className={labelCls}>Lock Rail (in)</span>
                    <DimensionInput
                      value={proportions.lockRailWidth}
                      onChange={(val) =>
                        setProportions((p) => ({ ...p, lockRailWidth: parseDimension(val, 5.5) }))
                      }
                      className={inputCls}
                    />
                  </div>
                )}

                {/* Intermediate Rail Width (Required ONLY for 3 Panel) */}
                {doorStyle === "3 Panel" && (
                  <div className="flex items-center justify-between">
                    <span className={labelCls}>Intermediate Rail (in)</span>
                    <DimensionInput
                      value={proportions.intermediateRailWidth}
                      onChange={(val) =>
                        setProportions((p) => ({
                          ...p,
                          intermediateRailWidth: parseDimension(val, 5),
                        }))
                      }
                      className={inputCls}
                    />
                  </div>
                )}

                {/* Bottom Rail Width (Required for 1, 2, 3 Panel) */}
                <div className="flex items-center justify-between">
                  <span className={labelCls}>Bottom Rail (in)</span>
                  <DimensionInput
                    value={proportions.bottomRailWidth}
                    onChange={(val) =>
                      setProportions((p) => ({ ...p, bottomRailWidth: parseDimension(val, 8.75) }))
                    }
                    className={inputCls}
                  />
                </div>

                {/* Lock Centerline (Required ONLY for 2 Panel) */}
                {doorStyle === "2 Panel" && (
                  <div className="flex items-center justify-between">
                    <span className={labelCls}>Lock Centerline (in)</span>
                    <DimensionInput
                      value={proportions.heightToLockRail}
                      onChange={(val) =>
                        setProportions((p) => ({
                          ...p,
                          heightToLockRail: parseDimension(val, 36),
                        }))
                      }
                      className={inputCls}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Large CAD Blueprint Canvas (Light Mode) */}
        <div className="flex-1 h-full p-4 sm:p-6 bg-slate-100/70 flex flex-col items-center justify-center overflow-hidden">
          <DoorCadPreview
            width={numWidth}
            height={numHeight}
            thickness={thickness}
            doorType={doorStyle}
            doorTop={doorTop}
            panelSubstitution={panelSubstitution}
            material={activeMaterial}
            profile={profile}
            panel={panel}
            handing={doorHanding}
            proportions={proportions}
          />
        </div>
      </div>
    </div>
  );
};

export default PublicDesigner;
