import { useMemo, useState } from "react";
import { ChevronDown, FileText, FolderOpen, Plus, Printer, Save, SlidersHorizontal } from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import { calculateData } from "./calculations";
import CutListDocument from "./components/CutListDocument";
import DimensionInput from "./components/DimensionInput";
import DoorRow from "./components/DoorRow";
import { parseFraction } from "./utils";

const DEFAULT_SETTINGS = {
  stileWidth: 5.125,
  stileThickness: 1.75,
  topRailWidth: 5.125,
  middleRailWidth: 6.25,
  bottomRailWidth: 9.125,
  midStileCenter: 36,
  grooveDepth: 1.5,
  tongueLength: 1.5,
  verticalPanelClearance: 0.5,
  horizontalPanelClearance: 0.5,
};

const parseDimension = (value, fallback = 0) => {
  if (value == null || value === "") {
    return fallback;
  }

  const parsedValue = parseFraction(value);
  return Number.isNaN(parsedValue) ? fallback : parsedValue;
};

const createDoor = (settings = DEFAULT_SETTINGS) => ({
  id: Date.now(),
  width: 36,
  height: 96,
  qty: 1,
  useGlobalSideRail: true,
  stileWidth: settings.stileWidth,
  stileThickness: settings.stileThickness,
});

const normalizeSettings = (loadedSettings = {}) => {
  return {
    ...DEFAULT_SETTINGS,
    stileWidth: parseDimension(loadedSettings.stileWidth, DEFAULT_SETTINGS.stileWidth),
    stileThickness: parseDimension(loadedSettings.stileThickness, DEFAULT_SETTINGS.stileThickness),
    topRailWidth: parseDimension(loadedSettings.topRailWidth, DEFAULT_SETTINGS.topRailWidth),
    middleRailWidth: parseDimension(loadedSettings.middleRailWidth, DEFAULT_SETTINGS.middleRailWidth),
    bottomRailWidth: parseDimension(loadedSettings.bottomRailWidth, DEFAULT_SETTINGS.bottomRailWidth),
    midStileCenter: parseDimension(loadedSettings.midStileCenter, DEFAULT_SETTINGS.midStileCenter),
    grooveDepth: parseDimension(loadedSettings.grooveDepth, DEFAULT_SETTINGS.grooveDepth),
    tongueLength: parseDimension(loadedSettings.tongueLength, DEFAULT_SETTINGS.tongueLength),
    verticalPanelClearance: parseDimension(
      loadedSettings.verticalPanelClearance,
      DEFAULT_SETTINGS.verticalPanelClearance,
    ),
    horizontalPanelClearance: parseDimension(
      loadedSettings.horizontalPanelClearance,
      DEFAULT_SETTINGS.horizontalPanelClearance,
    ),
  };
};

const normalizeDoor = (door = {}, settings = DEFAULT_SETTINGS) => {
  const baseDoor = createDoor(settings);

  return {
    id: door.id ?? baseDoor.id,
    qty: Number(door.qty ?? baseDoor.qty) || 0,
    width: parseDimension(door.width, baseDoor.width),
    height: parseDimension(door.height, baseDoor.height),
    useGlobalSideRail: door.useGlobalSideRail !== false,
    stileWidth: parseDimension(door.stileWidth, settings.stileWidth),
    stileThickness: parseDimension(door.stileThickness, settings.stileThickness),
  };
};

const secondaryButtonClassName =
  "bg-stone-100 text-stone-900 border border-stone-300 px-4 py-2 rounded-sm flex items-center gap-2 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-500 transition-colors";
const primaryButtonClassName =
  "bg-[#00A69C] text-white border border-[#00A69C] px-4 py-2 rounded-sm flex items-center gap-2 hover:bg-teal-700 hover:border-teal-700 transition-colors";
const inputLineClassName =
  "w-full border-b-2 border-stone-900 focus:border-[#00A69C] outline-none py-1 text-lg bg-transparent";
const settingsPanelClassName =
  "p-4 bg-white rounded-sm border border-stone-900";
const dimensionInputClassName =
  "w-full p-1 mt-1 border border-stone-900 rounded-sm focus:border-[#00A69C] outline-none";

const SETTING_GROUPS = [
  {
    title: "Stiles",
    fields: [
      { name: "stileWidth", label: "Stile Width" },
      { name: "stileThickness", label: "Stile Thickness" },
    ],
  },
  {
    title: "Rails",
    fields: [
      { name: "topRailWidth", label: "Top Rail Width" },
      { name: "middleRailWidth", label: "Middle Rail Width" },
      { name: "bottomRailWidth", label: "Bottom Rail Width" },
      { name: "midStileCenter", label: "Mid-Stile Center" },
    ],
  },
  {
    title: "Joinery",
    fields: [
      { name: "grooveDepth", label: "Groove Depth" },
      { name: "tongueLength", label: "Tongue Length" },
      { name: "verticalPanelClearance", label: "Vertical Panel Clearance" },
      { name: "horizontalPanelClearance", label: "Horizontal Panel Clearance" },
    ],
  },
];

const App = () => {
  const [doorType, setDoorType] = useState("2 Panel");
  const [jobName, setJobName] = useState("Job Name");
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
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
            stileWidth: !value && !door.stileWidth ? settings.stileWidth : door.stileWidth,
            stileThickness: !value && !door.stileThickness ? settings.stileThickness : door.stileThickness,
          };
        }

        return { ...door, [field]: value };
      }),
    );
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] p-4 md:p-8 font-sans">
      <Toaster position="top-right" />

      <div className="max-w-4xl mx-auto bg-white rounded-sm shadow-sm p-6 mb-8 border border-stone-900 print:hidden print:bg-white print:border-black print:border-2 print:shadow-none">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FileText className="text-[#00A69C]" /> Door Specification Input
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
              className={`${secondaryButtonClassName} cursor-pointer`}
            >
              <FolderOpen size={18} /> Load
            </label>

            <button 
              onClick={handleSave}
              className={secondaryButtonClassName}
            >
              <Save size={18} /> Save
            </button>

            <button 
              onClick={() => window.print()}
              className={primaryButtonClassName}
            >
              <Printer size={18} /> Print Cut-List
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-xs font-semibold text-stone-900 uppercase">Job Name</label>
            <input 
              className={inputLineClassName}
              value={jobName} 
              onChange={(event) => setJobName(event.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-900 uppercase">Door Style / Material</label>
            <select 
              className={`${inputLineClassName} cursor-pointer`}
              value={doorType} 
              onChange={(event) => setDoorType(event.target.value)}
            >
              <option value="1 Panel">1 Panel</option>
              <option value="2 Panel">2 Panel</option>
              <option value="3 Panel">3 Panel</option>
            </select>
          </div>
        </div>

        <div className="mb-6">
          <button
            type="button"
            className={secondaryButtonClassName}
            aria-expanded={isSettingsOpen}
            onClick={() => setIsSettingsOpen((currentValue) => !currentValue)}
          >
            <SlidersHorizontal size={18} /> Settings
            <ChevronDown
              size={16}
              className={`transition-transform ${isSettingsOpen ? "rotate-180" : ""}`}
            />
          </button>

          {isSettingsOpen && (
            <div className={`mt-3 space-y-5 ${settingsPanelClassName}`}>
              {SETTING_GROUPS.map((group) => (
                <section key={group.title}>
                  <h3 className="mb-3 border-b border-stone-900 pb-1 text-xs font-bold uppercase text-stone-900">
                    {group.title}
                  </h3>
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    {group.fields.map((field) => (
                      <div key={field.name}>
                        <label className="block text-[10px] font-bold text-stone-900 uppercase">
                          {field.label}
                        </label>
                        <DimensionInput
                          className={dimensionInputClassName}
                          value={settings[field.name]}
                          onChange={(value) => updateSetting(field.name, value)}
                        />
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="font-bold text-stone-900 border-b border-stone-900 pb-2">Door List</h3>

          {doors.map((door) => (
            <DoorRow
              key={door.id}
              door={door}
              onUpdate={updateDoor}
              onRemove={removeDoor}
            />
          ))}

          <button 
            onClick={addDoor}
            className="flex items-center gap-2 text-[#00A69C] font-medium hover:text-teal-700 py-2 transition-colors"
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
