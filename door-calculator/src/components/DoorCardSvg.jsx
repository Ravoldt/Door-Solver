import React from "react";
import { getDoorGeometry, DEFAULT_SETTINGS } from "../doorconfig";
import { toFraction } from "../utils";

const DoorCardSvg = ({
  door,
  width: propWidth,
  height: propHeight,
  settings: propSettings,
  doorType = "2 Panel",
  profile = "Shaker",
  showDimensions = true,
}) => {
  const doorObj = door || {};
  const width = Number(doorObj.width ?? propWidth) || 36;
  const height = Number(doorObj.height ?? propHeight) || 96;

  const doorSettings = doorObj.settings || doorObj.visualProportions || propSettings || DEFAULT_SETTINGS;
  const effectiveSettings = profile === "Ovolo" ? { ...doorSettings, grooveDepth: 1.5, tongueLength: 1.5 } : doorSettings;

  const geom = getDoorGeometry(width, height, effectiveSettings, doorType);
  
  // Architectural padding for dimension lines
  const padTop = showDimensions ? 5.5 : 1;
  const padBottom = showDimensions ? 2.5 : 1;
  const padLeft = showDimensions ? 2 : 1;
  const padRight = showDimensions ? 5.5 : 1;

  const vbMinX = -padLeft;
  const vbMinY = -padTop;
  const vbW = width + padLeft + padRight;
  const vbH = height + padTop + padBottom;

  const fontSize = Math.max(2.2, Math.min(3.8, width * 0.08));

  return (
    <svg
      viewBox={`${vbMinX} ${vbMinY} ${vbW} ${vbH}`}
      className="w-full max-h-72 select-none transition-all duration-300 mx-auto drop-shadow-sm"
      style={{ aspectRatio: `${vbW}/${vbH}` }}
    >
      <defs>
        <filter id="card-frame-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0.5" dy="0.5" stdDeviation="0.4" floodColor="#09090b" floodOpacity="0.4" />
        </filter>
        <linearGradient id="wood-stile-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#d4a373" />
          <stop offset="50%" stopColor="#cca06e" />
          <stop offset="100%" stopColor="#c59664" />
        </linearGradient>
        <linearGradient id="wood-rail-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#cca06e" />
          <stop offset="50%" stopColor="#c59664" />
          <stop offset="100%" stopColor="#ba8b59" />
        </linearGradient>
        <linearGradient id="wood-panel-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#b5824c" />
          <stop offset="100%" stopColor="#a3703a" />
        </linearGradient>
      </defs>

      {/* Draw panels first (recessed background) */}
      {geom.panels.map((panel) => (
        <rect
          key={panel.id}
          x={panel.x}
          y={panel.y}
          width={panel.width}
          height={panel.height}
          fill="url(#wood-panel-grad)"
          stroke="#573818"
          strokeWidth={0.25}
          rx={0.2}
        />
      ))}

      {/* Draw frame stiles & rails grouped with shadow filter */}
      <g filter="url(#card-frame-shadow)">
        {/* Draw stiles */}
        {geom.stiles.map((stile) => (
          <rect
            key={stile.id}
            x={stile.x}
            y={stile.y}
            width={stile.width}
            height={stile.height}
            fill="url(#wood-stile-grad)"
            stroke="#292524"
            strokeWidth={0.25}
          />
        ))}
        {/* Draw rails */}
        {geom.rails.map((rail) => (
          <rect
            key={rail.id}
            x={rail.x}
            y={rail.y}
            width={rail.width}
            height={rail.height}
            fill="url(#wood-rail-grad)"
            stroke="#292524"
            strokeWidth={0.25}
          />
        ))}
      </g>

      {/* Architectural Dimension Callouts */}
      {showDimensions && (
        <g className="font-mono" style={{ fontSize: `${fontSize}px` }}>
          {/* Top Width Dimension Line */}
          <g>
            {/* Leader tick lines */}
            <line x1={0} y1={-1} x2={0} y2={-4} stroke="#78716c" strokeWidth={0.25} />
            <line x1={width} y1={-1} x2={width} y2={-4} stroke="#78716c" strokeWidth={0.25} />
            {/* Main horizontal dimension line */}
            <line x1={0} y1={-3} x2={width} y2={-3} stroke="#00A69C" strokeWidth={0.35} />
            {/* Arrow/ticks */}
            <line x1={0} y1={-3.6} x2={0} y2={-2.4} stroke="#00A69C" strokeWidth={0.5} />
            <line x1={width} y1={-3.6} x2={width} y2={-2.4} stroke="#00A69C" strokeWidth={0.5} />
            {/* Width Text badge */}
            <rect
              x={width / 2 - fontSize * 1.8}
              y={-4.4}
              width={fontSize * 3.6}
              height={fontSize * 1.2}
              fill="#1c1917"
              rx={0.5}
              stroke="#00A69C"
              strokeWidth={0.2}
            />
            <text
              x={width / 2}
              y={-3.4}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#2dd4bf"
              fontWeight="bold"
            >
              {toFraction(width)}"
            </text>
          </g>

          {/* Right Height Dimension Line */}
          <g>
            {/* Leader tick lines */}
            <line x1={width + 1} y1={0} x2={width + 4} y2={0} stroke="#78716c" strokeWidth={0.25} />
            <line x1={width + 1} y1={height} x2={width + 4} y2={height} stroke="#78716c" strokeWidth={0.25} />
            {/* Main vertical dimension line */}
            <line x1={width + 3} y1={0} x2={width + 3} y2={height} stroke="#00A69C" strokeWidth={0.35} />
            {/* Arrow/ticks */}
            <line x1={width + 2.4} y1={0} x2={width + 3.6} y2={0} stroke="#00A69C" strokeWidth={0.5} />
            <line x1={width + 2.4} y1={height} x2={width + 3.6} y2={height} stroke="#00A69C" strokeWidth={0.5} />
            {/* Height Text badge */}
            <rect
              x={width + 1.2}
              y={height / 2 - fontSize * 0.9}
              width={fontSize * 3.6}
              height={fontSize * 1.2}
              fill="#1c1917"
              rx={0.5}
              stroke="#00A69C"
              strokeWidth={0.2}
            />
            <text
              x={width + 3}
              y={height / 2 - 0.3}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#2dd4bf"
              fontWeight="bold"
            >
              {toFraction(height)}"
            </text>
          </g>
        </g>
      )}
    </svg>
  );
};

export default DoorCardSvg;

