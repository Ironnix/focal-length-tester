import type { FieldId } from "./fields";

export interface DistancePreset {
  id: string;
  label: string;
  /** Metres from the camera to the subject. */
  distance: number;
  /** Ground drawn under the scene; the camera stands at its near end. */
  field: FieldId;
  note: string;
}

export const DISTANCE_PRESETS: DistancePreset[] = [
  { id: "portrait", label: "Portrait", distance: 1.5, field: "none", note: "close portrait" },
  { id: "room", label: "Across a room", distance: 4, field: "none", note: "living room" },
  { id: "penalty", label: "Penalty spot", distance: 11, field: "football", note: "goal line → spot" },
  { id: "street", label: "Across a street", distance: 15, field: "none", note: "two lanes + walks" },
  { id: "tennis", label: "Tennis court", distance: 23.77, field: "tennis", note: "baseline → baseline" },
  { id: "basketball", label: "Basketball court", distance: 28, field: "basketball", note: "baseline → baseline" },
  { id: "half-pitch", label: "Half a pitch", distance: 52.5, field: "football", note: "goal line → centre spot" },
  { id: "rink", label: "Ice hockey rink", distance: 60, field: "hockey", note: "end boards → end boards" },
  { id: "pitch", label: "Football pitch", distance: 105, field: "football", note: "goal line → goal line" },
  { id: "airshow", label: "Air show", distance: 400, field: "none", note: "crowd line → display line" },
  { id: "km", label: "1 km", distance: 1000, field: "none", note: "far away" },
];
