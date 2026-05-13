import { ChangeEvent, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, ClipboardCheck, FileInput, History } from "lucide-react";
import { useAuditHistory, useImportTranscript, useRunAudit, useStudentCourses } from "../api/hooks";
import { AuditResultView } from "../components/AuditResultView";
import { MetricTile } from "../components/MetricTile";
import { PageHeader } from "../components/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "../components/States";
import { StatusBadge } from "../components/StatusBadge";
import { formatCredits } from "../lib/status";
import { extractStudentAcademicProfile } from "../lib/transcriptProfile";
import { useAppState } from "../state/AppState";

export function StudentDashboard() {
  const { currentUser, studentProfile } = useAppState();
  const studentName = studentProfile?.studentName || currentUser.name;
  const studentNumber = studentProfile?.studentNumber || currentUser.student_number;

  return (
    <div>
      <PageHeader title="學生端總覽" description="從 transcript 匯入開始，執行畢業審核並查看結果與歷史紀錄。" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile label="目前學生" value={studentName} detail={`學號 ${studentNumber}`} />
        <MetricTile label="User ID" value={currentUser.id} detail="目前後端 API 操作對象" />
        <Link className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:border-navy-200" to="/student/import">
          <FileInput className="mb-3 h-6 w-6 text-navy-700" />
          <p className="font-bold text-navy-900">匯入 Transcript</p>
          <p className="mt-1 text-sm text-slate-500">匯入 NCCU JSON 成績資料</p>
        </Link>
        <Link className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:border-navy-200" to="/student/audit/run">
          <ClipboardCheck className="mb-3 h-6 w-6 text-navy-700" />
          <p className="font-bold text-navy-900">執行畢業審核</p>
          <p className="mt-1 text-sm text-slate-500">依 51 + 4 + 28 + 45 規則計算</p>
        </Link>
      </div>
    </div>
  );
}

export function StudentImportPage() {
  const { currentUser, setStudentProfile, studentProfile } = useAppState();
  const mutation = useImportTranscript(currentUser.id);
  const [fileName, setFileName] = useState("");
  const [parseError, setParseError] = useState("");
  const studentName = studentProfile?.studentName || currentUser.name;

  async function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setParseError("");
    try {
      const text = await file.text();
      const transcript = JSON.parse(text);
      setStudentProfile(extractStudentAcademicProfile(transcript));
      mutation.mutate({ transcript, sourceFilename: file.name });
    } catch (_error) {
      setParseError("JSON 格式無法解析，請確認檔案內容。");
    }
  }

  return (
    <div>
      <PageHeader title="Transcript JSON 匯入" description="前端會先解析本機 JSON，再送到現有後端 transcript import API。" />
      <div className="rounded-lg border border-dashed border-navy-200 bg-white p-8 text-center">
        <FileInput className="mx-auto h-12 w-12 text-navy-700" />
        <p className="mt-4 font-bold text-navy-900">選擇 transcript.json</p>
        <p className="mt-1 text-sm text-slate-500">目前使用者：{studentName} / userId {currentUser.id}</p>
        <label className="mt-5 inline-flex cursor-pointer rounded-md bg-navy-800 px-4 py-3 text-sm font-bold text-white hover:bg-navy-900">
          選擇檔案
          <input className="hidden" type="file" accept="application/json,.json" onChange={onFileChange} />
        </label>
        {fileName ? <p className="mt-3 text-sm text-slate-500">{fileName}</p> : null}
      </div>
      {parseError ? <div className="mt-4"><ErrorState message={parseError} /></div> : null}
      {mutation.isPending ? <div className="mt-4"><LoadingState label="正在匯入 transcript" /></div> : null}
      {mutation.error ? <div className="mt-4"><ErrorState message={mutation.error.message} /></div> : null}
      {mutation.data ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <MetricTile label="匯入課程" value={mutation.data.importedCourses} />
          <MetricTile label="已通過" value={mutation.data.passedCourses} />
          <MetricTile label="修課中" value={mutation.data.inProgressCourses} />
          <MetricTile label="停修" value={mutation.data.withdrawnCourses} />
          <MetricTile label="待確認" value={mutation.data.unresolvedCourseCount} />
        </div>
      ) : null}
    </div>
  );
}

export function StudentCoursesPage() {
  const { currentUser } = useAppState();
  const [keyword, setKeyword] = useState("");
  const courses = useStudentCourses(currentUser.id);
  const rows = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    return (courses.data || []).filter((course) => !normalized
      || course.course_code.toLowerCase().includes(normalized)
      || course.course_name.toLowerCase().includes(normalized));
  }, [courses.data, keyword]);

  return (
    <div>
      <PageHeader
        title="我的修課資料"
        description="資料來源包含 transcript 匯入與管理員人工調整。"
        actions={<input className="rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="搜尋課號或課名" value={keyword} onChange={(event) => setKeyword(event.target.value)} />}
      />
      {courses.isLoading ? <LoadingState /> : null}
      {courses.error ? <ErrorState message={courses.error.message} /> : null}
      {rows.length ? (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
              <tr><th className="px-3 py-2">學年期</th><th className="px-3 py-2">課號</th><th className="px-3 py-2">課名</th><th className="px-3 py-2">學分</th><th className="px-3 py-2">狀態</th><th className="px-3 py-2">來源</th><th className="px-3 py-2">認列</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((course) => (
                <tr key={course.id}>
                  <td className="px-3 py-2">{course.academic_year_semester}</td>
                  <td className="px-3 py-2 font-semibold text-navy-800">{course.course_code}</td>
                  <td className="px-3 py-2">{course.course_name}</td>
                  <td className="px-3 py-2">{formatCredits(course.credits)}</td>
                  <td className="px-3 py-2"><StatusBadge value={course.status} /></td>
                  <td className="px-3 py-2"><StatusBadge value={course.source} /></td>
                  <td className="px-3 py-2"><StatusBadge value={course.recognition_type} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : !courses.isLoading ? <EmptyState title="尚無修課資料" description="請先匯入 transcript JSON。" /> : null}
    </div>
  );
}

export function AuditRunPage() {
  const { currentUser, setLastAuditResult } = useAppState();
  const [academicYear, setAcademicYear] = useState("111");
  const [includeInProgress, setIncludeInProgress] = useState(false);
  const [saveResult, setSaveResult] = useState(true);
  const mutation = useRunAudit();
  const navigate = useNavigate();

  function runAudit() {
    mutation.mutate({ userId: currentUser.id, academicYear, includeInProgress, saveResult }, {
      onSuccess(result) {
        setLastAuditResult(result);
        navigate("/student/audit/result");
      }
    });
  }

  return (
    <div>
      <PageHeader title="執行畢業審核" description="正式結果只採計已通過課程；修課中課程只會出現在預估結果。" />
      <div className="max-w-xl rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4">
          <label className="text-sm font-semibold text-slate-700">學年度
            <select className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" value={academicYear} onChange={(event) => setAcademicYear(event.target.value)}>
              <option value="111">111</option>
              <option value="112">112</option>
              <option value="113">113</option>
              <option value="114">114</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <input type="checkbox" checked={includeInProgress} onChange={(event) => setIncludeInProgress(event.target.checked)} />
            包含修課中課程作為預估
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <input type="checkbox" checked={saveResult} onChange={(event) => setSaveResult(event.target.checked)} />
            儲存審核紀錄
          </label>
          <button className="rounded-md bg-navy-800 px-4 py-3 text-sm font-bold text-white hover:bg-navy-900" onClick={runAudit} disabled={mutation.isPending}>
            {mutation.isPending ? "審核中..." : "執行審核"}
          </button>
        </div>
      </div>
      {mutation.error ? <div className="mt-4"><ErrorState message={mutation.error.message} /></div> : null}
    </div>
  );
}

export function AuditResultPage() {
  const { lastAuditResult, studentProfile } = useAppState();
  return (
    <div>
      <PageHeader title="畢業審核結果" description="依後端 audit engine 回傳資料呈現，不顯示不存在的 GPA 或登入權限指標。" />
      {lastAuditResult ? <AuditResultView result={lastAuditResult} studentProfile={studentProfile} /> : <EmptyState title="尚未執行審核" description="請先前往執行畢業審核頁。" />}
    </div>
  );
}

export function AuditHistoryPage() {
  const { currentUser, setLastAuditResult } = useAppState();
  const history = useAuditHistory(currentUser.id);
  return (
    <div>
      <PageHeader title="我的審核歷史" />
      {history.isLoading ? <LoadingState /> : null}
      {history.error ? <ErrorState message={history.error.message} /> : null}
      {history.data?.rows.length ? (
        <div className="grid gap-3">
          {history.data.rows.map((row) => (
            <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between" key={row.id}>
              <div>
                <p className="font-bold text-navy-900">Audit #{row.id}</p>
                <p className="text-sm text-slate-500">{new Date(row.created_at).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <span>採計 {formatCredits(row.total_credits_earned)} / {formatCredits(row.total_required_credits)}</span>
                <span>{formatCredits(row.progress_percentage)}%</span>
                {row.result_json ? <button className="rounded-md bg-navy-800 px-3 py-2 font-semibold text-white" onClick={() => setLastAuditResult(row.result_json || null)}>載入結果</button> : null}
              </div>
            </div>
          ))}
        </div>
      ) : !history.isLoading ? <EmptyState title="尚無審核歷史" /> : null}
    </div>
  );
}
