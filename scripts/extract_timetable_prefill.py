#!/usr/bin/env python3
"""Extract SEC/VAC odd-semester timetable slots from MAC PDF exports for group-link prefill."""

from __future__ import annotations

import json
import re
import unicodedata
from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path

from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
CATALOG_PATH = ROOT / "prisma/data/papers-official.json"
OUT_JSON = ROOT / "lib/data/timetable-prefill-2026-odd.json"
OUT_REPORT = ROOT / "docs/timetable-prefill-report.md"

DEFAULT_PDFS = [
    Path.home() / "Downloads/secodd2026.pdf",
    Path.home() / "Downloads/vacodd2026.pdf",
    Path.home() / "Downloads/ge 2026.pdf",
]

SLOT_RE = re.compile(
    r"(?:LAB_|L_)(\d+)\.\s*"
    r"([A-Z]{3})-(SEC|VAC|GE)_([^_]+?)_(.+?)-([A-Z]{2,4}_[A-Z0-9]+)_+"
)

GE_SLOT_RE = re.compile(
    r"(?:LAB_|L_|T_)(\d+)\.\s*"
    r"([A-Z]{2,4})-(GE\d)_((?:[A-Z]{2,4}_)?[A-Z0-9&]+?)_(.+?)-([A-Z]{2,4}_[A-Z0-9]+)_+"
)

GE_SLOT_INLINE_RE = re.compile(
    r"LAB_([A-Z]{2,4})-(GE\d)_((?:[A-Z]{2,4}_)?[A-Z0-9&]+?)_(.+?)-([A-Z]{2,4}_[A-Z0-9]+)_+"
)

DAY_BLOCKS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
TIMES = [
    "8:30 AM",
    "9:30 AM",
    "10:30 AM",
    "11:30 AM",
    "12:30 PM",
    "1:00 PM",
    "2:00 PM",
    "3:00 PM",
    "4:00 PM",
]


def parse_slot_tail(tail: str) -> tuple[str | None, str]:
    """Return (sectionLabel, room) from the middle part before teacher code."""
    if tail.startswith("LAB-"):
        return None, tail[4:]
    if tail.startswith("P_A-"):
        return "A", tail[4:]
    if tail.startswith("A_P-"):
        return "A", tail[4:]
    if re.match(r"^[A-Z]+_B_L-", tail):
        return "B", tail.split("-", 1)[1]
    if re.match(r"^[A-Z]+_A_L-", tail):
        return "A", tail.split("-", 1)[1]
    if re.match(r"^[A-Z]+_A_P-", tail):
        return "A", tail.split("-", 1)[1]
    if re.match(r"^[A-Z]+_B_P-", tail):
        return "B", tail.split("-", 1)[1]
    if tail.startswith("P-"):
        rest = tail[2:]
        if rest.startswith("PHYLAB"):
            return None, "PHYLAB"
        return None, rest
    if tail.startswith("T-"):
        return None, tail[2:]
    if tail.startswith("L-"):
        return None, tail[2:]
    if "-" in tail:
        left, right = tail.rsplit("-", 1)
        sec = left.replace("P_", "").replace("_P", "").strip("_") or None
        if sec in ("P", "L", "T", "LAB"):
            sec = None
        return sec, right
    return None, tail

LEGEND_RE = re.compile(
    r"([A-Z]{2,4}_[A-Z0-9]+)-([^,(]+?)\((?:DR\.|PROF\.|MR\.|MS\.|MRS\.)\)\(([^)]*)\)",
    re.S,
)

# Timetable course-code suffix → catalogue paper name (odd sem official list).
SEC_CODE_TO_NAME: dict[str, str] = {
    "MTSLB": "Latex typesetting for beginners",
    "NF": "Network Flows",
    "DP": "Dairy Processing",
    "HSFC": "Healthy & Sustainable Food Choices",
    "RM": "Patkatha Lekhan",
    "PL": "Patkatha Lekhan",
    "RL": "Rachnatmak Lekhan",
    "PLC": "Political Leadership and Communication",
    "NL": "Negotiation and Leadership",
    "LSE": "Life Skill Education",
    "PDC": "Personality Development and Communication",
    "PFP": "Personal Financial Planning",
    "DM": "Digital Marketing",
    "FFE": "Finance for Everyone",
    "DSPB": "Developing Sustainability Plans for a Business",
    "I&E": "Innovation and Entrepreneurship",
    "AST": "Advanced Spreadsheet tools",
    "BIT": "Basic IT tools",
    "ITSDA1": "IT Skills and Data Analysis 1",
    "DT": "Design thinking",
    "PP": "fundamentals of python programming",
    "CPL": "Communication in Professional Life",
    "PSEL": "Public Speaking in English Language and Leadership",
    "CIEL": "Communication in Everyday Life",
    "CW": "Creative Writings",
    "SE&E": "Sustainable Ecotourism and Entrepreneurship",
    "CDMC": "Content Development and media for children",
    "WWP": "Working with People",
    "PEWSD": "Prospecting ewaste for sustainability",
    "PHORO": "Practices in Horoscope – 1",
    "MC&T-1": "Mushroom Culture and Technology-1",
}

VAC_CODE_TO_NAME: dict[str, str] = {
    "VM-1": "Vedic Mathematics-I",
    "DE": "Digital Empowerment",
    "EI": "Emotional Intelligence",
    "C&C": "Culture and Communication",
    "SSC": "साहित्य, संस्कृति और सिनेमा",
    "BBPM": "भारतीय भक्ति परम्परा और मानव मूल्य",
    "FI": "Fit India",
    "E&V": "Ethics and Values in Ancient Indian Traditions",
    "SB": "Swachh Bharat",
    "G&E": "Gandhi and Education",
    "CVFD": "Constitutional Values and Fundamental Duties",
    "FL": "Financial Literacy",
    "E&L": "Ecology and Literature",
    "S&EL": "Social and Emotional Learning",
    "EC": "Ethics and Culture",
}


def norm(s: str) -> str:
    s = unicodedata.normalize("NFKD", s or "")
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = re.sub(r"[^a-z0-9]+", " ", s.lower()).strip()
    return re.sub(r"\s+", " ", s)


def clean_room(room: str) -> str:
    room = room.replace("COLLEGE GROUND", "College Ground").replace("COLLEGEGROUND", "College Ground")
    return room.strip()


def parse_legend(text: str) -> dict[str, dict[str, object]]:
    out: dict[str, dict[str, object]] = {}
    for code, name, titles_raw in LEGEND_RE.findall(text):
        code = code.strip()
        name = re.sub(r"\s+", " ", name.strip())
        titles = [
            re.sub(r"\s+", " ", t.strip())
            for t in re.split(r",\s*", titles_raw.replace("\n", " "))
            if t.strip()
        ]
        out[code] = {"teacherName": name, "titles": titles}
    return out


def split_day_blocks(text: str, slot_re: re.Pattern[str]) -> list[tuple[str | None, list[tuple]]]:
    text = re.sub(r"Welcome Your IP Address.*?\n", "", text)
    text = re.sub(r"Principal Convener.*", "", text, flags=re.DOTALL)
    anchor = r"(?=LAB_1\.)" if slot_re is SLOT_RE else r"(?=L_1\.)"
    parts = re.split(anchor, text)
    start_prefix = "LAB_1." if slot_re is SLOT_RE else "L_1."
    parts = [p for p in parts if p.startswith(start_prefix)]
    if not parts:
        return [(None, slot_re.findall(text))]
    if len(parts) == 5:
        day_labels = DAY_BLOCKS
    elif len(parts) == 4:
        day_labels = DAY_BLOCKS[:4]
    else:
        day_labels = [DAY_BLOCKS[i % len(DAY_BLOCKS)] for i in range(len(parts))]
    return list(zip(day_labels, [slot_re.findall(p) for p in parts]))


def catalogue_name_for_code(paper_type: str, code: str) -> str | None:
    if paper_type == "SEC":
        return SEC_CODE_TO_NAME.get(code)
    if paper_type == "VAC":
        return VAC_CODE_TO_NAME.get(code)
    return None


def clean_timetable_title(title: str) -> str:
    t = re.sub(r"\s+", " ", title.replace("\n", " ")).strip()
    t = re.sub(r"_(L|T|P|LAB)(,.*)?$", "", t, flags=re.I)
    t = re.sub(r"_+", " ", t)
    return t.strip()


def match_catalogue_name(
    paper_type: str, code: str, timetable_title: str, cat_names: list[str]
) -> str | None:
    direct = catalogue_name_for_code(paper_type, code)
    if direct and direct in cat_names:
        return direct
    nt = norm(clean_timetable_title(timetable_title))
    for name in cat_names:
        if norm(name) == nt:
            return name
    for name in cat_names:
        nn = norm(name)
        if nt in nn or nn in nt:
            return name
    tw = set(nt.split())
    best: str | None = None
    best_score = 0
    for name in cat_names:
        nw = set(norm(name).split())
        score = len(tw & nw)
        if score >= 3 and score > best_score:
            best_score = score
            best = name
    if paper_type == "GE" and not best:
        for name in cat_names:
            nw = set(norm(name).split())
            score = len(tw & nw)
            if score >= 2 and score > best_score:
                best_score = score
                best = name
    return best


def title_from_legend(legend: dict, teacher_code: str) -> str:
    titles = legend.get(teacher_code, {}).get("titles", [])
    if isinstance(titles, list) and titles:
        return str(titles[0])
    return ""


@dataclass
class SlotRow:
    paper_type: str
    course_code: str
    code: str
    section_name: str | None
    teacher_name: str | None
    actual_class_room: str
    day: str | None
    start_time: str | None
    end_time: str | None
    timetable_title: str


def is_ge_timetable(text: str) -> bool:
    if re.search(r"Department\s*:\s*GE\b", text):
        return bool(re.search(r"-GE\d_", text))
    return bool(re.search(r"-GE\d_", text))


def extract_pdf(path: Path) -> tuple[str, list[SlotRow], dict]:
    text = "\n".join((page.extract_text() or "") for page in PdfReader(str(path)).pages)
    header = re.search(r"Department\s*:\s*(\w+)", text)
    header_label = header.group(1) if header else "?"

    if header_label == "VAC" and "geodd" in path.name.lower():
        return "VAC_SKIP", [], {}

    if is_ge_timetable(text):
        return extract_ge_pdf(text)

    paper_type = header_label
    if paper_type not in ("SEC", "VAC", "GE"):
        if "-SEC_" in text:
            paper_type = "SEC"
        elif "-VAC_" in text:
            paper_type = "VAC"
    legend = parse_legend(text)
    rows: list[SlotRow] = []
    for day, slots in split_day_blocks(text, SLOT_RE):
        for lab_no, dept, ptype, code, tail, tcode in slots:
            if ptype != paper_type:
                continue
            section_name, room = parse_slot_tail(tail)
            lab_i = int(lab_no)
            start = TIMES[lab_i - 1] if 1 <= lab_i <= len(TIMES) else None
            end = TIMES[lab_i] if 1 <= lab_i < len(TIMES) else None
            tt_title = title_from_legend(legend, tcode) or f"{dept}-{ptype}_{code}"
            teacher = legend.get(tcode, {}).get("teacherName")
            teacher_name = teacher if isinstance(teacher, str) else None
            rows.append(
                SlotRow(
                    paper_type=ptype,
                    course_code=f"{dept}-{ptype}_{code}",
                    code=code,
                    section_name=section_name,
                    teacher_name=teacher_name,
                    actual_class_room=clean_room(room),
                    day=day,
                    start_time=start,
                    end_time=end,
                    timetable_title=tt_title,
                )
            )
    return paper_type, rows, legend


def extract_ge_pdf(text: str) -> tuple[str, list[SlotRow], dict]:
    legend = parse_legend(text)
    rows: list[SlotRow] = []

    def add_row(
        lab_no: str,
        dept: str,
        ge_level: str,
        code: str,
        tail: str,
        tcode: str,
        day: str | None,
    ) -> None:
        section_name, room = parse_slot_tail(tail)
        lab_i = int(lab_no) if lab_no.isdigit() else 1
        start = TIMES[lab_i - 1] if 1 <= lab_i <= len(TIMES) else None
        end = TIMES[lab_i] if 1 <= lab_i < len(TIMES) else None
        tt_title = title_from_legend(legend, tcode) or f"{dept}-{ge_level}_{code}"
        teacher = legend.get(tcode, {}).get("teacherName")
        teacher_name = teacher if isinstance(teacher, str) else None
        rows.append(
            SlotRow(
                paper_type="GE",
                course_code=f"{dept}-{ge_level}_{code}",
                code=code,
                section_name=section_name,
                teacher_name=teacher_name,
                actual_class_room=clean_room(room),
                day=day,
                start_time=start,
                end_time=end,
                timetable_title=tt_title,
            )
        )

    for day, slots in split_day_blocks(text, GE_SLOT_RE):
        for lab_no, dept, ge_level, code, tail, tcode in slots:
            add_row(lab_no, dept, ge_level, code, tail, tcode, day)

    for dept, ge_level, code, tail, tcode in GE_SLOT_INLINE_RE.findall(text):
        add_row("1", dept, ge_level, code, tail, tcode, None)

    return "GE", rows, legend


def aggregate(rows: list[SlotRow]) -> list[dict]:
    grouped: dict[tuple, dict] = {}
    for r in rows:
        key = (
            r.paper_type,
            r.code,
            r.section_name or "",
            r.teacher_name or "",
            r.actual_class_room,
        )
        g = grouped.get(key)
        if not g:
            g = {
                "paperType": r.paper_type,
                "courseCode": r.course_code,
                "code": r.code,
                "sectionName": r.section_name,
                "teacherName": r.teacher_name,
                "actualClassRoom": r.actual_class_room,
                "timetableTitle": r.timetable_title,
                "days": set(),
                "startTimes": set(),
                "endTimes": set(),
            }
            grouped[key] = g
        if r.day:
            g["days"].add(r.day)
        if r.start_time:
            g["startTimes"].add(r.start_time)
        if r.end_time:
            g["endTimes"].add(r.end_time)

    out: list[dict] = []
    for g in grouped.values():
        days = sorted(g["days"], key=lambda d: DAY_BLOCKS.index(d) if d in DAY_BLOCKS else 99)
        starts = sorted(g["startTimes"], key=lambda t: TIMES.index(t) if t in TIMES else 99)
        ends = sorted(g["endTimes"], key=lambda t: TIMES.index(t) if t in TIMES else 99)
        out.append(
            {
                "paperType": g["paperType"],
                "courseCode": g["courseCode"],
                "code": g["code"],
                "sectionName": g["sectionName"],
                "teacherName": g["teacherName"],
                "actualClassRoom": g["actualClassRoom"],
                "timetableTitle": g["timetableTitle"],
                "days": ", ".join(days) if days else None,
                "startTime": starts[0] if len(starts) == 1 else (", ".join(starts) if starts else None),
                "endTime": ends[0] if len(ends) == 1 else (", ".join(ends) if ends else None),
            }
        )
    return out


def main() -> None:
    import sys

    paths = [Path(p) for p in sys.argv[1:]] if len(sys.argv) > 1 else DEFAULT_PDFS
    catalog = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    cat_by_type: dict[str, list[str]] = defaultdict(list)
    for p in catalog:
        if p.get("semesterNumber") in (1, 3, 5, 7):
            cat_by_type[p["paperType"]].append(p["paperName"])

    all_rows: list[SlotRow] = []
    sources: list[str] = []
    skipped: list[str] = []
    for path in paths:
        if not path.is_file():
            print("skip missing", path)
            continue
        ptype, rows, _ = extract_pdf(path)
        if ptype == "VAC_SKIP":
            skipped.append(
                f"{path.name} — header says VAC (same content as vacodd2026.pdf); "
                "use `ge 2026.pdf` for Generic Elective (GE)."
            )
            continue
        sources.append(f"{path.name} ({ptype}, {len(rows)} slots)")
        all_rows.extend(rows)

    aggregated = aggregate(all_rows)
    prefill: list[dict] = []
    unmatched_timetable: list[dict] = []
    matched_catalogue: set[tuple[str, str]] = set()

    for row in aggregated:
        ptype = row["paperType"]
        cat = match_catalogue_name(
            ptype, row["code"], row["timetableTitle"], cat_by_type.get(ptype, [])
        )
        entry = {**row, "cataloguePaperName": cat}
        prefill.append(entry)
        if cat:
            matched_catalogue.add((ptype, cat))
        else:
            unmatched_timetable.append(entry)

    # Timetable papers with no catalogue match
    missing_in_catalogue: list[dict] = []
    seen_tt: set[tuple[str, str]] = set()
    for row in unmatched_timetable:
        key = (row["paperType"], row["code"])
        if key in seen_tt:
            continue
        seen_tt.add(key)
        missing_in_catalogue.append(
            {
                "paperType": row["paperType"],
                "courseCode": row["courseCode"],
                "timetableTitle": row["timetableTitle"],
                "teacherSample": row.get("teacherName"),
            }
        )

    # Catalogue odd-sem SEC/VAC not appearing in timetable PDFs
    not_in_timetable: dict[str, list[str]] = {}
    for ptype in ("SEC", "VAC", "GE"):
        in_cat = set(cat_by_type.get(ptype, []))
        in_tt = {name for t, name in matched_catalogue if t == ptype}
        not_in_timetable[ptype] = sorted(in_cat - in_tt)

    payload = {
        "academicYear": "2026-27",
        "semesterNote": "Odd semester timetable exports (SEC, VAC, GE PDFs)",
        "sources": sources,
        "skippedFiles": skipped,
        "prefill": prefill,
        "missingInCatalogue": missing_in_catalogue,
        "catalogueNotInTimetable": not_in_timetable,
    }

    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    lines = [
        "# Timetable prefill extraction report",
        "",
        "## Sources",
        *[f"- {s}" for s in sources],
        "",
        "## Note on geodd2026.pdf",
        "`geodd2026.pdf` is **not** the GE timetable — the PDF header says **VAC** (duplicate of `vacodd2026.pdf`).",
        "For **Generic Elective (GE) odd 2026–27**, use **`ge 2026.pdf`** in Downloads (Department: GE, slots like `POL-GE8_…`).",
        "",
    ]
    if skipped:
        lines.append("## Skipped files")
        lines.extend(f"- {s}" for s in skipped)
        lines.append("")
    lines.extend(
        [
            f"## Prefill rows: {len(prefill)}",
            f"## Timetable course codes not matched to catalogue: {len(missing_in_catalogue)}",
            "",
        ]
    )
    for item in missing_in_catalogue:
        lines.append(
            f"- **{item['paperType']}** `{item['courseCode']}` — {item['timetableTitle']}"
        )
    lines.extend(["", "## Catalogue papers not seen in these timetables", ""])
    for ptype in ("SEC", "VAC", "GE"):
        lines.append(f"### {ptype} ({len(not_in_timetable[ptype])})")
        for name in not_in_timetable[ptype][:40]:
            lines.append(f"- {name}")
        if len(not_in_timetable[ptype]) > 40:
            lines.append(f"- … and {len(not_in_timetable[ptype]) - 40} more")
        lines.append("")

    OUT_REPORT.parent.mkdir(parents=True, exist_ok=True)
    OUT_REPORT.write_text("\n".join(lines), encoding="utf-8")
    print("Wrote", OUT_JSON)
    print("Wrote", OUT_REPORT)
    print("Unmatched timetable codes:", len(missing_in_catalogue))


if __name__ == "__main__":
    main()
