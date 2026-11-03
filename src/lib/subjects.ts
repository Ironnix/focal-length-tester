import type { ShapeId } from "./shapes";

export interface Subject {
  id: string;
  name: string;
  /** Size across the frame, in metres. */
  width: number;
  height: number;
  /** Extent along the line of sight (only used by the top view). */
  depth: number;
  shape: ShapeId;
  /** Shown under the name in the picker. */
  note?: string;
  custom?: boolean;
}

export const SUBJECT_GROUPS: { name: string; subjects: Subject[] }[] = [
  {
    name: "People",
    subjects: [
      { id: "person", name: "Person", width: 0.5, height: 1.75, depth: 0.3, shape: "person", note: "standing, 1.75 m" },
      { id: "child", name: "Child", width: 0.36, height: 1.2, depth: 0.22, shape: "person", note: "about 6 years" },
      { id: "headshot", name: "Headshot", width: 0.48, height: 0.45, depth: 0.28, shape: "bust", note: "head & shoulders" },
    ],
  },
  {
    name: "Animals",
    subjects: [
      { id: "cat", name: "Cat", width: 0.55, height: 0.32, depth: 0.14, shape: "cat", note: "side view" },
      { id: "dog", name: "Dog", width: 1.05, height: 0.75, depth: 0.3, shape: "dog", note: "labrador, side" },
      { id: "horse", name: "Horse", width: 2.4, height: 2.3, depth: 0.6, shape: "horse", note: "side view" },
      { id: "bird", name: "Small bird", width: 0.15, height: 0.095, depth: 0.05, shape: "bird", note: "sparrow" },
      { id: "eagle", name: "Eagle in flight", width: 2.1, height: 0.65, depth: 0.85, shape: "eagle", note: "2.1 m wingspan" },
    ],
  },
  {
    name: "Vehicles",
    subjects: [
      { id: "car", name: "Car", width: 4.7, height: 1.45, depth: 1.85, shape: "car", note: "sedan, side" },
      { id: "motorcycle", name: "Motorcycle", width: 2.1, height: 1.15, depth: 0.8, shape: "motorcycle", note: "side view" },
      { id: "bus", name: "Bus", width: 12, height: 3.2, depth: 2.55, shape: "bus", note: "city bus, side" },
      { id: "smallplane", name: "Small plane", width: 8.3, height: 2.7, depth: 11, shape: "smallplane", note: "Cessna 172" },
      { id: "airliner", name: "Airliner", width: 37.6, height: 11.8, depth: 35.8, shape: "airliner", note: "A320, side" },
    ],
  },
  {
    name: "Other",
    subjects: [{ id: "house", name: "House", width: 10, height: 8, depth: 9, shape: "house", note: "two storeys" }],
  },
];

export const PRESET_SUBJECTS: Subject[] = SUBJECT_GROUPS.flatMap((g) => g.subjects);

/** Shape used for the "scale reference" person standing next to the subject. */
export const REFERENCE_PERSON = PRESET_SUBJECTS[0]!;
