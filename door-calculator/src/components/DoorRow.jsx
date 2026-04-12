import { Trash2 } from "lucide-react";
import DimensionInput from "./DimensionInput";

const DoorRow = ({ door, doorType, onUpdate, onRemove }) => {
  const useGlobalSideRail = door.useGlobalSideRail !== false;
  const gridClassName = `grid ${doorType === "2 Panel" ? "grid-cols-6" : "grid-cols-5"} ${!useGlobalSideRail ? "lg:grid-cols-8" : ""} gap-3 items-end bg-gray-50 p-3 rounded-lg border border-gray-200`;
  const inputClassName = "w-full p-1 border rounded";

  return (
    <div className={gridClassName}>
      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase">Qty</label>
        <input
          type="number"
          className={inputClassName}
          value={door.qty}
          onChange={(event) => onUpdate(door.id, "qty", Number(event.target.value) || 0)}
        />
      </div>

      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase">Width (in)</label>
        <DimensionInput
          className={inputClassName}
          value={door.width}
          onChange={(value) => onUpdate(door.id, "width", value)}
        />
      </div>

      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase">Height (in)</label>
        <DimensionInput
          className={inputClassName}
          value={door.height}
          onChange={(value) => onUpdate(door.id, "height", value)}
        />
      </div>

      {doorType === "2 Panel" && (
        <div>
          <label className="block text-[10px] font-bold text-blue-500 uppercase">Mid-Stile Center (in)</label>
          <DimensionInput
            className="w-full p-1 border rounded border-blue-300"
            value={door.midStileCenter}
            onChange={(value) => onUpdate(door.id, "midStileCenter", value)}
          />
        </div>
      )}

      <div className="flex flex-col justify-end h-full">
        <label className="flex items-center gap-2 cursor-pointer text-[10px] font-bold text-gray-500 uppercase mb-2">
          <input
            type="checkbox"
            checked={useGlobalSideRail}
            onChange={(event) => onUpdate(door.id, "useGlobalSideRail", event.target.checked)}
          />
          Use Global Rails
        </label>
      </div>

      {!useGlobalSideRail && (
        <>
          <div>
            <label className="block text-[10px] font-bold text-orange-500 uppercase">Rail Width</label>
            <DimensionInput
              className="w-full p-1 border rounded border-orange-300"
              value={door.sideRailWidth}
              onChange={(value) => onUpdate(door.id, "sideRailWidth", value)}
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-orange-500 uppercase">Thickness</label>
            <DimensionInput
              className="w-full p-1 border rounded border-orange-300"
              value={door.sideRailThickness}
              onChange={(value) => onUpdate(door.id, "sideRailThickness", value)}
            />
          </div>
        </>
      )}

      <button
        onClick={() => onRemove(door.id)}
        className="text-red-500 hover:bg-red-50 p-2 rounded self-center justify-self-center"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
};

export default DoorRow;
