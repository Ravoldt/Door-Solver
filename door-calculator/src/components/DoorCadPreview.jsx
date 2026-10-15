import React from "react";
import { getDoorGeometry, DEFAULT_SETTINGS } from "../doorconfig";
import { toFraction, parseFraction } from "../utils";

export const DoorCadPreview = ({
  width = 30,
  height = 80,
  thickness = "1 3/4",
  doorType = "2 Panel",
  doorTop = "Square",
  panelSubstitution = "None",
  material = "Poplar",
  profile = "Shaker",
  panel = "Flat",
  handing = "Unknown Handing",
  proportions = {
    stileWidth: 4.5,
    topRailWidth: 4.5,
    lockRailWidth: 5.5,
    intermediateRailWidth: 5,
    bottomRailWidth: 8.75,
    heightToLockRail: 36,
  },
}) => {
  const numWidth = Math.max(12, typeof width === "number" ? width : parseFraction(width) || 30);
  const numHeight = Math.max(24, typeof height === "number" ? height : parseFraction(height) || 80);

  const effectiveSettings = {
    ...DEFAULT_SETTINGS,
    stileWidth: Number(proportions.stileWidth) || 4.5,
    topRailWidth: Number(proportions.topRailWidth) || 4.5,
    lockRailWidth: Number(proportions.lockRailWidth) || 5.5,
    intermediateRailWidth: Number(proportions.intermediateRailWidth) || 5,
    bottomRailWidth: Number(proportions.bottomRailWidth) || 8.75,
    heightToLockRail: Number(proportions.heightToLockRail) || 36,
  };

  const geom = getDoorGeometry(numWidth, numHeight, effectiveSettings, doorType);

  const stileW = effectiveSettings.stileWidth;
  const topRailW = effectiveSettings.topRailWidth;
  const lockRailW = effectiveSettings.lockRailWidth;
  const interRailW = effectiveSettings.intermediateRailWidth;
  const botRailW = effectiveSettings.bottomRailWidth;
  const lockRailCenterH = effectiveSettings.heightToLockRail;

  // Lock rail calculations for 2-panel
  const lockRailTopY = numHeight - lockRailCenterH - lockRailW / 2;
  const upperPanelH = Math.max(0, lockRailTopY - topRailW);
  const lowerPanelH = Math.max(0, numHeight - botRailW - (lockRailTopY + lockRailW));

  // 3-panel calculations
  const availableSpace3 = numHeight - topRailW - botRailW - 2 * interRailW;
  const panelH3 = Math.max(0, availableSpace3 / 3);

  // Canvas bounds centered on door elevation with ample margin for callouts
  const originX = 18;
  const originY = 12;
  const vbW = numWidth + 36;
  const vbH = numHeight + 20;

  // Signature Teal colors for dimensions
  const dimColor = "#00A69C";
  const cadStroke = "#334155";

  // Check if panel has glass substitution
  const isPanelSubstituted = (panelId, index) => {
    if (panelSubstitution === "All Panels") return true;
    if (panelSubstitution === "Top Panel" && (panelId === "panel-upper" || index === 0)) return true;
    return false;
  };

  // Arch path generator for top rail/panel
  const renderTopDoorArch = () => {
    if (doorTop === "Square") return null;
    const archH = doorTop === "Full Arch" ? topRailW * 0.8 : doorTop === "Roman" ? topRailW * 0.6 : topRailW * 0.4;

    return (
      <path
        d={`M ${stileW} ${topRailW} Q ${numWidth / 2} ${topRailW - archH} ${numWidth - stileW} ${topRailW}`}
        fill="none"
        stroke={cadStroke}
        strokeWidth={0.3}
        strokeDasharray={doorTop === "Roman" ? "0.8,0.4" : "none"}
      />
    );
  };

  return (
    <div className="relative w-full h-full bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm flex flex-col items-center justify-center p-4 sm:p-6 select-none">
      <svg
        viewBox={`0 0 ${vbW} ${vbH}`}
        className="w-full h-full max-h-[820px]"
      >
        <defs>
          {/* Subtle grid pattern for clean CAD feel */}
          <pattern id="light-grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(0, 0, 0, 0.03)" strokeWidth="0.2" />
          </pattern>
          {/* Glass crosshatch pattern for panel substitution */}
          <pattern id="glass-pattern-light" width="4" height="4" patternUnits="userSpaceOnUse">
            <path d="M 0 4 L 4 0" fill="none" stroke="rgba(0, 166, 156, 0.3)" strokeWidth="0.25" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#light-grid)" />

        {/* MAIN ELEVATION VIEW */}
        <g transform={`translate(${originX}, ${originY})`}>
          {/* Draw Panels (Recessed) */}
          {geom.panels.map((p, idx) => {
            const isSub = isPanelSubstituted(p.id, idx);
            return (
              <g key={p.id}>
                <rect
                  x={p.x}
                  y={p.y}
                  width={p.width}
                  height={p.height}
                  fill={isSub ? "#f0fdfa" : "#f1f5f9"}
                  stroke="#cbd5e1"
                  strokeWidth={0.2}
                />
                {isSub && (
                  <rect
                    x={p.x}
                    y={p.y}
                    width={p.width}
                    height={p.height}
                    fill="url(#glass-pattern-light)"
                  />
                )}
              </g>
            );
          })}

          {/* Door Top Arch Accent */}
          {renderTopDoorArch()}

          {/* Draw Stiles */}
          {geom.stiles.map((s) => (
            <rect
              key={s.id}
              x={s.x}
              y={s.y}
              width={s.width}
              height={s.height}
              fill="#f8fafc"
              stroke={cadStroke}
              strokeWidth={0.3}
            />
          ))}

          {/* Draw Rails */}
          {geom.rails.map((r) => (
            <rect
              key={r.id}
              x={r.x}
              y={r.y}
              width={r.width}
              height={r.height}
              fill="#f8fafc"
              stroke={cadStroke}
              strokeWidth={0.3}
            />
          ))}

          {/* --- TEAL CAD DIMENSION LINES & CALLOUTS (ONLY DIMENSIONS SHOWN) --- */}
          <g className="font-sans font-medium select-none">
            {/* 1. TOP OVERALL WIDTH */}
            <g>
              <line x1={0} y1={-1} x2={0} y2={-7.5} stroke={dimColor} strokeWidth={0.15} />
              <line x1={numWidth} y1={-1} x2={numWidth} y2={-7.5} stroke={dimColor} strokeWidth={0.15} />
              <line x1={0} y1={-6.5} x2={numWidth} y2={-6.5} stroke={dimColor} strokeWidth={0.25} />
              <line x1={0} y1={-7.3} x2={0} y2={-5.7} stroke={dimColor} strokeWidth={0.35} />
              <line x1={numWidth} y1={-7.3} x2={numWidth} y2={-5.7} stroke={dimColor} strokeWidth={0.35} />
              <text
                x={numWidth / 2}
                y={-7.5}
                textAnchor="middle"
                fill={dimColor}
                className="text-[2.6px] font-bold"
              >
                {toFraction(numWidth)}
              </text>
            </g>

            {/* 2. TOP STILE & RAIL WIDTH CALLOUTS */}
            {/* Left Stile Width */}
            <g>
              <line x1={0} y1={-1} x2={0} y2={-4} stroke={dimColor} strokeWidth={0.12} />
              <line x1={stileW} y1={-1} x2={stileW} y2={-4} stroke={dimColor} strokeWidth={0.12} />
              <line x1={0} y1={-3} x2={stileW} y2={-3} stroke={dimColor} strokeWidth={0.2} />
              <line x1={0} y1={-3.6} x2={0} y2={-2.4} stroke={dimColor} strokeWidth={0.3} />
              <line x1={stileW} y1={-3.6} x2={stileW} y2={-2.4} stroke={dimColor} strokeWidth={0.3} />
              <text
                x={stileW / 2}
                y={-4.0}
                textAnchor="middle"
                fill={dimColor}
                className="text-[2.2px] font-semibold"
              >
                {toFraction(stileW)}
              </text>
            </g>

            {/* Top Rail Width */}
            <g>
              <line x1={stileW} y1={0} x2={-3} y2={0} stroke={dimColor} strokeWidth={0.12} />
              <line x1={stileW} y1={topRailW} x2={-3} y2={topRailW} stroke={dimColor} strokeWidth={0.12} />
              <line x1={-2.5} y1={0} x2={-2.5} y2={topRailW} stroke={dimColor} strokeWidth={0.2} />
              <line x1={-3.1} y1={0} x2={-1.9} y2={0} stroke={dimColor} strokeWidth={0.3} />
              <line x1={-3.1} y1={topRailW} x2={-1.9} y2={topRailW} stroke={dimColor} strokeWidth={0.3} />
              <text
                x={-4.5}
                y={topRailW / 2 + 0.6}
                textAnchor="end"
                fill={dimColor}
                className="text-[2.2px] font-semibold"
              >
                {toFraction(topRailW)}
              </text>
            </g>

            {/* Right Stile Width */}
            <g>
              <line x1={numWidth - stileW} y1={-1} x2={numWidth - stileW} y2={-4} stroke={dimColor} strokeWidth={0.12} />
              <line x1={numWidth} y1={-1} x2={numWidth} y2={-4} stroke={dimColor} strokeWidth={0.12} />
              <line x1={numWidth - stileW} y1={-3} x2={numWidth} y2={-3} stroke={dimColor} strokeWidth={0.2} />
              <line x1={numWidth - stileW} y1={-3.6} x2={numWidth - stileW} y2={-2.4} stroke={dimColor} strokeWidth={0.3} />
              <line x1={numWidth} y1={-3.6} x2={numWidth} y2={-2.4} stroke={dimColor} strokeWidth={0.3} />
              <text
                x={numWidth - stileW / 2}
                y={-4.0}
                textAnchor="middle"
                fill={dimColor}
                className="text-[2.2px] font-semibold"
              >
                {toFraction(stileW)}
              </text>
            </g>

            {/* 3. LEFT OVERALL HEIGHT */}
            <g>
              <line x1={0} y1={0} x2={-12} y2={0} stroke={dimColor} strokeWidth={0.12} />
              <line x1={0} y1={numHeight} x2={-12} y2={numHeight} stroke={dimColor} strokeWidth={0.12} />
              <line x1={-11} y1={0} x2={-11} y2={numHeight} stroke={dimColor} strokeWidth={0.25} />
              <line x1={-11.8} y1={0} x2={-10.2} y2={0} stroke={dimColor} strokeWidth={0.35} />
              <line x1={-11.8} y1={numHeight} x2={-10.2} y2={numHeight} stroke={dimColor} strokeWidth={0.35} />
              <text
                x={-13}
                y={numHeight / 2}
                textAnchor="end"
                fill={dimColor}
                className="text-[2.6px] font-bold"
              >
                {toFraction(numHeight)}
              </text>
            </g>

            {/* 4. STYLE-SPECIFIC DIMENSION LINES */}
            {doorType === "1 Panel" && (
              <g>
                {/* Single Panel Opening Height */}
                <line x1={numWidth - stileW} y1={topRailW} x2={numWidth + 4} y2={topRailW} stroke={dimColor} strokeWidth={0.12} />
                <line x1={numWidth - stileW} y1={numHeight - botRailW} x2={numWidth + 4} y2={numHeight - botRailW} stroke={dimColor} strokeWidth={0.12} />
                <line x1={numWidth + 3} y1={topRailW} x2={numWidth + 3} y2={numHeight - botRailW} stroke={dimColor} strokeWidth={0.2} />
                <line x1={numWidth + 2.2} y1={topRailW} x2={numWidth + 3.8} y2={topRailW} stroke={dimColor} strokeWidth={0.3} />
                <line x1={numWidth + 2.2} y1={numHeight - botRailW} x2={numWidth + 3.8} y2={numHeight - botRailW} stroke={dimColor} strokeWidth={0.3} />
                <text
                  x={numWidth + 5}
                  y={(numHeight - botRailW + topRailW) / 2 + 0.8}
                  textAnchor="start"
                  fill={dimColor}
                  className="text-[2.4px] font-semibold"
                >
                  {toFraction(numHeight - topRailW - botRailW)}
                </text>
              </g>
            )}

            {doorType === "2 Panel" && (
              <>
                {/* Lock Rail Centerline (from bottom) */}
                <g>
                  <line x1={-7} y1={numHeight - lockRailCenterH} x2={numWidth + 3} y2={numHeight - lockRailCenterH} stroke={dimColor} strokeWidth={0.12} strokeDasharray="1.5,1.5" />
                  <text
                    x={-8}
                    y={numHeight - lockRailCenterH + 0.8}
                    textAnchor="end"
                    fill={dimColor}
                    className="text-[2.3px] font-semibold"
                  >
                    {toFraction(lockRailCenterH)}
                  </text>
                </g>

                {/* Lock Rail Width Callout */}
                <g>
                  <line x1={stileW} y1={lockRailTopY} x2={-3} y2={lockRailTopY} stroke={dimColor} strokeWidth={0.12} />
                  <line x1={stileW} y1={lockRailTopY + lockRailW} x2={-3} y2={lockRailTopY + lockRailW} stroke={dimColor} strokeWidth={0.12} />
                  <line x1={-2.5} y1={lockRailTopY} x2={-2.5} y2={lockRailTopY + lockRailW} stroke={dimColor} strokeWidth={0.2} />
                  <line x1={-3.1} y1={lockRailTopY} x2={-1.9} y2={lockRailTopY} stroke={dimColor} strokeWidth={0.3} />
                  <line x1={-3.1} y1={lockRailTopY + lockRailW} x2={-1.9} y2={lockRailTopY + lockRailW} stroke={dimColor} strokeWidth={0.3} />
                  <text
                    x={-4}
                    y={lockRailTopY - 1.2}
                    textAnchor="end"
                    fill={dimColor}
                    className="text-[2.2px] font-semibold"
                  >
                    {toFraction(lockRailW)}
                  </text>
                </g>

                {/* Upper Panel Opening Height */}
                <g>
                  <line x1={numWidth - stileW} y1={topRailW} x2={numWidth + 4} y2={topRailW} stroke={dimColor} strokeWidth={0.12} />
                  <line x1={numWidth - stileW} y1={lockRailTopY} x2={numWidth + 4} y2={lockRailTopY} stroke={dimColor} strokeWidth={0.12} />
                  <line x1={numWidth + 3} y1={topRailW} x2={numWidth + 3} y2={lockRailTopY} stroke={dimColor} strokeWidth={0.2} />
                  <line x1={numWidth + 2.2} y1={topRailW} x2={numWidth + 3.8} y2={topRailW} stroke={dimColor} strokeWidth={0.3} />
                  <line x1={numWidth + 2.2} y1={lockRailTopY} x2={numWidth + 3.8} y2={lockRailTopY} stroke={dimColor} strokeWidth={0.3} />
                  <text
                    x={numWidth + 5}
                    y={topRailW + upperPanelH / 2 + 0.8}
                    textAnchor="start"
                    fill={dimColor}
                    className="text-[2.4px] font-semibold"
                  >
                    {toFraction(upperPanelH)}
                  </text>
                </g>

                {/* Lower Panel Opening Height */}
                <g>
                  <line x1={numWidth - stileW} y1={lockRailTopY + lockRailW} x2={numWidth + 4} y2={lockRailTopY + lockRailW} stroke={dimColor} strokeWidth={0.12} />
                  <line x1={numWidth - stileW} y1={numHeight - botRailW} x2={numWidth + 4} y2={numHeight - botRailW} stroke={dimColor} strokeWidth={0.12} />
                  <line x1={numWidth + 3} y1={lockRailTopY + lockRailW} x2={numWidth + 3} y2={numHeight - botRailW} stroke={dimColor} strokeWidth={0.2} />
                  <line x1={numWidth + 2.2} y1={lockRailTopY + lockRailW} x2={numWidth + 3.8} y2={lockRailTopY + lockRailW} stroke={dimColor} strokeWidth={0.3} />
                  <line x1={numWidth + 2.2} y1={numHeight - botRailW} x2={numWidth + 3.8} y2={numHeight - botRailW} stroke={dimColor} strokeWidth={0.3} />
                  <text
                    x={numWidth + 5}
                    y={lockRailTopY + lockRailW + lowerPanelH / 2 + 0.8}
                    textAnchor="start"
                    fill={dimColor}
                    className="text-[2.4px] font-semibold"
                  >
                    {toFraction(lowerPanelH)}
                  </text>
                </g>
              </>
            )}

            {doorType === "3 Panel" && (
              <>
                {/* Intermediate Rail Width */}
                <g>
                  <line x1={stileW} y1={topRailW + panelH3} x2={-3} y2={topRailW + panelH3} stroke={dimColor} strokeWidth={0.12} />
                  <line x1={stileW} y1={topRailW + panelH3 + interRailW} x2={-3} y2={topRailW + panelH3 + interRailW} stroke={dimColor} strokeWidth={0.12} />
                  <line x1={-2.5} y1={topRailW + panelH3} x2={-2.5} y2={topRailW + panelH3 + interRailW} stroke={dimColor} strokeWidth={0.2} />
                  <text
                    x={-4.5}
                    y={topRailW + panelH3 + interRailW / 2 + 0.6}
                    textAnchor="end"
                    fill={dimColor}
                    className="text-[2.2px] font-semibold"
                  >
                    {toFraction(interRailW)}
                  </text>
                </g>

                {/* Panel Opening Heights */}
                <g>
                  <line x1={numWidth - stileW} y1={topRailW} x2={numWidth + 4} y2={topRailW} stroke={dimColor} strokeWidth={0.12} />
                  <line x1={numWidth - stileW} y1={topRailW + panelH3} x2={numWidth + 4} y2={topRailW + panelH3} stroke={dimColor} strokeWidth={0.12} />
                  <line x1={numWidth + 3} y1={topRailW} x2={numWidth + 3} y2={topRailW + panelH3} stroke={dimColor} strokeWidth={0.2} />
                  <text
                    x={numWidth + 5}
                    y={topRailW + panelH3 / 2 + 0.8}
                    textAnchor="start"
                    fill={dimColor}
                    className="text-[2.4px] font-semibold"
                  >
                    {toFraction(panelH3)} (ea)
                  </text>
                </g>
              </>
            )}

            {/* Bottom Rail Width Callout */}
            <g>
              <line x1={numWidth - stileW} y1={numHeight - botRailW} x2={numWidth + 4} y2={numHeight - botRailW} stroke={dimColor} strokeWidth={0.12} />
              <line x1={numWidth} y1={numHeight} x2={numWidth + 4} y2={numHeight} stroke={dimColor} strokeWidth={0.12} />
              <line x1={numWidth + 3} y1={numHeight - botRailW} x2={numWidth + 3} y2={numHeight} stroke={dimColor} strokeWidth={0.2} />
              <line x1={numWidth + 2.2} y1={numHeight - botRailW} x2={numWidth + 3.8} y2={numHeight - botRailW} stroke={dimColor} strokeWidth={0.3} />
              <line x1={numWidth + 2.2} y1={numHeight} x2={numWidth + 3.8} y2={numHeight} stroke={dimColor} strokeWidth={0.3} />
              <text
                x={numWidth + 5}
                y={numHeight - botRailW / 2 + 0.8}
                textAnchor="start"
                fill={dimColor}
                className="text-[2.2px] font-semibold"
              >
                {toFraction(botRailW)}
              </text>
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
};

export default DoorCadPreview;
