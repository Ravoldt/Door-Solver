import React, { useState, useEffect, useRef, useMemo } from "react";
import { X, RotateCcw, HelpCircle, ChevronDown, Check } from "lucide-react";
import { DEFAULT_SETTINGS, STYLE_REQUIRED_SETTINGS, DOOR_STYLES, getDoorGeometry } from "../doorconfig";
import { toFraction, parseFraction, formatInputDimension } from "../utils";
import DimensionInput from "./DimensionInput";
import { toast } from "react-hot-toast";
import { validateDoor } from "../validation";

// Detailed help descriptions for build settings
const SETTING_DESCRIPTIONS = {
  stileWidth: "Width of the vertical side frame pieces (stiles).",
  stileThickness: "Thickness of the door frame parts.",
  topRailWidth: "Width of the top horizontal rail part.",
  lockRailWidth: "Width of the center lock rail on 2-panel doors.",
  intermediateRailWidth: "Width of the intermediate rails on 3-panel doors.",
  bottomRailWidth: "Width of the bottom horizontal rail part.",
  heightToLockRail: "Height from the bottom of the door to the center of the lock rail.",
  grooveDepth: "Depth the panels insert into the stile and rail groove slots.",
  tongueLength: "Length of rail end tongues that slot into the stiles.",
  verticalPanelClearance: "Total vertical gap allowed for panel expansion/clearance.",
  horizontalPanelClearance: "Total horizontal gap allowed for panel expansion/clearance.",
};



const SETTING_GROUPS = [
  {
    title: "Stiles",
    fields: [
      { name: "stileWidth", label: "Stile Width" },
      { name: "stileThickness", label: "Stile Thickness" },
    ],
  },
  {
    title: "Rails",
    fields: [
      { name: "topRailWidth", label: "Top Rail Width" },
      { name: "lockRailWidth", label: "Lock Rail Width" },
      { name: "intermediateRailWidth", label: "Intermediate Rail Width" },
      { name: "bottomRailWidth", label: "Bottom Rail Width" },
      { name: "heightToLockRail", label: "Height to Lock Rail" },
    ],
  },
  {
    title: "Joinery",
    fields: [
      { name: "grooveDepth", label: "Groove Depth" },
      { name: "tongueLength", label: "Tongue Length" },
      { name: "verticalPanelClearance", label: "Vertical Panel Clearance" },
      { name: "horizontalPanelClearance", label: "Horizontal Panel Clearance" },
    ],
  },
];

// SVG Dimension Line component in CAD style
const DimensionLine = ({ x1, y1, x2, y2, offsetX, offsetY, value, labelText, fieldName, focusedField, onClick }) => {
  const isHorizontal = y1 === y2;
  const dimX1 = isHorizontal ? x1 : x1 + offsetX;
  const dimY1 = isHorizontal ? y1 + offsetY : y1;
  const dimX2 = isHorizontal ? x2 : x2 + offsetX;
  const dimY2 = isHorizontal ? y2 + offsetY : y2;

  const midX = (dimX1 + dimX2) / 2;
  const midY = (dimY1 + dimY2) / 2;

  const gap = 1.2;
  const ext = 2.2;
  const overshootDim = 0.8; // dimension line overshoot past extension line

  let extX1_start, extY1_start, extX1_end, extY1_end;
  let extX2_start, extY2_start, extX2_end, extY2_end;

  if (isHorizontal) {
    const sign = offsetY < 0 ? -1 : 1;
    extX1_start = x1;
    extY1_start = y1 + sign * gap;
    extX1_end = x1;
    extY1_end = dimY1 + sign * ext;

    extX2_start = x2;
    extY2_start = y2 + sign * gap;
    extX2_end = x2;
    extY2_end = dimY2 + sign * ext;
  } else {
    const sign = offsetX < 0 ? -1 : 1;
    extX1_start = x1 + sign * gap;
    extY1_start = y1;
    extX1_end = dimX1 + sign * ext;
    extY1_end = y1;

    extX2_start = x2 + sign * gap;
    extY2_start = y2;
    extX2_end = dimX2 + sign * ext;
    extY2_end = y2;
  }

  const isHighlighted = focusedField === fieldName;
  const isInteractive = !["panelWidthRef", "panelHeightRef", "upperPanelHeightRef", "middlePanelHeightRef", "lowerPanelHeightRef"].includes(fieldName);

  // Math for Ticks (45-degree architectural slashes)
  // Always drawn bottom-left to top-right on the sheet
  const tickSize = 0.6;
  const tickX1_1 = dimX1 - tickSize;
  const tickY1_1 = dimY1 + tickSize;
  const tickX1_2 = dimX1 + tickSize;
  const tickY1_2 = dimY1 - tickSize;

  const tickX2_1 = dimX2 - tickSize;
  const tickY2_1 = dimY2 + tickSize;
  const tickX2_2 = dimX2 + tickSize;
  const tickY2_2 = dimY2 - tickSize;

  // Hover hit-box dimensions for text
  const lines = labelText.split('\n');
  const maxLineLen = Math.max(...lines.map(l => l.length));
  const valLen = value.length;
  const hoverWidth = Math.max(8, Math.max(maxLineLen * 1.1, valLen * 1.5) + 3);

  // Small visual box wrapping only the value, centered on the line
  const boxWidth = Math.max(8, valLen * 1.6 + 2.5);
  const boxHeight = 4.5;
  const boxX = midX - boxWidth / 2;
  const boxY = midY - boxHeight / 2;

  return (
    <g className="transition-all duration-200">
      {/* 1. Extension dashed lines */}
      <line
        x1={extX1_start}
        y1={extY1_start}
        x2={extX1_end}
        y2={extY1_end}
        stroke={isHighlighted ? "#00A69C" : "#a8a29e"}
        strokeWidth={isHighlighted ? 0.25 : 0.12}
        strokeDasharray="0.8,0.8"
      />
      <line
        x1={extX2_start}
        y1={extY2_start}
        x2={extX2_end}
        y2={extY2_end}
        stroke={isHighlighted ? "#00A69C" : "#a8a29e"}
        strokeWidth={isHighlighted ? 0.25 : 0.12}
        strokeDasharray="0.8,0.8"
      />

      {/* 2. Main Dimension Line (overshooting the extension lines slightly) */}
      <line
        x1={isHorizontal ? dimX1 - overshootDim : dimX1}
        y1={isHorizontal ? dimY1 : dimY1 - overshootDim}
        x2={isHorizontal ? dimX2 + overshootDim : dimX2}
        y2={isHorizontal ? dimY2 : dimY2 + overshootDim}
        stroke={isHighlighted ? "#00A69C" : "#78716c"}
        strokeWidth={isHighlighted ? 0.35 : 0.2}
      />

      {/* 3. Architectural Ticks (45-degree slashes at intersections) */}
      <line
        x1={tickX1_1}
        y1={tickY1_1}
        x2={tickX1_2}
        y2={tickY1_2}
        stroke={isHighlighted ? "#00A69C" : "#44403c"}
        strokeWidth={isHighlighted ? 0.5 : 0.3}
      />
      <line
        x1={tickX2_1}
        y1={tickY2_1}
        x2={tickX2_2}
        y2={tickY2_2}
        stroke={isHighlighted ? "#00A69C" : "#44403c"}
        strokeWidth={isHighlighted ? 0.5 : 0.3}
      />

      {/* 4. Dimension Text (rests centered on the line, aligned) */}
      <g
        className={isInteractive ? "cursor-pointer group" : "cursor-default"}
        onClick={(e) => {
          if (isInteractive) {
            e.stopPropagation();
            onClick(fieldName, midX, midY);
          }
        }}
      >
        {/* Invisible larger hover/click target */}
        <rect
          x={midX - Math.max(12, hoverWidth) / 2}
          y={midY - 6}
          width={Math.max(12, hoverWidth)}
          height={12}
          fill="transparent"
          className="pointer-events-auto"
        />

        {/* Background pill to break the line behind the text */}
        <rect
          x={boxX}
          y={boxY}
          width={boxWidth}
          height={boxHeight}
          rx={0.5}
          fill="#fafaf9"
          className="group-hover:fill-teal-500/10 group-hover:stroke-teal-500/30 transition-all duration-150"
          stroke={isHighlighted ? "#00A69C" : (isInteractive ? "#1c1917" : "#a8a29e")}
          strokeWidth={isHighlighted ? 0.3 : 0.15}
        />

        {/* Value */}
        <text
          x={midX}
          y={midY + 0.8}
          textAnchor="middle"
          fill={isHighlighted ? "#00A69C" : "#1c1917"}
          fontSize={2.2}
          fontWeight="bold"
          fontFamily="monospace"
          className="pointer-events-none transition-colors duration-150 group-hover:fill-[#00A69C]"
        >
          {value}
        </text>

        {/* Label (appearing on hover above the box) */}
        <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none">
          {lines.map((line, i) => (
            <text
              key={i}
              x={midX}
              y={midY - boxHeight / 2 - 1.2 - (lines.length - 1 - i) * 1.4}
              textAnchor="middle"
              fill="#00A69C"
              fontSize={1.2}
              fontWeight="bold"
              className="uppercase tracking-widest transition-colors duration-150"
            >
              {line}
            </text>
          ))}
        </g>
      </g>
    </g>
  );
};

const SettingsWorkspace = ({
  isOpen,
  onClose,
  settings,
  updateSetting,
  setSettings,
  doorType,
  doors,
  updateDoor,
  profile,
}) => {
  const [focusedField, setFocusedField] = useState(null);
  const [inlineEdit, setInlineEdit] = useState(null); // { fieldName, x, y, value }
  const showGrooves = true;

  // Reference door size selection state
  const [refDoorId, setRefDoorId] = useState("default");
  const inlineInputRef = useRef(null);

  // Sync refDoorId with doors list
  useEffect(() => {
    if (doors.length === 0) {
      if (refDoorId !== "default") {
        setRefDoorId("default");
      }
    } else {
      const exists = doors.some((d) => String(d.id) === String(refDoorId));
      if (!exists || refDoorId === "default") {
        setRefDoorId(String(doors[0].id));
      }
    }
  }, [doors, refDoorId]);

  // Safeguard: sanitize settings state by merging with defaults and ensuring numeric types
  const activeSettings = useMemo(() => {
    const merged = { ...DEFAULT_SETTINGS, ...settings };
    Object.keys(merged).forEach((key) => {
      const val = Number(merged[key]);
      if (Number.isFinite(val)) {
        merged[key] = val;
      } else {
        merged[key] = DEFAULT_SETTINGS[key] ?? 0;
      }
    });

    if (profile === "Ovolo") {
      merged.grooveDepth = 1.5;
      merged.tongueLength = 1.5;
    }

    return merged;
  }, [settings, profile]);



  const [localDefaultWidth, setLocalDefaultWidth] = useState(36);
  const [localDefaultHeight, setLocalDefaultHeight] = useState(96);

  // Determine current width and height for reference preview
  const { previewWidth, previewHeight } = useMemo(() => {
    if (refDoorId === "default" || !doors.length) {
      return { previewWidth: localDefaultWidth, previewHeight: localDefaultHeight };
    }
    const selectedDoor = doors.find((d) => String(d.id) === String(refDoorId));
    if (selectedDoor) {
      return {
        previewWidth: Number(selectedDoor.width) || localDefaultWidth,
        previewHeight: Number(selectedDoor.height) || localDefaultHeight,
      };
    }
    return { previewWidth: localDefaultWidth, previewHeight: localDefaultHeight };
  }, [refDoorId, doors, localDefaultWidth, localDefaultHeight]);

  // Get drawing geometry
  const geometry = useMemo(() => {
    return getDoorGeometry(previewWidth, previewHeight, activeSettings, doorType);
  }, [previewWidth, previewHeight, activeSettings, doorType]);

  const previewWarnings = useMemo(() => {
    const previewDoor = { width: previewWidth, height: previewHeight };
    const { warnings } = validateDoor(previewDoor, activeSettings, doorType);
    return warnings;
  }, [previewWidth, previewHeight, activeSettings, doorType]);

  // Focus effect for drawer inputs
  useEffect(() => {
    if (focusedField) {
      const container = document.getElementById(`settings-field-${focusedField}`);
      const input = document.getElementById(`settings-input-${focusedField}`);
      if (container) {
        container.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
      if (input) {
        input.focus();
        if (typeof input.select === "function") {
          input.select();
        }
      }
    }
  }, [focusedField]);

  // Focus effect for inline input
  useEffect(() => {
    if (inlineEdit && inlineInputRef.current) {
      inlineInputRef.current.focus();
      inlineInputRef.current.select();
    }
  }, [inlineEdit?.fieldName]);

  if (!isOpen) return null;

  const handleResetSettings = () => {
    if (window.confirm("Are you sure you want to reset construction settings to factory defaults?")) {
      setSettings(DEFAULT_SETTINGS);
      setFocusedField(null);
      setInlineEdit(null);
    }
  };

  const handlePillClick = (fieldName, x, y) => {
    setFocusedField(fieldName);
    let initialValue = "";
    if (fieldName === "doorWidthRef") {
      initialValue = formatInputDimension(previewWidth);
    } else if (fieldName === "doorHeightRef") {
      initialValue = formatInputDimension(previewHeight);
    } else {
      initialValue = formatInputDimension(activeSettings[fieldName]);
    }
    setInlineEdit({
      fieldName,
      x,
      y,
      inputValue: initialValue,
    });
  };

  const handleInlineSubmit = () => {
    if (!inlineEdit) return;
    const parsed = parseFraction(inlineEdit.inputValue);
    if (!Number.isNaN(parsed)) {
      if (inlineEdit.fieldName === "doorWidthRef") {
        if (refDoorId === "default") {
          const proposedDoor = { width: parsed, height: previewHeight };
          const { errors } = validateDoor(proposedDoor, activeSettings, doorType);
          if (errors.length > 0) {
            toast.error(errors[0].message);
            return;
          }
          setLocalDefaultWidth(parsed);
        } else {
          const parsedId = Number(refDoorId);
          if (!Number.isNaN(parsedId)) {
            const success = updateDoor(parsedId, "width", parsed);
            if (success === false) {
              return;
            }
          }
        }
      } else if (inlineEdit.fieldName === "doorHeightRef") {
        if (refDoorId === "default") {
          const proposedDoor = { width: previewWidth, height: parsed };
          const { errors } = validateDoor(proposedDoor, activeSettings, doorType);
          if (errors.length > 0) {
            toast.error(errors[0].message);
            return;
          }
          setLocalDefaultHeight(parsed);
        } else {
          const parsedId = Number(refDoorId);
          if (!Number.isNaN(parsedId)) {
            const success = updateDoor(parsedId, "height", parsed);
            if (success === false) {
              return;
            }
          }
        }
      } else {
        const success = updateSetting(inlineEdit.fieldName, parsed, { width: previewWidth, height: previewHeight });
        if (success === false) {
          return;
        }
      }
    }
    setInlineEdit(null);
  };

  const handleInlineKeyDown = (e) => {
    if (e.key === "Enter") {
      handleInlineSubmit();
    } else if (e.key === "Escape") {
      setInlineEdit(null);
    }
  };

  // Helper functions for dynamic dimension spacing
  const getBoxWidth = (labelRaw, valueRaw) => {
    const lines = labelRaw.split('\n');
    const maxLineLen = Math.max(...lines.map(l => l.length));
    const valLen = String(valueRaw).length;
    return Math.max(8, Math.max(maxLineLen * 1.1, valLen * 1.5) + 3);
  };
  const getBoxHeight = (labelRaw) => {
    const lines = labelRaw.split('\n');
    return (lines.length - 1) * 1.4 + 5.5;
  };

  // Helper variables for rail calculations
  const leftStile = geometry.stiles.find((s) => s.id === "left-stile");
  const topRail = geometry.rails.find((r) => r.id === "top-rail");
  const bottomRail = geometry.rails.find((r) => r.id === "bottom-rail");
  const middleRail1 = geometry.rails.find((r) => r.id === "middle-rail-1");

  // Calculations for 3 Panel spacing representation
  const availSpace = previewHeight - activeSettings.topRailWidth - activeSettings.bottomRailWidth - 2 * (activeSettings.intermediateRailWidth || 0);
  const panelHeight3P = Math.max(0, availSpace / 3);

  // --- Dynamic Layout ---
  const gap = 2.5;

  // Horizontal (Top Side)
  const innerHorizH = Math.max(
    getBoxHeight("Stile\nWidth"),
    getBoxHeight("Panel\nWidth")
  );
  const innerHorizOffsetY = - innerHorizH / 2 - 3; // Initial gap from door

  const outerHorizH = getBoxHeight("Door\nWidth");
  const outerHorizOffsetY = innerHorizOffsetY - (innerHorizH / 2) - gap - (outerHorizH / 2);

  // Vertical (Left Side)
  let innerVertW = 0;
  if (topRail) innerVertW = Math.max(innerVertW, getBoxWidth("Top\nRail", formatInputDimension(activeSettings.topRailWidth)));
  if (bottomRail) innerVertW = Math.max(innerVertW, getBoxWidth("Bottom\nRail", formatInputDimension(activeSettings.bottomRailWidth)));
  if (doorType === "2 Panel") {
    innerVertW = Math.max(innerVertW, getBoxWidth("Lock\nRail", formatInputDimension(activeSettings.lockRailWidth)));
    innerVertW = Math.max(innerVertW, getBoxWidth("Panel\nHeight", formatInputDimension(Math.max(0, previewHeight - activeSettings.heightToLockRail - activeSettings.lockRailWidth / 2 - activeSettings.topRailWidth))));
  }
  if (doorType === "3 Panel") {
    innerVertW = Math.max(innerVertW, getBoxWidth("Intermediate\nRail", formatInputDimension(activeSettings.intermediateRailWidth)));
    innerVertW = Math.max(innerVertW, getBoxWidth("Panel\nHeight", formatInputDimension(panelHeight3P)));
  }
  if (doorType === "1 Panel") {
    innerVertW = Math.max(innerVertW, getBoxWidth("Panel\nHeight", formatInputDimension(Math.max(0, previewHeight - activeSettings.topRailWidth - activeSettings.bottomRailWidth))));
  }

  const innerVertOffsetX = - innerVertW / 2 - 3;

  let midVertW = 0;
  let midVertOffsetX = innerVertOffsetX;
  if (doorType === "2 Panel") {
    midVertW = getBoxWidth("Lock\nHeight", formatInputDimension(activeSettings.heightToLockRail));
    midVertOffsetX = innerVertOffsetX - (innerVertW / 2) - gap - (midVertW / 2);
  } else {
    // If no mid layer, pull the midVertOffsetX to inner layer so outer is closer
    midVertW = innerVertW;
  }

  const outerVertW = getBoxWidth("Door\nHeight", formatInputDimension(previewHeight));
  const outerVertOffsetX = midVertOffsetX - (midVertW / 2) - gap - (outerVertW / 2);

  // Helper dimensions SVG calculation (offset to left & top for dimension stacks)
  const minX = outerVertOffsetX - (outerVertW / 2) - 4;
  const minY = outerHorizOffsetY - (outerHorizH / 2) - 4;
  const viewBoxWidth = previewWidth - minX + 22; // 22 right padding
  const viewBoxHeight = previewHeight - minY + 8; // 8 bottom padding



  return (
    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 md:p-6 lg:p-8 overflow-hidden select-none animate-fade-in">
      {/* Backdrop Close Click area */}
      <div className="absolute inset-0 cursor-default" onClick={onClose} />

      {/* Main Dual-Workspace Container */}
      <div className="relative w-full h-full max-w-7xl flex flex-col lg:flex-row gap-6 items-stretch justify-center pointer-events-none">

        {/* Left Workspace: Interactive SVG Drawing Modal */}
        <div className="w-full lg:flex-1 bg-white rounded-md border border-stone-900 shadow-2xl flex flex-col overflow-hidden pointer-events-auto transition-all relative">

          {/* Header */}
          <div className="p-4 border-b border-stone-200 bg-stone-50 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-stone-900 flex items-center gap-1.5 text-base">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00A69C]" />
                {doorType} Style Workspace
              </h3>
              <p className="text-[10px] font-bold text-stone-500 uppercase mt-0.5 tracking-wider">
                Live Blueprint & Joinery Preview
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Reference Door Size Dropdown */}
              <div className="flex items-center gap-1.5">
                <label className="text-xs font-bold text-stone-600 uppercase">Currently Viewing:</label>
                <div className="relative">
                  <select
                    value={refDoorId}
                    onChange={(e) => {
                      setRefDoorId(e.target.value);
                      setInlineEdit(null);
                    }}
                    className="text-xs border border-stone-900 rounded-sm bg-white py-1 px-2 pr-6 outline-none focus:border-[#00A69C] cursor-pointer appearance-none font-semibold"
                  >
                    {doors.length === 0 && (
                      <option value="default">Standard 36" x 96"</option>
                    )}
                    {doors.map((d, index) => (
                      <option key={d.id} value={d.id}>
                        Door {doors.length - index} ({formatInputDimension(d.width)} × {formatInputDimension(d.height)})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 text-stone-500 pointer-events-none" size={12} />
                </div>
              </div>
            </div>
          </div>

          {previewWarnings && previewWarnings.length > 0 && (
            <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-amber-900 text-xs flex flex-col gap-1 font-semibold">
              {previewWarnings.map((w, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <span className="text-amber-600 font-bold">⚠️</span>
                  <span>{w.message}</span>
                </div>
              ))}
            </div>
          )}

          {/* SVG Canvas Container */}
          <div className="flex-1 relative flex items-center justify-center bg-stone-50/50 p-6 min-h-[400px] lg:min-h-0 overflow-hidden">

            {/* The SVG element */}
            <svg
              viewBox={`${minX} ${minY} ${viewBoxWidth} ${viewBoxHeight}`}
              className="max-h-[65vh] lg:max-h-[80vh] max-w-full drop-shadow-md select-none transition-all duration-300"
              style={{ aspectRatio: `${viewBoxWidth}/${viewBoxHeight}` }}
              onClick={() => {
                setFocusedField(null);
                setInlineEdit(null);
              }}
            >
              <defs>
                {/* Arrowhead markers for dimension lines */}
                <marker
                  id="arrow"
                  viewBox="0 0 10 10"
                  refX="5"
                  refY="5"
                  markerWidth="4"
                  markerHeight="4"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#57534e" />
                </marker>

                {/* Subtle drop shadow to simulate frame thickness over panel */}
                <filter id="frame-shadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0.6" dy="0.6" stdDeviation="0.4" floodColor="#1c1917" floodOpacity="0.22" />
                </filter>
              </defs>

              {/* 1. Draw Panels */}
              {geometry.panels.map((p) => (
                <g key={p.id}>
                  {/* Panel Rect */}
                  <rect
                    x={p.x}
                    y={p.y}
                    width={p.width}
                    height={p.height}
                    fill="#c8a96e"
                    stroke="#57534e"
                    strokeWidth={0.2}
                  />

                  {/* Panel Slot Expansion Lines inside stiles/rails (Groove Visualization) */}
                  {showGrooves && (
                    <rect
                      x={p.x - (activeSettings.grooveDepth - activeSettings.horizontalPanelClearance / 2)}
                      y={p.y - (activeSettings.grooveDepth - activeSettings.verticalPanelClearance / 2)}
                      width={p.width + 2 * (activeSettings.grooveDepth - activeSettings.horizontalPanelClearance / 2)}
                      height={p.height + 2 * (activeSettings.grooveDepth - activeSettings.verticalPanelClearance / 2)}
                      fill="none"
                      stroke="#a8a29e"
                      strokeWidth={0.18}
                      strokeDasharray="1,1"
                      className="pointer-events-none"
                    />
                  )}
                </g>
              ))}

              {/* 2. Draw frame stiles & rails grouped with shadow filter */}
              <g filter="url(#frame-shadow)">
                {/* Stiles */}
                {geometry.stiles.map((s) => (
                  <rect
                    key={s.id}
                    x={s.x}
                    y={s.y}
                    width={s.width}
                    height={s.height}
                    fill="#c8a96e"
                    stroke="#292524"
                    strokeWidth={0.15}
                    className={`transition-all duration-150 ${focusedField === "stileWidth" ? "stroke-[#00A69C] stroke-[0.6]" : ""}`}
                  />
                ))}

                {/* Rails */}
                {geometry.rails.map((r) => {
                  let activeField = "";
                  if (r.id === "top-rail") activeField = "topRailWidth";
                  if (r.id === "bottom-rail") activeField = "bottomRailWidth";
                  if (r.id.startsWith("middle-rail")) activeField = doorType === "2 Panel" ? "lockRailWidth" : "intermediateRailWidth";

                  return (
                    <rect
                      key={r.id}
                      x={r.x}
                      y={r.y}
                      width={r.width}
                      height={r.height}
                      fill="#c8a96e"
                      stroke="#292524"
                      strokeWidth={0.15}
                      className={`transition-all duration-150 ${focusedField === activeField ? "stroke-[#00A69C] stroke-[0.6]" : ""}`}
                    />
                  );
                })}
              </g>

              {/* 4. Draw Center Line helper for 2 Panel Lock Height measurement */}
              {doorType === "2 Panel" && (
                <line
                  x1={-2}
                  y1={previewHeight - activeSettings.heightToLockRail}
                  x2={previewWidth + 2}
                  y2={previewHeight - activeSettings.heightToLockRail}
                  stroke="#00A69C"
                  strokeWidth={0.15}
                  strokeDasharray="1.5,1.5"
                  className="pointer-events-none"
                />
              )}

              {/* 5. Draw Dimension Lines (Left & Top Sides only) */}

              {/* === HORIZONTAL DIMENSIONS (Top Side) === */}
              {/* Width Overall (Outermost) */}
              <DimensionLine
                x1={0}
                y1={0}
                x2={previewWidth}
                y2={0}
                offsetX={0}
                offsetY={outerHorizOffsetY}
                value={`${formatInputDimension(previewWidth)}`}
                labelText={"Door\nWidth"}
                fieldName="doorWidthRef"
                focusedField={focusedField}
                onClick={handlePillClick}
              />

              {/* Left Stile Width */}
              {leftStile && (
                <DimensionLine
                  x1={0}
                  y1={0}
                  x2={activeSettings.stileWidth}
                  y2={0}
                  offsetX={0}
                  offsetY={innerHorizOffsetY}
                  value={`${formatInputDimension(activeSettings.stileWidth)}`}
                  labelText={"Stile\nWidth"}
                  fieldName="stileWidth"
                  focusedField={focusedField}
                  onClick={handlePillClick}
                />
              )}

              {/* Panel Width (Uneditable) */}
              <DimensionLine
                x1={activeSettings.stileWidth}
                y1={0}
                x2={Math.max(activeSettings.stileWidth, previewWidth - activeSettings.stileWidth)}
                y2={0}
                offsetX={0}
                offsetY={innerHorizOffsetY}
                value={`${formatInputDimension(Math.max(0, previewWidth - 2 * activeSettings.stileWidth))}`}
                labelText={"Panel\nWidth"}
                fieldName="panelWidthRef"
                focusedField={focusedField}
                onClick={handlePillClick}
              />

              {/* Right Stile Width */}
              <DimensionLine
                x1={Math.max(activeSettings.stileWidth, previewWidth - activeSettings.stileWidth)}
                y1={0}
                x2={previewWidth}
                y2={0}
                offsetX={0}
                offsetY={innerHorizOffsetY}
                value={`${formatInputDimension(activeSettings.stileWidth)}`}
                labelText={"Stile\nWidth"}
                fieldName="stileWidth"
                focusedField={focusedField}
                onClick={handlePillClick}
              />


              {/* === VERTICAL DIMENSIONS (Left Side) === */}
              {/* Height Overall (Outermost) */}
              <DimensionLine
                x1={0}
                y1={0}
                x2={0}
                y2={previewHeight}
                offsetX={outerVertOffsetX}
                offsetY={0}
                value={`${formatInputDimension(previewHeight)}`}
                labelText={"Door\nHeight"}
                fieldName="doorHeightRef"
                focusedField={focusedField}
                onClick={handlePillClick}
              />

              {/* Height to Lock Rail (2 Panel only - Middle level) */}
              {doorType === "2 Panel" && (
                <DimensionLine
                  x1={0}
                  y1={previewHeight - activeSettings.heightToLockRail}
                  x2={0}
                  y2={previewHeight}
                  offsetX={midVertOffsetX}
                  offsetY={0}
                  value={`${formatInputDimension(activeSettings.heightToLockRail)}`}
                  labelText={"Lock\nHeight"}
                  fieldName="heightToLockRail"
                  focusedField={focusedField}
                  onClick={handlePillClick}
                />
              )}

              {/* Top Rail Width */}
              {topRail && (
                <DimensionLine
                  x1={0}
                  y1={0}
                  x2={0}
                  y2={activeSettings.topRailWidth}
                  offsetX={innerVertOffsetX}
                  offsetY={0}
                  value={`${formatInputDimension(activeSettings.topRailWidth)}`}
                  labelText={"Top\nRail"}
                  fieldName="topRailWidth"
                  focusedField={focusedField}
                  onClick={handlePillClick}
                />
              )}

              {/* 1 Panel Vertical Chain (Panel Height on Right Side) */}
              {doorType === "1 Panel" && (
                <>
                  {/* Panel Height (Uneditable) */}
                  <DimensionLine
                    x1={0}
                    y1={activeSettings.topRailWidth}
                    x2={0}
                    y2={Math.max(activeSettings.topRailWidth, previewHeight - activeSettings.bottomRailWidth)}
                    offsetX={innerVertOffsetX}
                    offsetY={0}
                    value={`${formatInputDimension(Math.max(0, previewHeight - activeSettings.topRailWidth - activeSettings.bottomRailWidth))}`}
                    labelText={"Panel\nHeight"}
                    fieldName="panelHeightRef"
                    focusedField={focusedField}
                    onClick={handlePillClick}
                  />
                </>
              )}

              {/* 2 Panel Vertical Chain */}
              {doorType === "2 Panel" && middleRail1 && (
                <>
                  {/* Upper Panel Height (Uneditable) */}
                  <DimensionLine
                    x1={0}
                    y1={activeSettings.topRailWidth}
                    x2={0}
                    y2={Math.max(activeSettings.topRailWidth, previewHeight - activeSettings.heightToLockRail - activeSettings.lockRailWidth / 2)}
                    offsetX={innerVertOffsetX}
                    offsetY={0}
                    value={`${formatInputDimension(Math.max(0, previewHeight - activeSettings.heightToLockRail - activeSettings.lockRailWidth / 2 - activeSettings.topRailWidth))}`}
                    labelText={"Panel\nHeight"}
                    fieldName="upperPanelHeightRef"
                    focusedField={focusedField}
                    onClick={handlePillClick}
                  />

                  {/* Lock Rail Width */}
                  <DimensionLine
                    x1={0}
                    y1={previewHeight - activeSettings.heightToLockRail - activeSettings.lockRailWidth / 2}
                    x2={0}
                    y2={previewHeight - activeSettings.heightToLockRail + activeSettings.lockRailWidth / 2}
                    offsetX={innerVertOffsetX}
                    offsetY={0}
                    value={`${formatInputDimension(activeSettings.lockRailWidth)}`}
                    labelText={"Lock\nRail"}
                    fieldName="lockRailWidth"
                    focusedField={focusedField}
                    onClick={handlePillClick}
                  />

                  {/* Lower Panel Height (Uneditable) */}
                  <DimensionLine
                    x1={0}
                    y1={previewHeight - activeSettings.heightToLockRail + activeSettings.lockRailWidth / 2}
                    x2={0}
                    y2={Math.max(previewHeight - activeSettings.heightToLockRail + activeSettings.lockRailWidth / 2, previewHeight - activeSettings.bottomRailWidth)}
                    offsetX={innerVertOffsetX}
                    offsetY={0}
                    value={`${formatInputDimension(Math.max(0, activeSettings.heightToLockRail - activeSettings.lockRailWidth / 2 - activeSettings.bottomRailWidth))}`}
                    labelText={"Panel\nHeight"}
                    fieldName="lowerPanelHeightRef"
                    focusedField={focusedField}
                    onClick={handlePillClick}
                  />
                </>
              )}

              {/* 3 Panel Vertical Chain */}
              {doorType === "3 Panel" && middleRail1 && (
                <>
                  {/* Upper Panel Height (Uneditable) */}
                  <DimensionLine
                    x1={0}
                    y1={activeSettings.topRailWidth}
                    x2={0}
                    y2={activeSettings.topRailWidth + panelHeight3P}
                    offsetX={innerVertOffsetX}
                    offsetY={0}
                    value={`${formatInputDimension(panelHeight3P)}`}
                    labelText={"Panel\nHeight"}
                    fieldName="upperPanelHeightRef"
                    focusedField={focusedField}
                    onClick={handlePillClick}
                  />

                  {/* Top Intermediate Rail Width */}
                  <DimensionLine
                    x1={0}
                    y1={activeSettings.topRailWidth + panelHeight3P}
                    x2={0}
                    y2={activeSettings.topRailWidth + panelHeight3P + activeSettings.intermediateRailWidth}
                    offsetX={innerVertOffsetX}
                    offsetY={0}
                    value={`${formatInputDimension(activeSettings.intermediateRailWidth)}`}
                    labelText={"Intermediate\nRail"}
                    fieldName="intermediateRailWidth"
                    focusedField={focusedField}
                    onClick={handlePillClick}
                  />

                  {/* Middle Panel Height (Uneditable) */}
                  <DimensionLine
                    x1={0}
                    y1={activeSettings.topRailWidth + panelHeight3P + activeSettings.intermediateRailWidth}
                    x2={0}
                    y2={activeSettings.topRailWidth + 2 * panelHeight3P + activeSettings.intermediateRailWidth}
                    offsetX={innerVertOffsetX}
                    offsetY={0}
                    value={`${formatInputDimension(panelHeight3P)}`}
                    labelText={"Panel\nHeight"}
                    fieldName="middlePanelHeightRef"
                    focusedField={focusedField}
                    onClick={handlePillClick}
                  />

                  {/* Bottom Intermediate Rail Width */}
                  <DimensionLine
                    x1={0}
                    y1={activeSettings.topRailWidth + 2 * panelHeight3P + activeSettings.intermediateRailWidth}
                    x2={0}
                    y2={activeSettings.topRailWidth + 2 * panelHeight3P + 2 * activeSettings.intermediateRailWidth}
                    offsetX={innerVertOffsetX}
                    offsetY={0}
                    value={`${formatInputDimension(activeSettings.intermediateRailWidth)}`}
                    labelText={"Intermediate\nRail"}
                    fieldName="intermediateRailWidth"
                    focusedField={focusedField}
                    onClick={handlePillClick}
                  />

                  {/* Lower Panel Height (Uneditable) */}
                  <DimensionLine
                    x1={0}
                    y1={activeSettings.topRailWidth + 2 * panelHeight3P + 2 * activeSettings.intermediateRailWidth}
                    x2={0}
                    y2={previewHeight - activeSettings.bottomRailWidth}
                    offsetX={innerVertOffsetX}
                    offsetY={0}
                    value={`${formatInputDimension(panelHeight3P)}`}
                    labelText={"Panel\nHeight"}
                    fieldName="lowerPanelHeightRef"
                    focusedField={focusedField}
                    onClick={handlePillClick}
                  />
                </>
              )}

              {/* Bottom Rail Width */}
              {bottomRail && (
                <DimensionLine
                  x1={0}
                  y1={previewHeight - activeSettings.bottomRailWidth}
                  x2={0}
                  y2={previewHeight}
                  offsetX={innerVertOffsetX}
                  offsetY={0}
                  value={`${formatInputDimension(activeSettings.bottomRailWidth)}`}
                  labelText={"Bottom\nRail"}
                  fieldName="bottomRailWidth"
                  focusedField={focusedField}
                  onClick={handlePillClick}
                />
              )}
            </svg>

            {/* Direct Inline Editing overlay input on the SVG */}
            {inlineEdit && !["panelWidthRef", "panelHeightRef", "upperPanelHeightRef", "middlePanelHeightRef", "lowerPanelHeightRef"].includes(inlineEdit.fieldName) && (
              <div
                className="absolute bg-white p-2.5 rounded shadow-lg border-2 border-[#00A69C] z-30 pointer-events-auto flex items-center gap-1"
                style={{
                  left: `${((inlineEdit.x - minX) / viewBoxWidth) * 100}%`,
                  top: `${((inlineEdit.y - minY) / viewBoxHeight) * 100}%`,
                  transform: "translate(-50%, -50%)",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-black text-stone-500 uppercase tracking-wide">
                    Edit {focusedField ? focusedField.replace(/([A-Z])/g, " $1") : ""}
                  </span>
                  <div className="flex items-center gap-1">
                    <input
                      ref={inlineInputRef}
                      type="text"
                      className="border border-stone-900 rounded-sm w-20 px-1 py-0.5 text-sm font-bold text-center outline-none focus:ring-1 focus:ring-[#00A69C]"
                      value={inlineEdit.inputValue}
                      onChange={(e) =>
                        setInlineEdit({ ...inlineEdit, inputValue: e.target.value })
                      }
                      onKeyDown={handleInlineKeyDown}
                    />
                    <button
                      type="button"
                      onClick={handleInlineSubmit}
                      className="p-1 bg-[#00A69C] text-white rounded-sm hover:bg-teal-700 transition-colors"
                      title="Save"
                    >
                      <Check size={14} className="stroke-[3]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setInlineEdit(null)}
                      className="p-1 bg-stone-100 border border-stone-300 text-stone-600 rounded-sm hover:bg-stone-200 transition-colors"
                      title="Cancel"
                    >
                      <X size={14} className="stroke-[3]" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer hints */}
          <div className="p-3 bg-stone-50 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500 font-semibold uppercase">
            <span>💡 Click values on drawing to edit directly</span>
          </div>
        </div>

        {/* Right Workspace: Settings Sheet Drawer */}
        <div className="w-full lg:w-96 bg-white rounded-md border border-stone-900 shadow-2xl flex flex-col overflow-hidden pointer-events-auto">

          {/* Header */}
          <div className="p-4 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-stone-900 text-lg flex items-center gap-2">
                Configure defaults
              </h3>
              <p className="text-[11px] font-semibold text-stone-500 uppercase mt-0.5">
                Apply globally to all door cuts
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-stone-400 hover:text-stone-700 p-1.5 rounded-sm hover:bg-stone-100 transition-colors cursor-pointer"
              title="Close Settings Workspace"
            >
              <X size={20} className="stroke-[2.5]" />
            </button>
          </div>

          {/* Form Scroll list */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {SETTING_GROUPS.map((group) => {
              // Filter fields needed for the selected style
              const availableFields = group.fields.filter((field) =>
                STYLE_REQUIRED_SETTINGS[doorType]?.includes(field.name) &&
                !(profile === "Ovolo" && (field.name === "grooveDepth" || field.name === "tongueLength"))
              );

              if (availableFields.length === 0) return null;

              return (
                <section key={group.title} className="space-y-4">
                  <h4 className="border-b border-stone-900 pb-1 text-xs font-bold uppercase text-stone-900 tracking-wider">
                    {group.title} Settings
                  </h4>
                  <div className="space-y-4">
                    {availableFields.map((field) => {
                      const isFieldFocused = focusedField === field.name;

                      return (
                        <div
                          key={field.name}
                          id={`settings-field-${field.name}`}
                          className={`p-3 rounded-sm border transition-all duration-200 ${isFieldFocused
                            ? "bg-teal-50/35 border-[#00A69C] shadow-sm ring-1 ring-teal-500/30"
                            : "bg-white border-stone-200 hover:border-stone-400"
                            }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="text-xs font-black text-stone-900 uppercase tracking-wide">
                              {field.label}
                            </label>

                            {/* Technical term tooltip marker */}
                            {SETTING_DESCRIPTIONS[field.name] && (
                              <div className="group/tooltip relative">
                                <HelpCircle size={13} className="text-stone-400 cursor-help hover:text-[#00A69C] transition-colors" />
                                <div className="absolute right-0 bottom-full mb-1 w-48 p-2 bg-stone-900 text-white text-[10px] rounded shadow-lg opacity-0 invisible pointer-events-none group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-150 z-40 font-normal normal-case leading-relaxed">
                                  {SETTING_DESCRIPTIONS[field.name]}
                                </div>
                              </div>
                            )}
                          </div>

                          <DimensionInput
                            id={`settings-input-${field.name}`}
                            className="w-full p-2 border border-stone-900 rounded-sm focus:border-[#00A69C] outline-none font-bold text-stone-900 bg-stone-50"
                            value={activeSettings[field.name]}
                            onChange={(value) => updateSetting(field.name, value, { width: previewWidth, height: previewHeight })}
                            onFocus={() => {
                              setFocusedField(field.name);
                              setInlineEdit(null);
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>

          {/* Drawer Footer Actions */}
          <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between gap-4">
            <button
              onClick={handleResetSettings}
              className="px-3 py-2 bg-stone-200 hover:bg-stone-300 text-stone-900 border border-stone-350 rounded-sm flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer"
              title="Reset configuration to defaults"
            >
              <RotateCcw size={14} /> Reset Defaults
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 bg-[#00A69C] hover:bg-teal-700 text-white rounded-sm font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-sm hover:shadow"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsWorkspace;
