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
    "w-full p-1.5 text-center border border-stone-300 rounded-sm focus:border-[#00A69C] focus:ring-1 focus:ring-[#00A69C] outline-none bg-stone-50 text-stone-900 font-bold transition-colors text-sm";
  const labelClassName = "block text-[10px] font-bold text-stone-500 uppercase mb-0.5 text-center";

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#00A69C] hover:border-teal-755 p-4 flex flex-col justify-between min-h-[460px] transition-all hover:shadow-md relative">
      {/* Index Badge */}
      <div className="absolute top-3 left-3 w-6 h-6 rounded-full bg-teal-50 text-[#00A69C] flex items-center justify-center text-xs font-black border border-[#00A69C]/30 select-none z-10">
        {index + 1}
      </div>

      {/* Scaled Preview */}
      <div className="flex-1 flex items-center justify-center py-2 min-h-[240px]">
        <DoorCardSvg door={door} settings={globalSettings} doorType={doorType} profile={profile} />
      </div>

      {/* Warning Alert if any */}
      {warnings && warnings.length > 0 && (
        <div className="mb-2 p-1.5 bg-amber-50 border border-amber-200 rounded-sm text-amber-900 text-[10px] space-y-0.5 max-h-12 overflow-y-auto">
          {warnings.map((w, idx) => (
            <div key={idx} className="flex items-start gap-1 font-semibold">
              <span>⚠️</span>
              <span className="leading-tight">{w.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Controls Container */}
      <div className="border-t border-stone-200 pt-3 space-y-3">
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
            <div className="flex items-center border border-stone-300 rounded-sm bg-stone-50 overflow-hidden h-[34px]">
              <button
                type="button"
                onClick={() => onUpdate(door.id, "qty", Math.max(1, (Number(door.qty) || 0) - 1))}
                className="px-1.5 h-full flex items-center justify-center text-stone-900 hover:bg-stone-200 transition-colors border-r border-stone-300 cursor-pointer select-none"
                title="Decrease quantity"
              >
                <Minus size={10} className="stroke-[3]" />
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
                className="px-1.5 h-full flex items-center justify-center text-stone-900 hover:bg-stone-200 transition-colors border-l border-stone-300 cursor-pointer select-none"
                title="Increase quantity"
              >
                <Plus size={10} className="stroke-[3]" />
              </button>
            </div>
          </div>
        </div>

        {/* Buttons Row */}
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => onOpenSettings(door.id)}
            className="flex-1 bg-[#FAFAFA] hover:bg-teal-50 text-stone-700 hover:text-teal-700 border border-stone-300 hover:border-teal-500 rounded-sm py-1.5 px-2 flex items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer"
            title="Configure settings for this door"
          >
            <Settings size={14} /> Settings
          </button>

          <button
            type="button"
            onClick={() => onRemove(door.id)}
            className="bg-[#FAFAFA] hover:bg-red-50 text-stone-550 hover:text-red-600 border border-stone-300 hover:border-red-400 rounded-sm p-1.5 flex items-center justify-center transition-all cursor-pointer"
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
