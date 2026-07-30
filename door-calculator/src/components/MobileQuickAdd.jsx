import React, { useState } from "react";
import { Plus, Minus, Check, Clock } from "lucide-react";
import DimensionInput from "./DimensionInput";
import { formatInputDimension } from "../utils";

const MobileQuickAdd = ({ onAddDoor, recentDoors = [], onClearRecentDoors }) => {
  const [width, setWidth] = useState(36);
  const [height, setHeight] = useState(96);
  const [qty, setQty] = useState(1);
  const [addedAnimation, setAddedAnimation] = useState(false);

  const handleSubmit = (e) => {
    e?.preventDefault();
    const numericWidth = Number(width) || 36;
    const numericHeight = Number(height) || 96;
    const numericQty = Math.max(1, Number(qty) || 1);

    const success = onAddDoor(numericWidth, numericHeight, numericQty);
    if (success !== false) {
      setAddedAnimation(true);
      setTimeout(() => setAddedAnimation(false), 1200);
    }
  };

  const handleApplyPreset = (presetW, presetH) => {
    setWidth(presetW);
    setHeight(presetH);
  };

  return (
    <div className="bg-white border-2 border-[#00A69C] rounded-xl p-4 shadow-sm space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#00A69C] animate-pulse" />
          <h3 className="font-extrabold text-stone-900 text-sm tracking-wide uppercase">
            Quick Add
          </h3>
        </div>
        {addedAnimation && (
          <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200 flex items-center gap-1 animate-fade-in">
            <Check size={12} /> Door Added!
          </span>
        )}
      </div>

      {/* Recently Added Door Chips */}
      {recentDoors && recentDoors.length > 0 ? (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[10px] font-bold text-stone-500 uppercase flex-none flex items-center gap-1">
            <Clock size={10} /> Recent:
          </span>
          {recentDoors.map((preset) => {
            const isSelected = width === preset.width && height === preset.height;
            return (
              <button
                key={`${preset.width}-${preset.height}`}
                type="button"
                onClick={() => handleApplyPreset(preset.width, preset.height)}
                className={`flex-none px-2.5 py-1 text-xs font-bold rounded-sm border transition-all cursor-pointer ${isSelected
                    ? "bg-[#00A69C] text-white border-[#00A69C]"
                    : "bg-stone-100 text-stone-700 border-stone-300 hover:bg-stone-200"
                  }`}
              >
                {preset.label || `${formatInputDimension(preset.width)} × ${formatInputDimension(preset.height)}`}
              </button>
            );
          })}
          {onClearRecentDoors && (
            <button
              type="button"
              onClick={onClearRecentDoors}
              className="flex-none text-[10px] font-bold text-stone-400 hover:text-red-600 transition-colors ml-1 cursor-pointer"
              title="Clear recent sizes history"
            >
              Clear
            </button>
          )}
        </div>
      ) : (
        <div className="text-[11px] font-semibold text-stone-400 italic">
          No recently added sizes yet. Added sizes will appear here for quick reuse.
        </div>
      )}

      {/* Inputs Form */}
      <form onSubmit={handleSubmit} className="grid grid-cols-12 gap-2.5 items-end">
        {/* Width Input */}
        <div className="col-span-4">
          <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">
            Width (in)
          </label>
          <DimensionInput
            value={width}
            onChange={(val) => {
              setWidth(val);
              return true;
            }}
            className="w-full h-11 text-center text-base font-bold bg-stone-50 border-2 border-stone-300 focus:border-[#00A69C] outline-none rounded-md text-stone-900"
          />
        </div>

        {/* Height Input */}
        <div className="col-span-4">
          <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">
            Height (in)
          </label>
          <DimensionInput
            value={height}
            onChange={(val) => {
              setHeight(val);
              return true;
            }}
            className="w-full h-11 text-center text-base font-bold bg-stone-50 border-2 border-stone-300 focus:border-[#00A69C] outline-none rounded-md text-stone-900"
          />
        </div>

        {/* Quantity Controls */}
        <div className="col-span-4">
          <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">
            Qty
          </label>
          <div className="flex items-center border-2 border-stone-300 rounded-md bg-stone-50 overflow-hidden h-11">
            <button
              type="button"
              onClick={() => setQty(Math.max(1, qty - 1))}
              className="px-2.5 h-full flex items-center justify-center text-stone-900 hover:bg-stone-200 active:bg-stone-300 border-r border-stone-300"
            >
              <Minus size={14} className="stroke-[3]" />
            </button>
            <input
              type="number"
              min="1"
              value={qty}
              onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
              className="w-full text-center bg-transparent border-0 outline-none text-stone-900 font-extrabold text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button
              type="button"
              onClick={() => setQty(qty + 1)}
              className="px-2.5 h-full flex items-center justify-center text-stone-900 hover:bg-stone-200 active:bg-stone-300 border-l border-stone-300"
            >
              <Plus size={14} className="stroke-[3]" />
            </button>
          </div>
        </div>

        {/* Big Add Button */}
        <div className="col-span-12 pt-1">
          <button
            type="submit"
            className="w-full h-12 bg-[#00A69C] hover:bg-teal-700 active:bg-teal-800 text-white font-extrabold text-sm rounded-md shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Plus size={20} className="stroke-[3]" />
            <span>Add Door ({formatInputDimension(width)} × {formatInputDimension(height)}) × {qty}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default MobileQuickAdd;
