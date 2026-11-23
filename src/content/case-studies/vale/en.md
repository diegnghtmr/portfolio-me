---
project: vale
summary: >-
  Students use Vale to compare course sections, build a weekly timetable without overlaps, and export it to a personal calendar.
role: Sole developer
timeframe: "2025"
demo:
  url: https://vale-sage.vercel.app/
demonstration:
  kind: screenshots
  screenshots:
    - src: ./shots/weekly-schedule.png
      alt: Weekly calendar with 12 color-coded meetings for seven courses and buttons to export to iCal or CSV.
      caption: Seven courses in a fictional computing timetable, ready to export.
    - src: ./shots/event-details.png
      alt: Data Structures meeting details showing Monday from 08:00 to 10:00, classroom B-204, four credits and a lab note.
      caption: Selecting a meeting reveals its section, room and notes without leaving the calendar.
    - src: ./shots/import-courses.png
      alt: Import panel with the bundled 2025 S2 preview selected, a JSON or CSV drop zone and two sections of the same course.
      caption: The bundled preview loads into the course list, where a name search narrows it to two Data Structures sections.
decisions:
  - question: Where should course records be saved?
    options:
      - label: Call an HTTP API
        reason: A server could share records across devices but would need a deployment and a way to associate records with each student.
      - label: Use a browser storage adapter behind the API interface
        reason: Course reads and writes go through the same interface without requiring a server or sign-in.
        chosen: true
    consequence: Imported course records survive a reload in the same browser, but the app does not synchronize records across devices.
    evidence:
      - label: API interface and browser storage implementation
        url: https://github.com/diegnghtmr/vale/blob/f90ef546f748c3341873938e89d08ecb5183ceca/src/services/api.ts
  - question: What should happen when a section overlaps with the timetable?
    options:
      - label: Warn but add the section
        reason: Students could compare overlapping alternatives on the grid, but the same selection would also be available for export.
      - label: Check before adding the section
        reason: Compare time intervals on the same day and report the first overlap before changing the selection.
        chosen: true
    consequence: An overlapping section stays in the course list and out of the calendar. Back-to-back meetings are allowed.
    evidence:
      - label: Conflict check and calendar selection
        url: https://github.com/diegnghtmr/vale/blob/f90ef546f748c3341873938e89d08ecb5183ceca/src/App.tsx
      - label: Time-interval comparison
        url: https://github.com/diegnghtmr/vale/blob/f90ef546f748c3341873938e89d08ecb5183ceca/src/utils/schedule.ts
  - question: Should progress be tracked per section or per subject?
    options:
      - label: Use the section ID
        reason: Each group can have a separate status, but changing groups requires recording completion again.
      - label: Use a key derived from the subject name
        reason: The key normalizes spelling differences such as case and accents and ignores the group and semester.
        chosen: true
    consequence: Completing Calculus I applies to both sections in the sample, and the dashboard counts them as one subject. Distinct subjects with the same normalized name also share a status.
    evidence:
      - label: Subject key normalization
        url: https://github.com/diegnghtmr/vale/blob/f90ef546f748c3341873938e89d08ecb5183ceca/src/utils/subjectId.ts
      - label: Completion state across sections
        url: https://github.com/diegnghtmr/vale/blob/f90ef546f748c3341873938e89d08ecb5183ceca/src/hooks/useCourses.ts
      - label: Subject and credit counts
        url: https://github.com/diegnghtmr/vale/blob/f90ef546f748c3341873938e89d08ecb5183ceca/src/components/Dashboard.tsx
results:
  - label: Jest suite
    detail: All 22 checks passed locally across schedule overlap, subject identifiers and credit calculation.
  - label: Calendar conflict and export
    detail: The browser rejected an overlapping Computer Networks section. Both downloads still contained the 12 meetings selected before the attempt.
  - label: Completion across sections
    detail: Marking one Calculus I section complete removed both groups from the available list. The dashboard reported four of 11 distinct subjects complete in the fictional dataset.
limitations:
  - Calendar export covers a single week and does not generate a recurring series for the semester.
---

## Problem

Students planning a semester need to compare sections of the same course before choosing a timetable. A section can meet on more than one day, and swapping a group to fix a Monday clash can introduce a new one on Wednesday. A course list can show the room, credits and times for each section, but it does not show how those meetings fit together over a week.

Vale separates the available sections from the ones a student wants on the calendar. Students can compare options without committing to a group, then take the selected week into the calendar they already use. They can also track completed subjects without counting alternative groups twice.

## How it works

The React app runs in the browser. Students can enter a section, import a JSON or CSV file, or select a bundled academic period. File uploads are validated before they replace the course list. The period loader translates the bundled data’s Spanish day and shift values to the same format as manually entered sections. A mock API implements course reads and writes using `localStorage` rather than HTTP.

The list can be narrowed by name, semester, shift and credits. When a student adds a section to the timetable, the app compares each meeting with those already selected. Overlaps are checked on the same day, and a conflict message names both courses and shows their time slots. FullCalendar renders the selected meetings on a weekly grid. The calendar opens room and credit details on click, and the export buttons generate iCalendar and CSV files in the browser.

Each section has its own record ID, while completion is stored by a separate key derived from the subject name. When the student imports another list, the app uses that key to reapply the completion state to matching subjects. The dashboard groups sections by the same key before counting subjects and credits.
