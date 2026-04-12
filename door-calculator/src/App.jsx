import { useMemo, useState } from "react";
import { FileText, FolderOpen, Plus, Printer, Save } from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import { calculateData } from "./calculations";
import CutListDocument from "./components/CutListDocument";
import DimensionInput from "./components/DimensionInput";
import DoorRow from "./components/DoorRow";
import { parseFraction } from "./utils";

const DEFAULT_SETTINGS = {
  sideRailWidth: 5.125,
  sideRailThickness: 1.75,
    topStileWidth: 5.125,
    midStileWidth: 6.25,
    botStileWidth: 9.125,
    panelWidthOffset: 7.5,
  endStileLengthOffset: 7,
};

const parseDimension = (value, fallback = 0) => {
  const parsedValue = parseFraction(value);
  return Number.isNaN(parsedValue) ? fallback : parsedValue;
  };

const createDoor = (settings = DEFAULT_SETTINGS) => ({
  id: Date.now(),
  width: 36,
  height: 96,
  qty: 1,
  midStileCenter: 36,
  useGlobalSideRail: true,
  sideRailWidth: settings.sideRailWidth,
  sideRailThickness: settings.sideRailThickness,
});

const normalizeSettings = (loadedSettings = {}) => ({
  ...DEFAULT_SETTINGS,
  ...loadedSettings,
  sideRailWidth: parseDimension(loadedSettings.sideRailWidth, DEFAULT_SETTINGS.sideRailWidth),
  sideRailThickness: parseDimension(loadedSettings.sideRailThickness, DEFAULT_SETTINGS.sideRailThickness),
  topStileWidth: parseDimension(loadedSettings.topStileWidth, DEFAULT_SETTINGS.topStileWidth),
  midStileWidth: parseDimension(loadedSettings.midStileWidth, DEFAULT_SETTINGS.midStileWidth),
  botStileWidth: parseDimension(loadedSettings.botStileWidth, DEFAULT_SETTINGS.botStileWidth),
  panelWidthOffset: parseDimension(loadedSettings.panelWidthOffset, DEFAULT_SETTINGS.panelWidthOffset),
  endStileLengthOffset: parseDimension(loadedSettings.endStileLengthOffset, DEFAULT_SETTINGS.endStileLengthOffset),
});

const normalizeDoor = (door = {}, settings = DEFAULT_SETTINGS) => {
  const baseDoor = createDoor(settings);

  return {
    ...baseDoor,
    ...door,
    id: door.id ?? baseDoor.id,
    qty: Number(door.qty ?? baseDoor.qty) || 0,
    width: parseDimension(door.width, baseDoor.width),
    height: parseDimension(door.height, baseDoor.height),
    midStileCenter: parseDimension(door.midStileCenter, baseDoor.midStileCenter),
    useGlobalSideRail: door.useGlobalSideRail !== false,
    sideRailWidth: parseDimension(door.sideRailWidth, settings.sideRailWidth),
    sideRailThickness: parseDimension(door.sideRailThickness, settings.sideRailThickness),
  };
};

const App = () => {
  const [doorType, setDoorType] = useState("2 Panel");
  const [jobName, setJobName] = useState("Job Name");
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [doors, setDoors] = useState(() => [createDoor(DEFAULT_SETTINGS)]);

  const data = useMemo(() => calculateData(doors, settings, doorType), [doors, settings, doorType]);

  const updateSetting = (field, value) => {
    setSettings((currentSettings) => ({
      ...currentSettings,
      [field]: value,
    }));
  };

  const handleSave = () => {
    const stateToSave = {
      jobName,
      doorType,
      doors,
      settings,
      appVersion: "1.0",
    };

    const blob = new Blob([JSON.stringify(stateToSave, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${jobName.replace(/ /g, "_") || "door_job"}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const handleLoad = (event) => {
    const file = event.target.files[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      try {
        const loadedState = JSON.parse(loadEvent.target.result);
        const isValidState =
          typeof loadedState.jobName === "string" &&
          typeof loadedState.doorType === "string" &&
          Array.isArray(loadedState.doors) &&
          loadedState.settings &&
          typeof loadedState.settings === "object";

        if (!isValidState) {
          toast.error("Invalid or corrupted save file.");
          return;
        }

        const normalizedSettings = normalizeSettings(loadedState.settings);
        const normalizedDoors = loadedState.doors.map((door) => normalizeDoor(door, normalizedSettings));

        setJobName(loadedState.jobName);
        setDoorType(loadedState.doorType);
        setSettings(normalizedSettings);
        setDoors(normalizedDoors);
      } catch (error) {
        console.error("Failed to load or parse file:", error);
        toast.error("Failed to load file. It may be corrupted.");
      }
    };

    reader.readAsText(file);
    event.target.value = null;
  };

  const addDoor = () => {
    setDoors((currentDoors) => [...currentDoors, createDoor(settings)]);
  };

  const removeDoor = (id) => {
    setDoors((currentDoors) => currentDoors.filter((door) => door.id !== id));
  };

  const updateDoor = (id, field, value) => {
    setDoors((currentDoors) =>
      currentDoors.map((door) => {
        if (door.id !== id) {
          return door;
        }

        if (field === "useGlobalSideRail") {
          return {
            ...door,
            useGlobalSideRail: value,
            sideRailWidth: !value && !door.sideRailWidth ? settings.sideRailWidth : door.sideRailWidth,
            sideRailThickness: !value && !door.sideRailThickness ? settings.sideRailThickness : door.sideRailThickness,
          };
        }

        return { ...door, [field]: value };
      }),
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans">
      <Toaster position="top-right" />

      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm p-6 mb-8 print:hidden">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FileText className="text-blue-600" /> Door Specification Input
          </h2>

          <div className="flex items-center gap-2">
            <input 
              type="file" 
              id="loadFile" 
              className="hidden" 
              onChange={handleLoad} 
              accept=".json"
            />

            <label 
              htmlFor="loadFile"
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-300 transition cursor-pointer"
            >
              <FolderOpen size={18} /> Load
            </label>

            <button 
              onClick={handleSave}
              className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition"
            >
              <Save size={18} /> Save
            </button>

            <button 
              onClick={() => window.print()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
            >
              <Printer size={18} /> Print Cut-List
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase">Job Name</label>
            <input 
              className="w-full border-b-2 border-gray-200 focus:border-blue-500 outline-none py-1 text-lg"
              value={jobName} 
              onChange={(event) => setJobName(event.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase">Door Style / Material</label>
            <select 
              className="w-full border-b-2 border-gray-200 focus:border-blue-500 outline-none py-1 text-lg bg-transparent cursor-pointer"
              value={doorType} 
              onChange={(event) => setDoorType(event.target.value)}
            >
              <option value="1 Panel">1 Panel</option>
              <option value="2 Panel">2 Panel</option>
              <option value="3 Panel">3 Panel</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase">Global Side Rail Width</label>
            <DimensionInput
              className="w-full p-1 mt-1 border rounded"
              value={settings.sideRailWidth}
              onChange={(value) => updateSetting("sideRailWidth", value)}
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase">Global Side Rail Thickness</label>
            <DimensionInput
              className="w-full p-1 mt-1 border rounded"
              value={settings.sideRailThickness}
              onChange={(value) => updateSetting("sideRailThickness", value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase">Top Stile Width (in)</label>
            <DimensionInput
              className="w-full p-1 mt-1 border rounded"
              value={settings.topStileWidth}
              onChange={(value) => updateSetting("topStileWidth", value)}
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase">Mid Stile Width (in)</label>
            <DimensionInput
              className="w-full p-1 mt-1 border rounded"
              value={settings.midStileWidth}
              onChange={(value) => updateSetting("midStileWidth", value)}
              disabled={doorType === "1 Panel"}
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase">Bottom Stile Width (in)</label>
            <DimensionInput
              className="w-full p-1 mt-1 border rounded"
              value={settings.botStileWidth}
              onChange={(value) => updateSetting("botStileWidth", value)}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-bold text-gray-700 border-b pb-2">Door List</h3>

          {doors.map((door) => (
            <DoorRow
              key={door.id}
              door={door}
              doorType={doorType}
              onUpdate={updateDoor}
              onRemove={removeDoor}
            />
          ))}

          <button 
            onClick={addDoor}
            className="flex items-center gap-2 text-blue-600 font-medium hover:underline py-2"
          >
            <Plus size={18} /> Add Another Door Size
          </button>
        </div>
      </div>

      <CutListDocument data={data} doorType={doorType} jobName={jobName} />
    </div>
  );
};

export default App;
