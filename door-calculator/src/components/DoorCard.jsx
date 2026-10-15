import React from "react";
import { Trash2, Settings, Plus, Minus } from "lucide-react";
import DimensionInput from "./DimensionInput";
import DoorCardSvg from "./DoorCardSvg";

const DoorCard = ({
  door,
  index,
  onUpdate,
  onRemove,
  onOpenSettings,
  warnings = [],
  globalSettings,
  doorType,
  profile,
}) => {
  const inputClassName =
    "w-full p-1.5 text-center border border-stone-300 rounded-lg focus:border-[#00A69C] focus:ring-1 focus:ring-[#00A69C] outline-none bg-stone-50 text-stone-900 font-bold transition-colors text-sm";
  const labelClassName = "block text-[10px] font-bold text-stone-500 uppercase mb-1 text-center tracking-wider";

  return (
    <div className="bg-white border border-stone-200 hover:border-teal-500/50 p-4 flex flex-col justify-between min-h-[460px] rounded-2xl transition-all shadow-xs hover:shadow-md relative group">
      {/* Index Badge */}
      <div className="absolute top-3 left-3 w-7 h-7 rounded-full bg-teal-50 text-[#00A69C] flex items-center justify-center text-xs font-black border border-teal-200 select-none z-10 shadow-2xs">
        {index + 1}
      </div>

      {/* Scaled Preview */}
      <div className="flex-1 flex items-center justify-center py-2 min-h-[240px]">
        <DoorCardSvg door={door} settings={globalSettings} doorType={doorType} profile={profile} />
      </div>

      {/* Warning Alert if any */}
      {warnings && warnings.length > 0 && (
        <div className="mb-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-[11px] space-y-0.5 max-h-16 overflow-y-auto">
          {warnings.map((w, idx) => (
            <div key={idx} className="flex items-start gap-1 font-medium">
              <span>⚠️</span>
              <span className="leading-tight">{w.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Controls Container */}
      <div className="border-t border-stone-100 pt-3 space-y-3">
        {/* Dimensions Inputs Grid */}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className={labelClassName}>Width</label>
            <DimensionInput
              className={inputClassName}
              value={door.width}
              onChange={(value) => onUpdate(door.id, "width", value)}
            />
          </div>

          <div>
            <label className={labelClassName}>Height</label>
            <DimensionInput
              className={inputClassName}
              value={door.height}
              onChange={(value) => onUpdate(door.id, "height", value)}
            />
          </div>

          <div>
            <label className={labelClassName}>Qty</label>
            <div className="flex items-center border border-stone-300 rounded-lg bg-stone-50 overflow-hidden h-[34px]">
              <button
                type="button"
                onClick={() => onUpdate(door.id, "qty", Math.max(1, (Number(door.qty) || 0) - 1))}
                className="px-2 h-full flex items-center justify-center text-stone-500 hover:text-stone-900 hover:bg-stone-200 transition-colors border-r border-stone-300 cursor-pointer select-none"
                title="Decrease quantity"
              >
                <Minus size={11} className="stroke-[3]" />
              </button>
              <input
                type="number"
                className="w-full text-center bg-transparent border-0 outline-none text-stone-900 font-bold focus:ring-0 text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                value={door.qty}
                onChange={(event) => {
                  const valStr = event.target.value;
                  if (valStr === "") {
                    onUpdate(door.id, "qty", "");
                  } else {
                    const val = Number(valStr);
                    if (!Number.isNaN(val)) {
                      onUpdate(door.id, "qty", val);
                    }
                  }
                }}
              />
              <button
                type="button"
                onClick={() => onUpdate(door.id, "qty", (Number(door.qty) || 0) + 1)}
                className="px-2 h-full flex items-center justify-center text-stone-500 hover:text-stone-900 hover:bg-stone-200 transition-colors border-l border-stone-300 cursor-pointer select-none"
                title="Increase quantity"
              >
                <Plus size={11} className="stroke-[3]" />
              </button>
            </div>
          </div>
        </div>

        {/* Buttons Row */}
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => onOpenSettings(door.id)}
            className="flex-1 bg-stone-50 hover:bg-stone-100 text-stone-700 hover:text-[#00A69C] border border-stone-200 hover:border-teal-300 rounded-lg py-1.5 px-3 flex items-center justify-center gap-1.5 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
            title="Configure settings for this door"
          >
            <Settings size={13} /> Settings
          </button>

          <button
            type="button"
            onClick={() => onRemove(door.id)}
            className="bg-white hover:bg-stone-100 text-stone-600 hover:text-rose-600 border border-stone-200 hover:border-rose-200 rounded-lg p-2 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
            title="Delete door"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DoorCard;
