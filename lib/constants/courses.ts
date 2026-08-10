export type MacCourse = {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  hasCombination: boolean;
};

export const BA_PROGRAMME_COURSE_NAME = "B.A. Programme";

/** Authoritative MAC course list (UI + seed). */
export const MAC_COURSES: MacCourse[] = [
  {
    id: "ba-programme",
    slug: "ba-programme",
    name: BA_PROGRAMME_COURSE_NAME,
    shortName: "BA Prog",
    hasCombination: true,
  },
  {
    id: "bcom-hons",
    slug: "bcom-hons",
    name: "B.Com. (Hons.)",
    shortName: "B.Com(H)",
    hasCombination: false,
  },
  {
    id: "english-hons",
    slug: "english-hons",
    name: "English (Hons.)",
    shortName: "Eng Hons",
    hasCombination: false,
  },
  {
    id: "hindi-hons",
    slug: "hindi-hons",
    name: "Hindi (Hons.)",
    shortName: "Hindi Hons",
    hasCombination: false,
  },
  {
    id: "bbe",
    slug: "bbe",
    name: "BBE",
    shortName: "BBE",
    hasCombination: false,
  },
  {
    id: "journalism-hons",
    slug: "journalism-hons",
    name: "Journalism (Hons.)",
    shortName: "Journ Hons",
    hasCombination: false,
  },
  {
    id: "political-science-hons",
    slug: "political-science-hons",
    name: "Political Science (Hons.)",
    shortName: "Pol Sc Hons",
    hasCombination: false,
  },
  {
    id: "bsc-mathematical-sciences",
    slug: "bsc-mathematical-sciences",
    name: "B.Sc. Mathematical Sciences",
    shortName: "BSc MS",
    hasCombination: false,
  },
  {
    id: "bsc-physical-sciences",
    slug: "bsc-physical-sciences",
    name: "B.Sc. Physical Sciences",
    shortName: "BSc PS",
    hasCombination: false,
  },
  {
    id: "electronics-hons",
    slug: "electronics-hons",
    name: "Electronics (Hons.)",
    shortName: "Electronics H",
    hasCombination: false,
  },
];

export const MAC_COURSE_NAMES = MAC_COURSES.map((c) => c.name);

export const BA_PROGRAMME_COMBINATIONS = [
  "English + Economics",
  "English + History",
  "English + Mathematics",
  "English + Political Science",
  "Hindi + Economics",
  "Hindi + History",
  "Hindi + Mathematics",
  "Hindi + Political Science",
  "Computer + Economics",
  "Computer + History",
  "Computer + Mathematics",
  "Computer + Political Science",
  "OMSP + Economics",
  "OMSP + History",
  "OMSP + Mathematics",
  "OMSP + Political Science",
] as const;

export const MAC_YEARS = [
  { value: 1, label: "1st Year" },
  { value: 2, label: "2nd Year" },
  { value: 3, label: "3rd Year" },
  { value: 4, label: "4th Year" },
] as const;

/** Legacy DB course names → canonical MAC name (for seed migration). */
export const LEGACY_COURSE_NAME_ALIASES: Record<string, string> = {
  "B.B.E. — Bachelor of Business Economics": "BBE",
  "B.A.(Hons) Business Economics": "BBE",
  "B.A.(Hons.) Business Economics": "BBE",
  "B.A. (Hons) Business Economics": "BBE",
  "B.Com (Hons)": "B.Com. (Hons.)",
};
