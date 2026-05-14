# Backend API Spec

Base URL:

```text
http://localhost:3001
```

This backend is scoped to NCCU Applied Mathematics major graduation audit for academic years 111-114.

## Health

### GET `/api/health`

Checks whether the backend server is running.

Response:

```json
{
  "status": "ok"
}
```

## Courses

### GET `/api/courses`

Lists imported course catalog rows from `data/courses.xlsx`.

Query parameters:

```text
year        optional, example: 111
semester    optional
department  optional, partial match
category    optional
keyword     optional, searches course code and course name
limit       optional, default 50, max 200
offset      optional, default 0
```

Example:

```bash
curl 'http://localhost:3001/api/courses?year=111&keyword=線性代數&limit=10'
```

Response shape:

```json
{
  "count": 2,
  "rows": [
    {
      "id": 1,
      "academic_year": 111,
      "semester": "111-1",
      "course_code": "701002001",
      "course_name": "線性代數",
      "credits": "4.0",
      "department": "應用數學系",
      "level": "...",
      "category": "..."
    }
  ]
}
```

### GET `/api/courses/:id`

Fetches one course row by database id.

## Curriculums And Requirements

### GET `/api/curriculums`

Lists seeded Applied Mathematics curriculums.

### GET `/api/curriculums/:year`

Fetches the Applied Mathematics curriculum for one academic year.

Example:

```bash
curl 'http://localhost:3001/api/curriculums/111'
```

### GET `/api/curriculums/:year/requirements`

Fetches curriculum groups and requirement rules.

Example:

```bash
curl 'http://localhost:3001/api/curriculums/113/requirements'
```

Important groups:

```text
TOTAL       128 total graduation credits
REQUIRED    51 Applied Mathematics required credits
PE           4 required PE credits
GENERAL     28 general education credits
ELECTIVE    45 other elective credits
```

## Transcript Import

### POST `/api/transcripts/import`

Imports NCCU transcript JSON into `student_courses`.

Request:

```json
{
  "userId": 1,
  "sourceFilename": "transcript.json",
  "transcript": {}
}
```

Behavior:

```text
1. Reads 課業學習.aboutMe.
2. Reads 課業學習.coursePlan.
3. Reads gradeRecordList.
4. Creates one transcript_imports row.
5. Replaces previous TRANSCRIPT_JSON student_courses for the user.
6. Preserves MANUAL student_courses.
```

Score status mapping:

```text
score >= 60              PASSED
score < 60               FAILED
MANUAL                   PASSED
停修                     WITHDRAWN
成績未到或無成績 / empty  IN_PROGRESS
```

Response:

```json
{
  "importId": 1,
  "userId": 1,
  "studentNumber": "DEMO001",
  "studentName": "示範使用者",
  "coursePlanYear": "111",
  "importedCourses": 71,
  "passedCourses": 59,
  "failedCourses": 0,
  "inProgressCourses": 9,
  "withdrawnCourses": 3,
  "unresolvedCourseCount": 5,
  "unresolvedCourses": []
}
```

## Student Courses

### GET `/api/student-courses?userId=1`

Lists a user's imported and manual student-course rows.

### GET `/api/student-courses/unresolved?userId=1`

Lists imported courses that could not be matched back to `data/courses.xlsx` by academic year, semester, and course code.

These rows have missing `department` or `course_category` and should be reviewed before official use.

Example:

```bash
curl 'http://localhost:3001/api/student-courses/unresolved?userId=1'
```

Response shape:

```json
{
  "count": 5,
  "rows": [
    {
      "course_code": "997093001",
      "course_name": "體育[男女合班]－綜合體適能",
      "department": null,
      "course_category": null
    }
  ],
  "note": "These transcript rows could not be matched to data/courses.xlsx by academic year, semester, and course code. Staff should review them before official use."
}
```

### POST `/api/student-courses`

Creates a manual student-course row. This endpoint is kept as a simple non-admin helper; for staff-approved adjustments prefer `/api/admin/manual-courses`.

Request:

```json
{
  "userId": 1,
  "courseCode": "MANUAL-FOREIGN-001",
  "courseName": "外文抵免",
  "credits": 3,
  "department": "應用數學系",
  "courseCategory": "選修",
  "academicYear": 111,
  "semester": "1",
  "academicYearSemester": "1111",
  "score": "MANUAL",
  "remark": "外文通",
  "recognitionType": "MANUAL_CREDIT",
  "approvalStatus": "APPROVED",
  "approvalSource": "系辦人工調整",
  "approvalNote": "外文通識抵免"
}
```

### DELETE `/api/student-courses/:id`

Deletes one student-course row by id.

## Admin Manual Adjustments

Manual adjustment rows use `source = MANUAL` and are preserved across transcript re-imports.
`score = MANUAL` is treated as `PASSED`, meaning the row represents a staff-approved adjustment that should be counted by the official audit.
For required-course substitutions, set `recognitionType = APPROVED_SUBSTITUTION`, `approvalStatus = APPROVED`, and `substitutionForCourseCode` to the required Applied Mathematics course code being replaced.

Use cases:

```text
foreign-language exemption
ETP substitution
staff-recognized general education credits
special corrections approved by staff
```

### POST `/api/admin/manual-courses`

Creates or updates a manual row for the same user, course code, semester, and source.

Example:

```bash
curl -X POST http://localhost:3001/api/admin/manual-courses \
  -H 'Content-Type: application/json' \
  -d '{
    "userId": 1,
    "courseCode": "MANUAL-FOREIGN-001",
    "courseName": "外文抵免",
    "credits": 3,
    "department": "應用數學系",
    "courseCategory": "選修",
    "academicYear": 111,
    "semester": "1",
    "academicYearSemester": "1111",
    "score": "MANUAL",
    "remark": "外文通",
    "recognitionType": "MANUAL_CREDIT",
    "approvalStatus": "APPROVED",
    "approvalSource": "系辦人工調整",
    "approvalNote": "外文通識抵免"
  }'
```

### PATCH `/api/admin/manual-courses/:id`

Updates a manual row. Transcript rows cannot be updated through this endpoint.

Request can include any of:

```json
{
  "courseName": "外文抵免：大學英文（一）",
  "credits": 3,
  "remark": "外文通"
}
```

### DELETE `/api/admin/manual-courses/:id`

Deletes a manual row. Transcript rows cannot be deleted through this endpoint.

## Audit

### POST `/api/audit/run`

Runs the graduation audit.

Request:

```json
{
  "userId": 1,
  "academicYear": "111",
  "includeInProgress": false,
  "saveResult": true
}
```

Fields:

```text
userId             required
academicYear       required, 111-114
includeInProgress  optional, default false
saveResult         optional, default true
```

Official behavior:

```text
Only PASSED courses count toward official graduation eligibility.
WITHDRAWN, FAILED, and IN_PROGRESS do not count.
```

Projected behavior:

```text
If includeInProgress is true, the response includes projectedResult.
projectedResult may count IN_PROGRESS courses for planning.
The official graduationEligible field still uses only PASSED courses.
```

Persistence behavior:

```text
saveResult=true   saves one audit_results row and returns 201
saveResult=false  does not save history and returns 200
```

Example:

```bash
curl -X POST http://localhost:3001/api/audit/run \
  -H 'Content-Type: application/json' \
  -d '{"userId":1,"academicYear":"111","includeInProgress":false,"saveResult":true}'
```

Response excerpt:

```json
{
  "auditId": 1,
  "saved": true,
  "academicYear": "111",
  "programType": "MAJOR",
  "department": "應用數學系",
  "mode": "OFFICIAL",
  "isProjected": false,
  "progressPercentage": 60.16,
  "graduationEligible": false,
  "totalCredits": {
    "earned": 77,
    "required": 128,
    "missing": 51,
    "source": "CATEGORY_SUM_51_4_28_45",
    "structure": {
      "required": 51,
      "physicalEducation": 4,
      "generalEducation": 28,
      "elective": 45
    }
  },
  "groups": []
}
```

## Audit History

### GET `/api/audit/history?userId=1&limit=20&offset=0`

Returns paginated audit history summaries. It excludes full `result_json` for performance.

### GET `/api/audit/history/:id`

Returns one full audit result, including `result_json`.

## Graduation Rule Summary

The audit engine evaluates:

```text
128 total
= 51 required credits
+ 4 required PE credits
+ 28 general education credits
+ 45 other elective credits
```

The result is for project demonstration and planning. It does not replace official NCCU graduation review.
