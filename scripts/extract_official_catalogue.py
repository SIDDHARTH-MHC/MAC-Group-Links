#!/usr/bin/env python3
"""Extract MAC official paper catalogue from reference PDFs into papers-official.json."""

from __future__ import annotations

import json
import re
from collections import Counter, defaultdict
from dataclasses import asdict, dataclass, field
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REF = ROOT / "prisma/data/reference"
OUT_JSON = ROOT / "prisma/data/papers-official.json"
OUT_REPORT = ROOT / "docs/catalogue-extraction-report.md"

SEM1_PDF = "Optional Paper List Sem 1.pdf"
SEM357_PDF = "SEM 3,5,7 (1).pdf"


@dataclass
class Eligibility:
    course: str | None = None
    year: int | None = None
    combination: str | None = None
    notes: str | None = None
    appliesToAll: bool = False


@dataclass
class PaperEntry:
    semesterNumber: int
    paperType: str
    paperName: str
    department: str | None
    departmentRoom: str | None = None
    seatCapacity: int | None = None
    dseNumber: str | None = None
    prerequisite: str | None = None
    eligibilities: list[Eligibility] = field(default_factory=list)
    eligibilityNotes: str | None = None
    sourceDocument: str = ""
    sourcePage: int = 0
    sourceText: str | None = None
    needsReview: bool = False
    reviewNote: str | None = None


def seats(name: str) -> tuple[str, int | None]:
    m = re.search(r"\((\d+)\s*seats?\)", name, re.I)
    if m:
        cap = int(m.group(1))
        clean = re.sub(r"\s*\(\d+\s*seats?\)", "", name, flags=re.I).strip()
        return clean, cap
    return name.strip(), None


def dept_block(dept: str, room: str | None) -> tuple[str, str | None]:
    d = dept.strip()
    r = room.strip() if room else None
    aliases = {
        "journalism": ("Journalism", "Media Lab"),
        "chemistry (chemistry lab)": ("Chemistry", "Chemistry Lab"),
        "chemistry": ("Chemistry", "Chemistry Lab"),
        "biology (biology lab)": ("Biology", "Biology Lab"),
        "electronics": ("Electronics", "331"),
        "other": ("Other", None),
    }
    key = d.lower()
    if key in aliases:
        return aliases[key]
    if r and r.lower() in ("media lab", "chemistry lab", "biology lab"):
        return d, r.title() if "lab" in r.lower() else r
    return d, r


def add(entries: list[PaperEntry], e: PaperEntry) -> None:
    entries.append(e)


def parse_sem1(entries: list[PaperEntry]) -> None:
    doc, page = SEM1_PDF, 1

    sec_rows = [
        ("English", "125", "Creative Writings (60 seats)"),
        ("English", "125", "Communication in Everyday Life (60 seats)"),
        ("Business Economics", "336", "Personality Development and Communication (60 seats)"),
        ("Economics", "232", "IT Skills and Data Analysis 1 (60 seats)"),
        ("Economics", "232", "Basic IT tools (60 seats)"),
        ("Economics", "232", "Advanced Spreadsheet tools (30 seats)"),
        ("Journalism", "Media Lab", "Content Development and media for children (40 seats)"),
        ("Hindi", "131", "Patkatha Lekhan (30 seats)"),
        ("Hindi", "131", "Rachnatmak Lekhan (30 seats)"),
        ("Mathematics", "231", "Latex typesetting for beginners (60 seats)"),
        ("Mathematics", "231", "Network Flows (60 seats)"),
        ("Political Science", "126", "Political Leadership and Communication (60 seats)"),
        ("Political Science", "126", "Negotiation and Leadership (60 seats)"),
        ("Commerce", "130", "Finance for Everyone (40 seats)"),
        ("Electronics", "331", "Design thinking (60 seats)"),
        ("Electronics", "331", "Basic IT tools (60 seats)"),
        ("Electronics", "331", "fundamentals of python programming (60 seats)"),
        ("Physics", "113", "Basic IT tools (60 seats)"),
        ("Physics", "113", "Practices in Horoscope – 1 (60 seats)"),
        ("Physics", "113", "Prospecting ewaste for sustainability (60 seats)"),
        ("Chemistry", "26", "Dairy Processing (60 seats)"),
    ]
    for dept, room, raw in sec_rows:
        name, cap = seats(raw)
        d, r = dept_block(dept, room)
        add(
            entries,
            PaperEntry(
                1,
                "SEC",
                name,
                d,
                r,
                cap,
                sourceDocument=doc,
                sourcePage=page,
                sourceText=raw,
            ),
        )

    add(
        entries,
        PaperEntry(
            1,
            "SEC",
            "Not offered for Semester 1",
            "Computer Science",
            "218",
            sourceDocument=doc,
            sourcePage=page,
            needsReview=True,
            reviewNote="PDF lists this under Computer Science SEC; not a student paper offering.",
        ),
    )

    vac_rows = [
        ("English", "125", "Ecology and Literature (60 seats)"),
        ("English", "125", "Emotional Intelligence (60 seats)"),
        ("Hindi", "131", "भारतीय भक्ति परम्परा और मानव मूल्य (60 seats)"),
        ("Hindi", "131", "साहित्य, संस्कृति और सिनेमा (60 seats)"),
        ("Mathematics", "231", "Vedic Mathematics-I (60 seats)"),
        ("Political Science", "126", "Ethics and Values in Ancient Indian Traditions (60 seats)"),
        ("Political Science", "126", "Constitutional Values and Fundamental Duties (30 seats)"),
        ("Political Science", "126", "Swachh Bharat (60 seats)"),
        ("Physics", "113", "Vedic Mathematics 1 (60 seats)"),
        ("Physical Education", "22", "Fit India (60 seats)"),
    ]
    for dept, room, raw in vac_rows:
        name, cap = seats(raw)
        d, r = dept_block(dept, room)
        add(
            entries,
            PaperEntry(
                1,
                "VAC",
                name,
                d,
                r,
                cap,
                sourceDocument=doc,
                sourcePage=page,
                sourceText=raw,
            ),
        )

    add(
        entries,
        PaperEntry(
            1,
            "AEC",
            "Environmental Science (EVS)",
            "Environmental Science",
            None,
            eligibilities=[
                Eligibility(notes="For B.A.Prog."),
                Eligibility(notes="For B.Com.(H)"),
                Eligibility(notes="For B.A.(Hons.) business economics"),
            ],
            eligibilityNotes="Environmental Science (EVS) for B.A.Prog., B.Com.(H), B.A.(Hons.) business economics",
            sourceDocument=doc,
            sourcePage=page,
        ),
    )
    add(
        entries,
        PaperEntry(
            1,
            "AEC",
            "Hindi",
            "Hindi",
            "131",
            eligibilities=[Eligibility(notes="For rest of the courses")],
            eligibilityNotes="Hindi for rest of the courses. Option available for students who have no knowledge of Hindi.",
            sourceDocument=doc,
            sourcePage=page,
        ),
    )

    ge_note = (
        "Department Generic Elective (GE) for Semester 1 (only for B.A.Prog. Eng+Maths, "
        "Eng+Pol.Sc., Hindi+Maths, Hindi+Pol.Sc. and other Hons. And B.Sc.Prog courses)"
    )
    ge_rows = [
        ("English", "125", "Indian English Literatures"),
        ("Business Economics", "336", "Principles of Microeconomics"),
        ("Computer Science", "218", "Object Oriented Programming using C++"),
        ("Economics", "232", "Principles of Microeconomics 1"),
        ("History", "232", "Delhi through Ages"),
        ("Hindi", "131", "Hindi Cinema aur uska addhyan"),
        ("Journalism", "Media Lab", "Basics of Journalism"),
        ("Mathematics", "231", "Fundamental of calculus"),
        ("Physical Education", "22", "Fitness and wellness"),
        ("Political Science", "126", "Ideas in Indian Political Thought"),
        ("Political Science", "126", "Governance: Issues and Challenges"),
        ("Commerce", "130", "Business Organization"),
        ("Physics", "113", "Electricity and Magnetism"),
    ]
    for dept, room, name in ge_rows:
        d, r = dept_block(dept, room)
        elig_notes = (
            "medium of instruction and exam is in English"
            if name == "Basics of Journalism"
            else None
        )
        add(
            entries,
            PaperEntry(
                1,
                "GE",
                name,
                d,
                r,
                eligibilities=[Eligibility(notes=ge_note)],
                eligibilityNotes=elig_notes,
                sourceDocument=doc,
                sourcePage=2,
                sourceText=name,
            ),
        )


def parse_sem357(entries: list[PaperEntry]) -> None:
    doc = SEM357_PDF

    def sec(
        sem: int,
        dept: str,
        room: str | None,
        name: str,
        page: int = 1,
        ptype: str = "SEC",
        **kw,
    ):
        d, r = dept_block(dept, room)
        add(
            entries,
            PaperEntry(
                semesterNumber=sem,
                paperType=ptype,
                paperName=name,
                department=d,
                departmentRoom=r,
                sourceDocument=doc,
                sourcePage=page,
                seatCapacity=kw.get("seatCapacity"),
                eligibilityNotes=kw.get("eligibilityNotes"),
                prerequisite=kw.get("prerequisite"),
                dseNumber=kw.get("dseNumber"),
                eligibilities=kw.get("eligibilities") or [],
                needsReview=kw.get("needsReview", False),
                reviewNote=kw.get("reviewNote"),
            ),
        )

    for name in [
        "Communication in Everyday Life",
        "Communication in Professional Life",
        "Public Speaking in English Langauge and Leadership",
    ]:
        sec(3, "English", "125", name)
        sec(5, "English", "125", name)
    sec(7, "English", "125", "Creative Writing")

    sec(3, "Journalism", "Media Lab", "Content Development and Media for Children")
    sec(5, "Journalism", "Media Lab", "Content Development and Media for Children")

    for name in [
        "Personality development and communication",
        "Life Skill Education",
        "Personal Financial Planning",
    ]:
        sec(3, "Business Economics", "336", name)
        sec(5, "Business Economics", "336", name)

    for name in ["IT Skills and Data Analysis 1", "Basic IT Tools", "Advanced Spreadsheet Tools"]:
        sec(3, "Economics", "232", name)
        sec(5, "Economics", "232", name)

    sec(3, "History", "232", "Sustainable Ecotourism and Entrepreneurship")
    sec(5, "History", "232", "Sustainable Ecotourism and Entrepreneurship")

    for name in ["Rangmanch", "Patkatha Lekhan", "Rachnatmak Lekhan"]:
        sec(3, "Hindi", "131", name)
        sec(5, "Hindi", "131", name)

    for name in ["Latex typesetting for beginners", "Network Flows"]:
        sec(3, "Mathematics", "231", name)
        sec(5, "Mathematics", "231", name)

    for name in ["Political Leadership and Communication", "Negotiation and Leadership"]:
        sec(3, "Political Science", "126", name)
        sec(5, "Political Science", "126", name)

    for name in [
        "Innovation and Entrepreneurship",
        "Developing Sustainability Plans for a Business",
        "Finance for Everyone",
        "Digital Marketing",
    ]:
        sec(3, "Commerce", "130", name)
        sec(5, "Commerce", "130", name)

    sec(
        3,
        "Chemistry",
        "Chemistry Lab",
        "Healthy & Sustainable Food Choices",
        eligibilityNotes="Eligibility : 12th with PCM/PCB",
    )
    sec(
        3,
        "Chemistry",
        "Chemistry Lab",
        "Dairy Processing",
        eligibilityNotes="Eligibility : 12th with PCM/PCB",
    )
    sec(
        5,
        "Chemistry",
        "Chemistry Lab",
        "Dairy Processing",
        eligibilityNotes="Eligibility : 12th with PCM/PCB",
    )

    for name in ["Basic IT Tools", "Statistical Software package", "Prospecting E-waste for Sustainability"]:
        sec(3, "Physics", "113", name)
        sec(5, "Physics", "113", name)
    sec(3, "Physics", "113", "Practices in horoscope 1", eligibilityNotes="Eligibility : 12th with PCM/PCB")
    sec(5, "Physics", "113", "Practices in horoscope 1", eligibilityNotes="Eligibility : 12th with PCM/PCB")
    sec(5, "Physics", "113", "Dairy Processing", eligibilityNotes="Eligibility : 12th with PCM/PCB")

    sec(7, "Physics", "113", "Document Preparation and Presentation Software")

    sec(3, "Biology", "Biology Lab", "Mushroom Cultivation and Technology 1")
    sec(5, "Biology", "Biology Lab", "Mushroom Cultivation and Technology 1")

    sec(3, "Other", None, "Working with People")
    sec(5, "Other", None, "Practices in Horoscopes -1")

    for name in [
        "Conduct of Elections in India: Voters, Candidates and Campaigns",
        "Your laws, Your Rights",
        "Public Opinion and Survey Research",
    ]:
        sec(7, "Political Science", "126", name)

    # VAC semester 3 — page 2
    vac3 = [
        ("English", "125", "Culture and Communication"),
        ("English", "125", "Ecology and Literature"),
        ("English", "125", "Emotional Intelligence"),
        ("English", "125", "Social and Emotional Learning"),
        ("Hindi", "131", "Bharatiya Bhakti Parampara aur maanav mulya"),
        ("Hindi", "131", "Sahitya Sanskriti aur Cinema"),
        ("Mathematics", "231", "Vedic Mathematics-I"),
        ("Mathematics", "231", "Vedic Mathematics-II"),
        ("Mathematics", "231", "Vedic Mathematics-III"),
        ("Physical Education", "22", "Fit India"),
        ("Political Science", "126", "Swachh Bharat"),
        ("Political Science", "126", "Ethics and Values in Ancient Indian Tradition"),
        ("Political Science", "126", "Gandhi and Education"),
        ("Political Science", "126", "Constitutional Values and Fundamental Duties"),
        ("Commerce", "130", "Financial Literacy"),
        ("Commerce", "130", "Digital Empowerment"),
        ("Physics", "113", "Vedic Mathematics-I"),
        ("Physics", "113", "Vedic Mathematics-II"),
        ("Physics", "113", "Digital Empowerment"),
        ("Other", None, "Ethics and Culture"),
    ]
    for dept, room, name in vac3:
        d, r = dept_block(dept, room)
        prereq = None
        if "Vedic Mathematics-II" in name:
            prereq = "must studied Vedic Mathematics-I"
        add(
            entries,
            PaperEntry(
                3,
                "VAC",
                name,
                d,
                r,
                prerequisite=prereq,
                sourceDocument=doc,
                sourcePage=2,
            ),
        )

    add(
        entries,
        PaperEntry(
            1,
            "VAC",
            "Vedic Mathematics-I (1st sem only note)",
            "Mathematics",
            "231",
            needsReview=True,
            reviewNote="PDF VAC-I note: Only for 1st sem — listed on Sem 3 VAC page.",
            sourceDocument=doc,
            sourcePage=2,
        ),
    )

    ge_triples = [
        (3, 5, 7, "English", "125", "Readings on Indian Diversities and Literary Movements", "Literature and Human Rights (B.A.Prog. only)", "Language and Culture"),
        (3, 5, 7, "English", "125", "Dystopian Writings (courses other than B.A.Pr)", None, "Indian English Literatures"),
        (3, 5, 7, "Business Economics", "336", "Economics of Start-up", "Economic Policy Framework", "International Economics"),
        (3, 5, 7, "Computer Science", "218", "Database Management System", "Advance Web Programming (Basic knowledge of HTML required)", None),
        (3, 5, 7, "Economics", "232", "Theory of Public Finance", "Essentials of Economics", "Money and Banking"),
        (3, 5, 7, "Economics", "232", None, "Basic Development Theory (for Hons.)", "Principles of Microeconomics 2"),
        (3, 5, 7, "History", "232", "Politics of Nature", "World History", None),
        (3, 5, 7, "Hindi", "131", "Hindi ka Vaishvik Paridreshya", "Hindi Sahitya ka itihas (adhunik Kaal) (for Hons.)", "Hindi Sahitya ka itihas (bhag-1) (for Hons.)"),
        (3, 5, 7, "Hindi", "131", None, "Pravasi Hindi Sahitya (for B.A.Prog.)", "Paper 1 (for B.A.Prog)"),
        (3, 5, 7, "Journalism", "Media Lab", "Television Journalism", "Basics of Photography", "Web Journalism"),
        (3, 5, 7, "Mathematics", "231", "Differential Equation", "Elementary Mathematical Analysis", "Applied Algebra"),
        (3, 5, 7, "Physical Education", "22", "Olympic Education", "Lifestyle Management through Physical Education", "Introduction of Sports Training"),
        (3, 5, 7, "Political Science", "126", "Western Political Philosophy", "Digital Social Sciences", "Introduction to Public Policy"),
        (3, 5, 7, "Political Science", "126", None, None, "Politics of globalization"),
        (3, 5, 7, "Commerce", "130", "Investing in Stock Market (Not a mandatory GE)", "Fundamentals of Human Resource Mgmt. (for hons. Courses only)", "Indian Ethos and Management"),
        (3, 5, 7, "Commerce", "130", "Financial Statement Analysis (Mandatory GE for Minor)", "Marketing for Beginners (For Prog. Courses only)", "E-Commerce"),
        (3, 5, 7, "Electronics", "331", "Artificial Intelligence and Machine Learning (Basic knowledge of Python language)", None, None),
        (3, 5, 7, "Physics", "113", "Modern Physics", "Atomic and Molecular Physics", None),
    ]
    for row in ge_triples:
        sem3, sem5, sem7, dept, room, n3, n5, n7 = row
        for sem, name in [(3, n3), (5, n5), (7, n7)]:
            if not name:
                continue
            d, r = dept_block(dept, room)
            prereq = None
            notes = None
            if "Principles of Microeconomics 2" in name:
                prereq = "should have done Principles of Microeconomics 1"
            if "Basic Development Theory" in name:
                notes = "mandatory for students who are aiming for a Minor degree in Economics"
            if "Financial Statement Analysis" in name:
                notes = "Mandatory GE for Minor; for students who want to minor in commerce and pursue one year M.Com. from Delhi University after 4th year"
            add(
                entries,
                PaperEntry(
                    sem,
                    "GE",
                    name,
                    d,
                    r,
                    prerequisite=prereq,
                    eligibilityNotes=notes,
                    sourceDocument=doc,
                    sourcePage=3,
                ),
            )

    # DSE — extracted from PDF pages 5–7 (column: sem 3 | sem 5 | sem 7)
    dse_entries: list[tuple] = [
        (3, "English", "Literary Theory", None, [Eligibility(notes="For Eng Hons.")]),
        (3, "English", "Literature and Cinema", None, [Eligibility(notes="For Eng Hons.")]),
        (5, "English", "Children Literature", None, [Eligibility(notes="For English (Hons) and B.A.Prog with English")]),
        (5, "English", "Graphic Narratives", None, [Eligibility(notes="For English (Hons) and B.A.Prog with English")]),
        (7, "English", "Research Methodology", "DSE-7.11", [Eligibility(notes="For English (Hons) and B.A.Prog with English")]),
        (7, "English", "Latin American Literature", "DSE-7.22", [Eligibility(notes="For English (Hons) and B.A.Prog with English")]),
        (7, "English", "Contemporary South Asian Literature", "DSE-7.33", [Eligibility(notes="For English (Hons) and B.A.Prog with English")]),
        (7, "English", "Twentieth Century European Fiction", "DSE-7.34", [Eligibility(notes="For English (Hons) and B.A.Prog with English")]),
        (3, "Business Economics", "Entrepreneurship", None, [Eligibility(notes="For BBE Students only")]),
        (5, "Business Economics", "Investment and Portfolio Management", None, [Eligibility(notes="For BBE Students only")]),
        (5, "Business Economics", "Understanding consumer behaviour", None, [Eligibility(notes="For BBE Students only")]),
        (7, "Business Economics", "Development Economics", None, [Eligibility(notes="For BBE Students only")]),
        (7, "Business Economics", "Brand Management", None, [Eligibility(notes="For BBE Students only")]),
        (3, "Computer Science", "Object Oriented Programming using Python", None, [Eligibility(notes="For MS/PS")]),
        (5, "Computer Science", "Machine Learning (Python required)", None, [Eligibility(notes="For MS/PS")]),
        (5, "Computer Science", "Web Design and Development", None, [Eligibility(notes="For B.A.Prog.")]),
        (7, "Computer Science", "Machine Learning (Python required)", "DSE 1(PS/MS)", [Eligibility(notes="For PS/MS")]),
        (7, "Computer Science", "Digital Image Processing", "DSE 2(PS/MS)", [Eligibility(notes="For PS/MS")]),
        (7, "Computer Science", "Cyber Forensics", "DSE 3(PS/MS)", [Eligibility(notes="For PS/MS")]),
        (7, "Computer Science", "Computer Graphics", "DSE 4(PS/MS)", [Eligibility(notes="Knowledge of programming language required; For PS/MS")]),
        (7, "Computer Science", "Digital Image Processing", "DSE 1(B.A Prog.)", [Eligibility(notes="For B.A Prog.")]),
        (7, "Computer Science", "Cyber Forensics", "DSE 2(B.A Prog.)", [Eligibility(notes="For B.A Prog.")]),
        (7, "Computer Science", "Computer Graphics", "DSE 3(B.A Prog.)", [Eligibility(notes="Knowledge of programming language required; For B.A Prog.")]),
        (3, "Economics", "Fiscal policy and Public Finance in India", None, [Eligibility(notes="For B.A.Prog. with Economics")]),
        (3, "Economics", "Digital Economics", None, [Eligibility(notes="For B.A.Prog. with Economics")]),
        (5, "Economics", "Open Economy Macroeconomics", None, [Eligibility(notes="For B.A.Prog. with Economics")]),
        (5, "Economics", "Public Economics", None, [Eligibility(notes="For B.A.Prog. with Economics")]),
        (5, "Economics", "Law and Economics", None, [Eligibility(notes="For B.A.Prog. with Economics")]),
        (5, "Economics", "Advanced Econometrics", None, [Eligibility(notes="For B.A.Prog. with Economics")]),
        (3, "History", "Pre-History and Proto-History", None, [Eligibility(notes="For B.A.Prog. with History")]),
        (3, "Hindi", "Rashtriya Sanskritik Kavyadhara", None, [Eligibility(notes="For Hindi(Hons)")]),
        (3, "Hindi", "Hindi yatra sahitya", None, [Eligibility(notes="For Hindi(Hons)")]),
        (3, "Hindi", "Vibhajan Vibhishika aur Hindi Sahitya", None, [Eligibility(notes="For B.A.Prog.")]),
        (5, "Hindi", "Rachnakar kendrit Adhyayn : Kabir", None, [Eligibility(notes="For Hindi(Hons)")]),
        (5, "Hindi", "Rachnakar kendrit Adhyayn : Aggeya", None, [Eligibility(notes="For Hindi(Hons)")]),
        (5, "Hindi", "Rachnakar kendrit Adhyayn : Tulsidas", None, [Eligibility(notes="For Hindi(Hons)")]),
        (5, "Hindi", "Meera", None, [Eligibility(notes="For B.A.Prog.")]),
        (5, "Hindi", "Harishankar Parsai", None, [Eligibility(notes="For B.A.Prog.")]),
        (5, "Hindi", "Krishna Sobati", None, [Eligibility(notes="For B.A.Prog.")]),
        (3, "Journalism", "Folk media and communication", None, [Eligibility(notes="For Journ(H) only")]),
        (3, "Journalism", "Visual communication", None, [Eligibility(notes="For Journ(H) only")]),
        (3, "Journalism", "Media, Polity and Democracy", None, [Eligibility(notes="For Journ(H) only")]),
        (3, "Journalism", "Investigative Journalism", None, [Eligibility(notes="For Journ(H) only")]),
        (3, "Mathematics", "Theory of Equations and symmetries", None, [Eligibility(notes="Maths DSE (MS, PS)")]),
        (3, "Mathematics", "Time Series Analysis and Index Number", None, [Eligibility(notes="Statistics DSE (MS, PS)")]),
        (5, "Mathematics", "Mathematical Python", None, [Eligibility(notes="MS, PS, BA(P)")]),
        (7, "Mathematics", "Advanced Linear Algebra", "DSE1", [Eligibility(notes="MS, PS, BA(P)")]),
        (7, "Mathematics", "Elements of metric space", "DSE2", [Eligibility(notes="MS, PS, BA(P)")]),
        (7, "Mathematics", "Research Methodologi/Integral Transform", "DSE3", [Eligibility(notes="MS, PS, BA(P)")]),
        (3, "Political Science", "State Politics in India", None, [Eligibility(notes="For Pol.Sc.(Hons)")]),
        (5, "Political Science", "International Political Economy", None, [Eligibility(notes="For Pol.Sc.(Hons)")]),
        (5, "Political Science", "Understanding Ambedkar", None, [Eligibility(notes="For B.A.Prog. with Political Science")]),
        (5, "Political Science", "Research Methods in Politics", None, [Eligibility(notes="For Political Science hons and program students")]),
        (5, "Political Science", "Contemporary Debates in Indian Politics", None, [Eligibility(notes="For Political Science hons and program students")]),
        (5, "Political Science", "Feminism: Theory and Practice", None, [Eligibility(notes="For Political Science hons")]),
        (5, "Political Science", "Themes in Contemporary Political Theory", None, [Eligibility(notes="For program students")]),
        (5, "Political Science", "Issues in Contemporary Politics", None, [Eligibility(notes="For program students")]),
        (3, "Commerce", "Organisational Behaviour", None, [Eligibility(notes="For B.Com.(Hons)")]),
        (3, "Commerce", "Financial Markets and Institutions", None, [Eligibility(notes="For B.Com.(Hons)")]),
        (3, "Commerce", "Brand Management", None, [Eligibility(notes="For B.Com.(Hons)")]),
        (5, "Commerce", "Organisational Democracy and Industrial Relations", None, [Eligibility(notes="For B.Com.(Hons)")]),
        (5, "Commerce", "Consumer Affair and Sovereignty", None, [Eligibility(notes="For B.Com.(Hons)")]),
        (5, "Commerce", "Auditing", None, [Eligibility(notes="For B.Com.(Hons)")]),
        (3, "Commerce", "Practical Stenography", None, [Eligibility(notes="For B.A.Prog. with OMSP only")]),
        (5, "Commerce", "Business Research Methodology", None, [Eligibility(notes="To be opted by those students who have not studied BRM in VI Semester; B.A.Prog. with OMSP only")]),
        (5, "Commerce", "Performance Management", None, [Eligibility(notes="For B.A.Prog. with OMSP only")]),
        (5, "Commerce", "Entrepreneurship Development", None, [Eligibility(notes="For B.A.Prog. with OMSP only")]),
        (5, "Commerce", "Marketing Research", None, [Eligibility(notes="For B.A.Prog. with OMSP only")]),
        (5, "Commerce", "Personal Tax Planning and Tax Management", None, [Eligibility(notes="For B.A.Prog. with OMSP only")]),
        (7, "Commerce", "Sustainable Development", "BAC: DSC-7", [Eligibility(notes="BAC")]),
        (7, "Commerce", "Typewriting-1", None, [Eligibility(notes="For B.A.Prog. with OMSP only")]),
        (7, "Commerce", "Strategic Office Management", None, [Eligibility(notes="For B.A.Prog. with OMSP only")]),
        (7, "Commerce", "Business Research methodology", "DSE-7.1", [Eligibility(notes="For B.A.Prog. with OMSP only")]),
        (7, "Commerce", "Basics of management", "BAC: DSE", [Eligibility(notes="BAC")]),
        (7, "Commerce", "Business Economics", "BAC: DSE", [Eligibility(notes="BAC")]),
        (7, "Commerce", "Creativity and Innovation", "BAC: DSE", [Eligibility(notes="BAC")]),
        (3, "Chemistry", "Polynuclear Hydrocarbons, Pharmaceutical Compounds, UV-Visible and IR Spectroscopy", None, [Eligibility(notes="For Phys.Sc. with Chemistry")]),
        (5, "Chemistry", "Green Chemistry", None, [Eligibility(notes="For Phys.Sc. with Chemistry")]),
        (7, "Chemistry", "Industrial Chemicals and environment", "DSE1", [Eligibility(notes="For Phys.Sc. with Chemistry")]),
        (7, "Chemistry", "Advanced Stereochemistry", "DSE2", [Eligibility(notes="For Phys.Sc. with Chemistry")]),
        (7, "Chemistry", "Molecular Spectroscopy & Structural Analysis", "DSE3", [Eligibility(notes="For Phys.Sc. with Chemistry")]),
        (7, "Chemistry", "Reactive Intermediates of Organic Chemistry", "Option4", [Eligibility(notes="For Phys.Sc. with Chemistry")]),
        (7, "Chemistry", "Introductory Interfacial Electrochemistry", "Option5", [Eligibility(notes="For Phys.Sc. with Chemistry")]),
        (7, "Chemistry", "Dissertation", "Option6", [Eligibility(notes="For Phys.Sc. with Chemistry")]),
        (3, "Electronics", "Artificial Intelligence and Machine Learning", None, [Eligibility(notes="For Electronics(Hons)")]),
        (5, "Electronics", "Computer Networks", None, [Eligibility(notes="For Electronics(Hons)")]),
        (7, "Electronics", "Advanced Machine Learning", "DSE1", [Eligibility(notes="For Electronics(Hons)")]),
        (7, "Electronics", "Digital Communication System", "DSE2", [Eligibility(notes="For Electronics(Hons)")]),
        (7, "Electronics", "Introduction to Nanoscience", "DSE 3", [Eligibility(notes="For Electronics(Hons)")]),
        (3, "Physics", "Mathematical Physics 1", None, [Eligibility(notes="For Phys.Sc.")]),
        (5, "Physics", "Digital Electronics", None, [Eligibility(notes="For Phys.Sc.")]),
        (5, "Physics", "Research Methodology", None, [Eligibility(notes="For Phys.Sc.")]),
        (7, "Physics", "Classical Dynamics", "DSE 1", [Eligibility(notes="For Phys.Sc.")]),
        (7, "Physics", "Electric Circuit Analysis", "DSE2", [Eligibility(notes="For Phys.Sc.")]),
        (7, "Physics", "Quantum Mechanics", "DSE 3", [Eligibility(notes="For Phys.Sc.")]),
        (7, "Physics", "Advanced Mathematical Physics", "DSE 4", [Eligibility(notes="For Phys.Sc.")]),
        (7, "Physics", "Dissertation", "DSE 5", [Eligibility(notes="For Phys.Sc.")]),
    ]
    for sem, dept, name, dse_no, eligs in dse_entries:
        d, _ = dept_block(dept, None)
        add(
            entries,
            PaperEntry(
                sem,
                "DSE",
                name,
                d,
                None,
                dseNumber=dse_no,
                eligibilities=eligs,
                sourceDocument=doc,
                sourcePage=5 if sem == 3 else 6 if sem == 5 else 7,
            ),
        )


def serialize(entries: list[PaperEntry]) -> list[dict]:
    out = []
    for e in entries:
        row = asdict(e)
        row["eligibilities"] = [asdict(x) for x in e.eligibilities]
        out.append(row)
    return out


def write_report(entries: list[PaperEntry]) -> None:
    by_sem = Counter(e.semesterNumber for e in entries)
    by_type = Counter(e.paperType for e in entries)
    by_dept = Counter(e.department or "(none)" for e in entries)
    review = [e for e in entries if e.needsReview]
    missing_dept = [e for e in entries if not e.department and e.paperType not in ("AEC",)]
    with_prereq = [e for e in entries if e.prerequisite]
    with_seats = [e for e in entries if e.seatCapacity]
    dup_names = defaultdict(list)
    for e in entries:
        dup_names[(e.semesterNumber, e.paperType, e.paperName)].append(e.department)

    lines = [
        "# Catalogue extraction report",
        "",
        "Generated from official PDFs in `prisma/data/reference/`.",
        "",
        "## Sources",
        f"- `{SEM1_PDF}`",
        f"- `{SEM357_PDF}`",
        "",
        "## Totals",
        f"- **Total papers:** {len(entries)}",
        "",
        "### By semester",
    ]
    for sem in sorted(by_sem):
        lines.append(f"- Semester {sem}: {by_sem[sem]}")
    lines.extend(["", "### By paper type"])
    for t in sorted(by_type):
        lines.append(f"- {t}: {by_type[t]}")
    lines.extend(["", "### By department (top 20)"])
    for dept, count in by_dept.most_common(20):
        lines.append(f"- {dept}: {count}")

    lines.extend(["", "## Entries requiring review", f"- Count: {len(review)}"])
    for e in review[:40]:
        lines.append(f"- **{e.paperName}** (sem {e.semesterNumber}, {e.paperType}): {e.reviewNote}")

    lines.extend(
        [
            "",
            "## BA Programme combination chart",
            "- PDF pages 2–4 of Sem 1 list contain a **combination chart** that did not extract as text (likely image).",
            "- Do not infer combination-specific GE rules from this JSON alone; consult the PDF chart.",
            "",
            "## Missing department",
            f"- Count: {len(missing_dept)}",
            "",
            "## Prerequisites captured",
            f"- Count: {len(with_prereq)}",
        ]
    )
    for e in with_prereq:
        lines.append(f"- {e.paperName} (sem {e.semesterNumber}): {e.prerequisite}")

    lines.extend(["", "## Seat capacities (Sem 1 SEC/VAC)", f"- Count: {len(with_seats)}"])

    lines.extend(["", "## Duplicate paper names (same sem/type/name, different departments)"])
    for key, depts in sorted(dup_names.items()):
        if len(depts) > 1 or len(set(depts)) > 1:
            sem, ptype, name = key
            if len(set(depts)) > 1:
                lines.append(f"- Sem {sem} {ptype} **{name}**: {', '.join(str(d) for d in depts)}")

    lines.extend(["", "## Source mapping sample (first 15)"])
    for e in entries[:15]:
        lines.append(
            f"- {e.paperName} → `{e.sourceDocument}` p.{e.sourcePage}"
        )

    OUT_REPORT.parent.mkdir(parents=True, exist_ok=True)
    OUT_REPORT.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> None:
    entries: list[PaperEntry] = []
    parse_sem1(entries)
    parse_sem357(entries)
    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(json.dumps(serialize(entries), indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    write_report(entries)
    print(f"Wrote {len(entries)} entries to {OUT_JSON}")
    print(f"Report: {OUT_REPORT}")


if __name__ == "__main__":
    main()
