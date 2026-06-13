import React from "react";
import { getDoorGeometry, DEFAULT_SETTINGS } from "../doorconfig";

const MiniDoorStyleSvg = ({ styleId }) => {
  const geom = getDoorGeometry(36, 96, DEFAULT_SETTINGS, styleId);
  const p = 5; // padding in inches
  const vbW = 36 + 2 * p;
  const vbH = 96 + 2 * p;

  return (
    <svg
      viewBox={`${-p} ${-p} ${vbW} ${vbH}`}
      className="w-full h-full p-0.5 select-none pointer-events-none transition-all duration-350"
      style={{ aspectRatio: `${vbW}/${vbH}` }}
    >
      <defs>
        {/* Subtle drop shadow to simulate frame thickness over panel */}
        <filter id="mini-frame-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0.6" dy="0.6" stdDeviation="0.4" floodColor="#1c1917" floodOpacity="0.22" />
        </filter>
      </defs>

      {/* Draw panels first (recessed behind the frame) */}
      {geom.panels.map((panel) => (
        <rect
          key={panel.id}
          x={panel.x}
          y={panel.y}
          width={panel.width}
          height={panel.height}
          fill="#c8a96e"
          stroke="#78716c"
          strokeWidth={0.5}
        />
      ))}

      {/* Draw frame stiles & rails grouped with shadow filter to avoid overlapping shadows */}
      <g filter="url(#mini-frame-shadow)">
        {/* Draw stiles */}
        {geom.stiles.map((stile) => (
          <rect
            key={stile.id}
            x={stile.x}
            y={stile.y}
            width={stile.width}
            height={stile.height}
            fill="#c8a96e"
            stroke="#292524"
            strokeWidth={0.8}
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
            fill="#c8a96e"
            stroke="#292524"
            strokeWidth={0.8}
          />
        ))}
      </g>
    </svg>
  );
};

export default MiniDoorStyleSvg;
