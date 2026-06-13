import React, { useState, useEffect, useRef, useMemo } from "react";
import { X, RotateCcw, HelpCircle, ChevronDown, Check } from "lucide-react";
import { DEFAULT_SETTINGS, STYLE_REQUIRED_SETTINGS, DOOR_STYLES, getDoorGeometry } from "../doorconfig";
import { toFraction, parseFraction, formatDecimalInput } from "../utils";
import DimensionInput from "./DimensionInput";

// Detailed help descriptions for build settings
const SETTING_DESCRIPTIONS = {
  stileWidth: "Width of the vertical side frame pieces (stiles).",
  stileThickness: "Thickness of the door frame parts.",
  topRailWidth: "Width of the top horizontal rail part.",
  middleRailWidth: "Width of intermediate center rail parts.",
  bottomRailWidth: "Width of the bottom horizontal rail part.",
  heightToMiddleRail: "Height from the bottom of the door to the center of the middle rail.",
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
      { name: "middleRailWidth", label: "Middle Rail Width" },
      { name: "bottomRailWidth", label: "Bottom Rail Width" },
      { name: "heightToMiddleRail", label: "Height to Middle Rail" },
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
  const tickSize = 0.8;
  const tickX1_1 = dimX1 - tickSize;
  const tickY1_1 = dimY1 + tickSize;
  const tickX1_2 = dimX1 + tickSize;
  const tickY1_2 = dimY1 - tickSize;

  const tickX2_1 = dimX2 - tickSize;
  const tickY2_1 = dimY2 + tickSize;
  const tickX2_2 = dimX2 + tickSize;
  const tickY2_2 = dimY2 - tickSize;

  // Hover hit-box dimensions for text
  const textLen = value.length;
  const hoverWidth = Math.max(10, textLen * 2.2 + 2);
  const hoverHeight = 8;

  return (
    <g className="transition-all duration-200">
      {/* 1. Extension dashed lines */}
      <line
        x1={extX1_start}
        y1={extY1_start}
        x2={extX1_end}
        y2={extY1_end}
        stroke={isHighlighted ? "#00A69C" : "#a8a29e"}
        strokeWidth={isHighlighted ? 0.35 : 0.2}
        strokeDasharray="0.8,0.8"
      />
      <line
        x1={extX2_start}
        y1={extY2_start}
        x2={extX2_end}
        y2={extY2_end}
        stroke={isHighlighted ? "#00A69C" : "#a8a29e"}
        strokeWidth={isHighlighted ? 0.35 : 0.2}
        strokeDasharray="0.8,0.8"
      />

      {/* 2. Main Dimension Line (overshooting the extension lines slightly) */}
      <line
        x1={isHorizontal ? dimX1 - overshootDim : dimX1}
        y1={isHorizontal ? dimY1 : dimY1 - overshootDim}
        x2={isHorizontal ? dimX2 + overshootDim : dimX2}
        y2={isHorizontal ? dimY2 : dimY2 + overshootDim}
        stroke={isHighlighted ? "#00A69C" : "#78716c"}
        strokeWidth={isHighlighted ? 0.45 : 0.3}
      />

      {/* 3. Architectural Ticks (45-degree slashes at intersections) */}
      <line
        x1={tickX1_1}
        y1={tickY1_1}
        x2={tickX1_2}
        y2={tickY1_2}
        stroke={isHighlighted ? "#00A69C" : "#44403c"}
        strokeWidth={isHighlighted ? 0.7 : 0.45}
      />
      <line
        x1={tickX2_1}
        y1={tickY2_1}
        x2={tickX2_2}
        y2={tickY2_2}
        stroke={isHighlighted ? "#00A69C" : "#44403c"}
        strokeWidth={isHighlighted ? 0.7 : 0.45}
      />

      {/* 4. Dimension Text (rests above the line, aligned) */}
      <g
        className={isInteractive ? "cursor-pointer group" : "cursor-default"}
        onClick={(e) => {
          if (isInteractive) {
            e.stopPropagation();
            onClick(fieldName, midX, midY);
          }
        }}
      >
        {/* Transparent background pill that turns subtle teal on hover to guide clicks */}
        {isInteractive && (
          <rect
            x={midX - hoverWidth / 2}
            y={midY - hoverHeight / 2}
            width={hoverWidth}
            height={hoverHeight}
            rx={1}
            fill="transparent"
            className="group-hover:fill-teal-500/10 group-hover:stroke-teal-500/30 transition-all duration-150"
            stroke="transparent"
            strokeWidth={0.15}
            transform={!isHorizontal ? `rotate(-90, ${midX}, ${midY})` : ""}
          />
        )}

        {/* Text Group */}
        <g transform={!isHorizontal ? `rotate(-90, ${midX}, ${midY})` : ""}>
          {/* Label (tiny name below/above value) */}
          <text
            x={midX}
            y={midY - 4.1}
            textAnchor="middle"
            fill={isHighlighted ? "#00A69C" : "#78716c"}
            fontSize={1.7}
            fontWeight="bold"
            className="uppercase tracking-widest pointer-events-none transition-colors duration-150"
          >
            {labelText}
          </text>
          
          {/* Value */}
          <text
            x={midX}
            y={midY - 1.0}
            textAnchor="middle"
            fill={isHighlighted ? "#00A69C" : "#1c1917"}
            fontSize={3.2}
            fontWeight="bold"
            fontFamily="monospace"
            className="pointer-events-none transition-colors duration-150 group-hover:fill-[#00A69C]"
          >
            {value}
          </text>
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
}) => {
  const [focusedField, setFocusedField] = useState(null);
  const [inlineEdit, setInlineEdit] = useState(null); // { fieldName, x, y, value }
  const [showGrooves, setShowGrooves] = useState(true);

  // Reference door size selection state
  const [refDoorId, setRefDoorId] = useState("default");
  const inlineInputRef = useRef(null);

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
    return merged;
  }, [settings]);



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
  }, [inlineEdit]);

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
      initialValue = formatDecimalInput(previewWidth);
    } else if (fieldName === "doorHeightRef") {
      initialValue = formatDecimalInput(previewHeight);
    } else {
      initialValue = formatDecimalInput(activeSettings[fieldName]);
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
          setLocalDefaultWidth(parsed);
        } else {
          const parsedId = Number(refDoorId);
          if (!Number.isNaN(parsedId)) {
            updateDoor(parsedId, "width", parsed);
          }
        }
      } else if (inlineEdit.fieldName === "doorHeightRef") {
        if (refDoorId === "default") {
          setLocalDefaultHeight(parsed);
        } else {
          const parsedId = Number(refDoorId);
          if (!Number.isNaN(parsedId)) {
            updateDoor(parsedId, "height", parsed);
          }
        }
      } else {
        updateSetting(inlineEdit.fieldName, parsed);
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

  // Helper dimensions SVG calculation (offset to left & top for dimension stacks)
  const minX = -26;
  const minY = -22;
  const viewBoxWidth = previewWidth + 34; // 26 left padding, 8 right padding
  const viewBoxHeight = previewHeight + 30; // 22 top padding, 8 bottom padding

  // Helper variables for rail calculations
  const leftStile = geometry.stiles.find((s) => s.id === "left-stile");
  const topRail = geometry.rails.find((r) => r.id === "top-rail");
  const bottomRail = geometry.rails.find((r) => r.id === "bottom-rail");
  const middleRail1 = geometry.rails.find((r) => r.id === "middle-rail-1");

  // Calculations for 3 Panel spacing representation
  const availSpace = previewHeight - activeSettings.topRailWidth - activeSettings.bottomRailWidth - 2 * (activeSettings.middleRailWidth || 0);
  const panelHeight3P = Math.max(0, availSpace / 3);

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
                <label className="text-xs font-bold text-stone-600 uppercase">Preview Size:</label>
                <div className="relative">
                  <select
                    value={refDoorId}
                    onChange={(e) => {
                      setRefDoorId(e.target.value);
                      setInlineEdit(null);
                    }}
                    className="text-xs border border-stone-900 rounded-sm bg-white py-1 px-2 pr-6 outline-none focus:border-[#00A69C] cursor-pointer appearance-none font-semibold"
                  >
                    <option value="default">Standard 36" x 96"</option>
                    {doors.map((d, index) => (
                      <option key={d.id} value={d.id}>
                        Door {index + 1} ({toFraction(d.width)} × {toFraction(d.height)})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 text-stone-500 pointer-events-none" size={12} />
                </div>
              </div>

              {/* Show Grooves Toggle */}
              <button
                type="button"
                onClick={() => setShowGrooves(!showGrooves)}
                className={`text-xs px-2 py-1 rounded-sm border font-bold transition-all cursor-pointer ${showGrooves
                  ? "bg-teal-50 text-teal-800 border-teal-500"
                  : "bg-stone-50 text-stone-600 border-stone-300 hover:border-stone-400"
                  }`}
                title="Toggle dashed lines showing panels inside rails/stiles"
              >
                Grooves
              </button>
            </div>
          </div>

          {/* SVG Canvas Container */}
          <div className="flex-1 relative flex items-center justify-center bg-stone-50/50 p-6 min-h-[300px] lg:min-h-0 overflow-hidden">

            {/* The SVG element */}
            <svg
              viewBox={`${minX} ${minY} ${viewBoxWidth} ${viewBoxHeight}`}
              className="max-h-[50vh] lg:max-h-[60vh] max-w-full drop-shadow-md select-none transition-all duration-300"
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
                    strokeWidth={0.3}
                    className={`transition-all duration-150 ${focusedField === "stileWidth" ? "stroke-[#00A69C] stroke-[0.6]" : ""}`}
                  />
                ))}

                {/* Rails */}
                {geometry.rails.map((r) => {
                  let activeField = "";
                  if (r.id === "top-rail") activeField = "topRailWidth";
                  if (r.id === "bottom-rail") activeField = "bottomRailWidth";
                  if (r.id.startsWith("middle-rail")) activeField = "middleRailWidth";

                  return (
                    <rect
                      key={r.id}
                      x={r.x}
                      y={r.y}
                      width={r.width}
                      height={r.height}
                      fill="#c8a96e"
                      stroke="#292524"
                      strokeWidth={0.3}
                      className={`transition-all duration-150 ${focusedField === activeField ? "stroke-[#00A69C] stroke-[0.6]" : ""}`}
                    />
                  );
                })}
              </g>

              {/* 4. Draw Center Line helper for 2 Panel Middle Height measurement */}
              {doorType === "2 Panel" && (
                <line
                  x1={-2}
                  y1={previewHeight - activeSettings.heightToMiddleRail}
                  x2={previewWidth + 2}
                  y2={previewHeight - activeSettings.heightToMiddleRail}
                  stroke="#00A69C"
                  strokeWidth={0.2}
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
                offsetY={-18}
                value={`${toFraction(previewWidth)}`}
                labelText="Door Width"
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
                  offsetY={-10}
                  value={`${toFraction(activeSettings.stileWidth)}`}
                  labelText="Stile W."
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
                offsetY={-10}
                value={`${toFraction(Math.max(0, previewWidth - 2 * activeSettings.stileWidth))}`}
                labelText="Panel W."
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
                offsetY={-10}
                value={`${toFraction(activeSettings.stileWidth)}`}
                labelText="Stile W."
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
                offsetX={-22}
                offsetY={0}
                value={`${toFraction(previewHeight)}`}
                labelText="Door Height"
                fieldName="doorHeightRef"
                focusedField={focusedField}
                onClick={handlePillClick}
              />

              {/* Height to Middle Rail (2 Panel only - Middle level) */}
              {doorType === "2 Panel" && (
                <DimensionLine
                  x1={0}
                  y1={previewHeight - activeSettings.heightToMiddleRail}
                  x2={0}
                  y2={previewHeight}
                  offsetX={-16}
                  offsetY={0}
                  value={`${toFraction(activeSettings.heightToMiddleRail)}`}
                  labelText="Mid Ht."
                  fieldName="heightToMiddleRail"
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
                  offsetX={-10}
                  offsetY={0}
                  value={`${toFraction(activeSettings.topRailWidth)}`}
                  labelText="Top Rail"
                  fieldName="topRailWidth"
                  focusedField={focusedField}
                  onClick={handlePillClick}
                />
              )}

              {/* 1 Panel Vertical Chain */}
              {doorType === "1 Panel" && (
                <>
                  {/* Panel Height (Uneditable) */}
                  <DimensionLine
                    x1={0}
                    y1={activeSettings.topRailWidth}
                    x2={0}
                    y2={Math.max(activeSettings.topRailWidth, previewHeight - activeSettings.bottomRailWidth)}
                    offsetX={-10}
                    offsetY={0}
                    value={`${toFraction(Math.max(0, previewHeight - activeSettings.topRailWidth - activeSettings.bottomRailWidth))}`}
                    labelText="Panel Ht."
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
                    y2={Math.max(activeSettings.topRailWidth, previewHeight - activeSettings.heightToMiddleRail - activeSettings.middleRailWidth / 2)}
                    offsetX={-10}
                    offsetY={0}
                    value={`${toFraction(Math.max(0, previewHeight - activeSettings.heightToMiddleRail - activeSettings.middleRailWidth / 2 - activeSettings.topRailWidth))}`}
                    labelText="Panel Ht."
                    fieldName="upperPanelHeightRef"
                    focusedField={focusedField}
                    onClick={handlePillClick}
                  />

                  {/* Middle Rail Width */}
                  <DimensionLine
                    x1={0}
                    y1={previewHeight - activeSettings.heightToMiddleRail - activeSettings.middleRailWidth / 2}
                    x2={0}
                    y2={previewHeight - activeSettings.heightToMiddleRail + activeSettings.middleRailWidth / 2}
                    offsetX={-10}
                    offsetY={0}
                    value={`${toFraction(activeSettings.middleRailWidth)}`}
                    labelText="Mid Rail"
                    fieldName="middleRailWidth"
                    focusedField={focusedField}
                    onClick={handlePillClick}
                  />

                  {/* Lower Panel Height (Uneditable) */}
                  <DimensionLine
                    x1={0}
                    y1={previewHeight - activeSettings.heightToMiddleRail + activeSettings.middleRailWidth / 2}
                    x2={0}
                    y2={Math.max(previewHeight - activeSettings.heightToMiddleRail + activeSettings.middleRailWidth / 2, previewHeight - activeSettings.bottomRailWidth)}
                    offsetX={-10}
                    offsetY={0}
                    value={`${toFraction(Math.max(0, activeSettings.heightToMiddleRail - activeSettings.middleRailWidth / 2 - activeSettings.bottomRailWidth))}`}
                    labelText="Panel Ht."
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
                    offsetX={-10}
                    offsetY={0}
                    value={`${toFraction(panelHeight3P)}`}
                    labelText="Panel Ht."
                    fieldName="upperPanelHeightRef"
                    focusedField={focusedField}
                    onClick={handlePillClick}
                  />

                  {/* Top Middle Rail Width */}
                  <DimensionLine
                    x1={0}
                    y1={activeSettings.topRailWidth + panelHeight3P}
                    x2={0}
                    y2={activeSettings.topRailWidth + panelHeight3P + activeSettings.middleRailWidth}
                    offsetX={-10}
                    offsetY={0}
                    value={`${toFraction(activeSettings.middleRailWidth)}`}
                    labelText="Mid Rail"
                    fieldName="middleRailWidth"
                    focusedField={focusedField}
                    onClick={handlePillClick}
                  />

                  {/* Middle Panel Height (Uneditable) */}
                  <DimensionLine
                    x1={0}
                    y1={activeSettings.topRailWidth + panelHeight3P + activeSettings.middleRailWidth}
                    x2={0}
                    y2={activeSettings.topRailWidth + 2 * panelHeight3P + activeSettings.middleRailWidth}
                    offsetX={-10}
                    offsetY={0}
                    value={`${toFraction(panelHeight3P)}`}
                    labelText="Panel Ht."
                    fieldName="middlePanelHeightRef"
                    focusedField={focusedField}
                    onClick={handlePillClick}
                  />

                  {/* Bottom Middle Rail Width */}
                  <DimensionLine
                    x1={0}
                    y1={activeSettings.topRailWidth + 2 * panelHeight3P + activeSettings.middleRailWidth}
                    x2={0}
                    y2={activeSettings.topRailWidth + 2 * panelHeight3P + 2 * activeSettings.middleRailWidth}
                    offsetX={-10}
                    offsetY={0}
                    value={`${toFraction(activeSettings.middleRailWidth)}`}
                    labelText="Mid Rail"
                    fieldName="middleRailWidth"
                    focusedField={focusedField}
                    onClick={handlePillClick}
                  />

                  {/* Lower Panel Height (Uneditable) */}
                  <DimensionLine
                    x1={0}
                    y1={activeSettings.topRailWidth + 2 * panelHeight3P + 2 * activeSettings.middleRailWidth}
                    x2={0}
                    y2={previewHeight - activeSettings.bottomRailWidth}
                    offsetX={-10}
                    offsetY={0}
                    value={`${toFraction(panelHeight3P)}`}
                    labelText="Panel Ht."
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
                  offsetX={-10}
                  offsetY={0}
                  value={`${toFraction(activeSettings.bottomRailWidth)}`}
                  labelText="Bot Rail"
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
                STYLE_REQUIRED_SETTINGS[doorType]?.includes(field.name)
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
                            onChange={(value) => updateSetting(field.name, value)}
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
              Apply & Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsWorkspace;
