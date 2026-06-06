import { Trash2, Plus, Minus } from "lucide-react";
import DimensionInput from "./DimensionInput";

const DoorCard = ({ door, index, onUpdate, onRemove }) => {
  const useGlobalSideRail = door.useGlobalSideRail !== false;
  const inputClassName = "w-full p-2 border border-stone-900 rounded-sm focus:border-[#00A69C] focus:ring-1 focus:ring-[#00A69C] outline-none bg-stone-50 text-stone-900 transition-colors";
  const labelClassName = "block text-xs font-bold text-stone-900 uppercase mb-1";

  return (
    <div className="bg-white rounded-sm shadow-sm border border-stone-900 p-5 transition-shadow hover:shadow-md">
      {/* Card Header */}
      <div className="flex items-center justify-between border-b border-stone-200 pb-3 mb-4">
        <h4 className="font-bold text-stone-900 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-teal-50 text-[#00A69C] flex items-center justify-center text-xs font-black">
            {index + 1}
          </span>
          Door Dimensions
        </h4>
        <button
          onClick={() => onRemove(door.id)}
          className="text-stone-500 hover:text-red-600 p-1 rounded-sm hover:bg-red-50 transition-colors cursor-pointer"
          title="Delete door size"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* Card Inputs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div>
          <label className={labelClassName}>Qty</label>
          <div className="flex items-center border border-stone-900 rounded-sm bg-stone-50 overflow-hidden h-[42px]">
            <button
              type="button"
              onClick={() => onUpdate(door.id, "qty", Math.max(1, (Number(door.qty) || 0) - 1))}
              className="px-3 h-full flex items-center justify-center text-stone-900 hover:bg-stone-200 transition-colors border-r border-stone-900 cursor-pointer select-none"
              title="Decrease quantity"
            >
              <Minus size={14} className="stroke-[3]" />
            </button>

            <input
              type="number"
              className="w-full text-center bg-transparent border-0 outline-none text-stone-900 font-bold focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
              className="px-3 h-full flex items-center justify-center text-stone-900 hover:bg-stone-200 transition-colors border-l border-stone-900 cursor-pointer select-none"
              title="Increase quantity"
            >
              <Plus size={14} className="stroke-[3]" />
            </button>
          </div>
        </div>

        <div>
          <label className={labelClassName}>Width (in)</label>
          <DimensionInput
            className={inputClassName}
            value={door.width}
            onChange={(value) => onUpdate(door.id, "width", value)}
          />
        </div>

        <div>
          <label className={labelClassName}>Height (in)</label>
          <DimensionInput
            className={inputClassName}
            value={door.height}
            onChange={(value) => onUpdate(door.id, "height", value)}
          />
        </div>
      </div>

      {/* Stile Options */}
      <div className="bg-stone-50 p-4 border border-stone-200 rounded-sm">
        <div className="flex items-center">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-stone-900 uppercase select-none">
            <input
              type="checkbox"
              className="w-4 h-4 accent-[#00A69C] rounded cursor-pointer"
              checked={useGlobalSideRail}
              onChange={(event) => onUpdate(door.id, "useGlobalSideRail", event.target.checked)}
            />
            Use Global Stile Width & Thickness
          </label>
        </div>

        {!useGlobalSideRail && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 pt-3 border-t border-stone-200">
            <div>
              <label className={labelClassName}>Custom Stile Width (in)</label>
              <DimensionInput
                className={`${inputClassName} bg-white`}
                value={door.stileWidth}
                onChange={(value) => onUpdate(door.id, "stileWidth", value)}
              />
            </div>

            <div>
              <label className={labelClassName}>Custom Stile Thickness (in)</label>
              <DimensionInput
                className={`${inputClassName} bg-white`}
                value={door.stileThickness}
                onChange={(value) => onUpdate(door.id, "stileThickness", value)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoorCard;
