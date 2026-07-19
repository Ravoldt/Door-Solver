import React from "react";
import { getDoorGeometry } from "../doorconfig";

const DoorCardSvg = ({ door, settings, doorType, profile }) => {
  const doorSettings = door.settings || settings;
  const effectiveSettings = profile === "Ovolo" ? { ...doorSettings, grooveDepth: 1.5, tongueLength: 1.5 } : doorSettings;

  const width = Number(door.width) || 36;
  const height = Number(door.height) || 96;

  const geom = getDoorGeometry(width, height, effectiveSettings, doorType);
  const p = 0.5; // padding in inches
  const vbW = width + 2 * p;
  const vbH = height + 2 * p;

  return (
    <svg
      viewBox={`${-p} ${-p} ${vbW} ${vbH}`}
      className="w-full max-h-48 select-none pointer-events-none transition-all duration-350 mx-auto"
      style={{ aspectRatio: `${vbW}/${vbH}` }}
    >
      <defs>
        <filter id="card-frame-shadow" x="-20%" y="-20%" width="140%" height="140%">
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
          stroke="#c8a96e"
          strokeWidth={0.3}
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
            fill="#c8a96e"
            stroke="#292524"
            strokeWidth={0.2}
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
            strokeWidth={0.2}
          />
        ))}
      </g>
    </svg>
  );
};

export default DoorCardSvg;
