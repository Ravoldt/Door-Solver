import { Trash2 } from "lucide-react";
import DimensionInput from "./DimensionInput";

const DoorRow = ({ door, onUpdate, onRemove }) => {
  const useGlobalSideRail = door.useGlobalSideRail !== false;
  const gridClassName = `grid grid-cols-5 ${!useGlobalSideRail ? "lg:grid-cols-7" : ""} gap-3 items-end bg-white p-3 rounded-sm border border-stone-900`;
  const inputClassName = "w-full p-1 border border-stone-900 rounded-sm focus:border-[#00A69C] outline-none";
  const labelClassName = "block text-[10px] font-bold text-stone-900 uppercase";

  return (
    <div className={gridClassName}>
      <div>
        <label className={labelClassName}>Qty</label>
        <input
          type="number"
          className={inputClassName}
          value={door.qty}
          onChange={(event) => onUpdate(door.id, "qty", Number(event.target.value) || 0)}
        />
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

      <div className="flex flex-col justify-end h-full">
        <label className="flex items-center gap-2 cursor-pointer text-[10px] font-bold text-stone-900 uppercase mb-2">
          <input
            type="checkbox"
            className="accent-[#00A69C]"
            checked={useGlobalSideRail}
            onChange={(event) => onUpdate(door.id, "useGlobalSideRail", event.target.checked)}
          />
          Use Global Stile
        </label>
      </div>

      {!useGlobalSideRail && (
        <>
          <div>
            <label className={labelClassName}>Stile Width</label>
            <DimensionInput
              className={inputClassName}
              value={door.stileWidth}
              onChange={(value) => onUpdate(door.id, "stileWidth", value)}
            />
          </div>

          <div>
            <label className={labelClassName}>Thickness</label>
            <DimensionInput
              className={inputClassName}
              value={door.stileThickness}
              onChange={(value) => onUpdate(door.id, "stileThickness", value)}
            />
          </div>
        </>
      )}

      <button
        onClick={() => onRemove(door.id)}
        className="text-stone-900 hover:bg-stone-200 hover:text-teal-700 p-2 rounded-sm self-center justify-self-center transition-colors"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
};

export default DoorRow;
