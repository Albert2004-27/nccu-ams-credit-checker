# ER Diagram

The original source ER diagram for `courses.xlsx` is copied to:

```text
docs/source-er.pdf
```

System ER relationships:

```mermaid
erDiagram
  users ||--o{ student_courses : has
  users ||--o{ transcript_imports : imports
  users ||--o{ audit_results : receives

  academic_years ||--o{ curriculums : defines
  curriculums ||--o{ requirement_groups : contains
  requirement_groups ||--o{ requirement_rules : contains
  curriculums ||--o{ audit_results : evaluated_by

  transcript_imports ||--o{ audit_results : source_for
  courses ||..o{ student_courses : enriches
  general_courses ||..o{ student_courses : classifies
```

Source-data relationships:

```text
courses:
  semester + course_code is unique.

required_courses:
  year + course_code identifies required-course rows.

general_courses:
  academic_year + course_code identifies versioned general education course labels.

student_courses:
  stores transcript/manual courses plus department, course category, recognition type,
  approval status, substitution target, approval source, and approval note.
```
