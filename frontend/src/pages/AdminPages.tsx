import { FormEvent, type ReactNode, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, BookOpen, ClipboardCheck, Database, FileWarning, History, ListChecks, Route, Sparkles, UserCog } from "lucide-react";
import { useAuditHistory, useCourses, useCreateManualCourse, useDeleteManualCourse, useRequirements, useStudentCourses, useUnresolvedCourses } from "../api/hooks";
import { AuditResultView } from "../components/AuditResultView";
import { MetricTile } from "../components/MetricTile";
import { PageHeader } from "../components/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "../components/States";
import { StatusBadge } from "../components/StatusBadge";
import { buildManualCourseLink, getAdminDashboardStats } from "../lib/adminWorkflow";
import { formatCredits } from "../lib/status";
import { useAppState } from "../state/AppState";
import type { AuditHistoryRow, ManualCoursePayload } from "../types/api";

function TargetUserControl() {
  const { targetUserId, setTargetUserId } = useAppState();
  return (
    <label className="text-sm font-semibold text-slate-700">
      檢視學生 userId
      <input
        className="ml-2 w-24 rounded-md border border-slate-300 px-3 py-2"
        type="number"
        min={1}
        value={targetUserId}
        onChange={(event) => setTargetUserId(Number(event.target.value || 1))}
      />
    </label>
  );
}

function AdminFlowCard({ icon, title, description, to, tone = "navy" }: { icon: ReactNode; title: string; description: string; to: string; tone?: "navy" | "amber" | "emerald" }) {
  const toneClass = {
    navy: "bg-navy-50 text-navy-800 border-navy-100",
    amber: "bg-amber-50 text-amber-800 border-amber-100",
    emerald: "bg-emerald-50 text-emerald-800 border-emerald-100"
  }[tone];

  return (
    <Link className="group rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-navy-200 hover:shadow-md" to={to}>
      <div className={`mb-4 inline-flex rounded-lg border p-3 ${toneClass}`}>
        {icon}
      </div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-bold text-navy-900">{title}</p>
          <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
        </div>
        <ArrowRight className="mt-1 h-4 w-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-navy-700" />
      </div>
    </Link>
  );
}

export function AdminDashboard() {
  const { targetUserId } = useAppState();
  const studentCourses = useStudentCourses(targetUserId);
  const unresolved = useUnresolvedCourses(targetUserId);
  const history = useAuditHistory(targetUserId);
  const stats = useMemo(() => getAdminDashboardStats({
    studentCourses: studentCourses.data || [],
    unresolvedCount: unresolved.data?.count ?? unresolved.data?.rows.length ?? 0,
    auditHistory: history.data?.rows || []
  }), [history.data?.rows, studentCourses.data, unresolved.data?.count, unresolved.data?.rows]);

  return (
    <div>
      <PageHeader title="管理員總覽" description="管理員可檢視指定學生資料，處理待確認課程與人工調整。" actions={<TargetUserControl />} />
      <section className="mb-5 overflow-hidden rounded-lg border border-navy-100 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-navy-700 p-6 text-white">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-100">目前管理對象</p>
              <h2 className="mt-1 text-3xl font-bold">userId {targetUserId}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">先確認 transcript 無法分類的課程，再用人工調整補上認列方式，最後回到審核紀錄檢查結果。</p>
            </div>
            <div className="rounded-lg border border-white/15 bg-white/10 px-4 py-3">
              <p className="text-sm text-blue-100">最新審核完成率</p>
              <p className="mt-1 text-2xl font-bold">{stats.latestProgress === null ? "尚無" : `${formatCredits(stats.latestProgress)}%`}</p>
            </div>
          </div>
        </div>
        <div className="grid gap-4 bg-slate-50 p-5 md:grid-cols-2 xl:grid-cols-4">
          <MetricTile label="修課資料" value={stats.totalCourses} detail={studentCourses.isLoading ? "載入中" : "已匯入/人工資料總數"} icon={<Database className="h-5 w-5" />} />
          <MetricTile label="待確認課程" value={stats.unresolvedCourses} detail="缺少課程分類或需要人工判斷" icon={<FileWarning className="h-5 w-5" />} />
          <MetricTile label="人工調整" value={stats.manualAdjustments} detail="MANUAL student_course rows" icon={<UserCog className="h-5 w-5" />} />
          <MetricTile label="審核紀錄" value={stats.auditRuns} detail="已儲存 audit runs" icon={<History className="h-5 w-5" />} />
        </div>
      </section>
      <div className="grid gap-4 lg:grid-cols-3">
        <AdminFlowCard icon={<ListChecks className="h-5 w-5" />} title="1. 檢查待確認課程" description="找出 transcript 匯入後尚未能分類或需要系辦判斷的課程。" to="/admin/unresolved" tone="amber" />
        <AdminFlowCard icon={<UserCog className="h-5 w-5" />} title="2. 建立人工調整" description="新增抵免、核准替代或人工認列，讓下一次審核能採計。" to="/admin/manual-courses" />
        <AdminFlowCard icon={<ClipboardCheck className="h-5 w-5" />} title="3. 查看審核紀錄" description="載入指定學生最新或歷史審核結果，確認缺漏項目是否改善。" to="/admin/audit-history" tone="emerald" />
      </div>
    </div>
  );
}

export function AdminUnresolvedPage() {
  const { targetUserId } = useAppState();
  const unresolved = useUnresolvedCourses(targetUserId);
  return (
    <div>
      <PageHeader title="待人工確認課程" description="這些 transcript rows 未對應到課程分類，應由管理員確認。" actions={<TargetUserControl />} />
      {unresolved.data?.note ? (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
          {unresolved.data.note}
        </div>
      ) : null}
      <div className="mb-4 grid gap-4 md:grid-cols-3">
        <MetricTile label="待確認數" value={unresolved.data?.count ?? unresolved.data?.rows.length ?? 0} detail={`目前檢視 userId ${targetUserId}`} icon={<FileWarning className="h-5 w-5" />} />
        <AdminFlowCard icon={<UserCog className="h-5 w-5" />} title="人工調整入口" description="若課程可採計，點表格右側可直接帶入課號、課名、學分。" to="/admin/manual-courses" />
        <AdminFlowCard icon={<Route className="h-5 w-5" />} title="處理原則" description="先判斷是否可採計，再選人工認列或核准替代，不直接修改 transcript 原始資料。" to="/admin/requirements" tone="emerald" />
      </div>
      {unresolved.isLoading ? <LoadingState /> : null}
      {unresolved.error ? <ErrorState message={unresolved.error.message} /> : null}
      {unresolved.data?.rows.length ? (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
              <tr><th className="px-3 py-2">學年期</th><th className="px-3 py-2">課號</th><th className="px-3 py-2">課名</th><th className="px-3 py-2">學分</th><th className="px-3 py-2">狀態</th><th className="px-3 py-2">備註</th><th className="px-3 py-2">處理</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {unresolved.data.rows.map((course) => (
                <tr key={course.id}>
                  <td className="px-3 py-2">{course.academic_year_semester}</td>
                  <td className="px-3 py-2 font-semibold text-navy-800">{course.course_code}</td>
                  <td className="px-3 py-2">{course.course_name}</td>
                  <td className="px-3 py-2">{formatCredits(course.credits)}</td>
                  <td className="px-3 py-2"><StatusBadge value={course.status} /></td>
                  <td className="px-3 py-2">{course.remark || "—"}</td>
                  <td className="px-3 py-2">
                    <Link className="inline-flex items-center gap-1 rounded-md bg-navy-800 px-3 py-2 text-xs font-semibold text-white hover:bg-navy-900" to={buildManualCourseLink(course)}>
                      帶入調整
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : !unresolved.isLoading ? <EmptyState title="目前沒有待確認課程" /> : null}
    </div>
  );
}

export function AdminManualCoursesPage() {
  const { targetUserId } = useAppState();
  const [searchParams] = useSearchParams();
  const createManual = useCreateManualCourse(targetUserId);
  const deleteManual = useDeleteManualCourse(targetUserId);
  const courses = useStudentCourses(targetUserId);
  const manualRows = useMemo(() => (courses.data || []).filter((course) => course.source === "MANUAL"), [courses.data]);
  const formKey = `${targetUserId}:${searchParams.toString()}`;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const academicYear = Number(form.get("academicYear") || 111);
    const semester = String(form.get("semester") || "1");
    const payload: ManualCoursePayload = {
      userId: targetUserId,
      courseCode: String(form.get("courseCode") || ""),
      courseName: String(form.get("courseName") || ""),
      credits: Number(form.get("credits") || 0),
      department: String(form.get("department") || "應用數學系"),
      courseCategory: String(form.get("courseCategory") || "選修"),
      academicYear,
      semester,
      academicYearSemester: `${academicYear}${semester}`,
      score: String(form.get("score") || "MANUAL"),
      remark: String(form.get("remark") || ""),
      recognitionType: String(form.get("recognitionType") || "MANUAL_CREDIT") as ManualCoursePayload["recognitionType"],
      approvalStatus: String(form.get("approvalStatus") || "APPROVED") as ManualCoursePayload["approvalStatus"],
      substitutionForCourseCode: String(form.get("substitutionForCourseCode") || ""),
      approvalSource: String(form.get("approvalSource") || "系辦人工調整"),
      approvalNote: String(form.get("approvalNote") || "")
    };
    createManual.mutate(payload);
  }

  return (
    <div>
      <PageHeader title="人工調整" description="建立 MANUAL student_course row，用於抵免、替代必修或人工認列。" actions={<TargetUserControl />} />
      <form className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm" key={formKey} onSubmit={submit}>
        <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="font-bold text-navy-900">新增人工調整</h3>
              <p className="mt-1 text-sm text-slate-500">從待確認課程帶入時，課號、課名、學分與學年期會自動預填。</p>
            </div>
            {searchParams.toString() ? <Link className="text-sm font-semibold text-navy-700 hover:text-navy-900" to="/admin/manual-courses">清除帶入資料</Link> : null}
          </div>
        </div>
        <div className="grid gap-4 p-5 lg:grid-cols-3">
          <label className="text-sm font-semibold text-slate-700">課號
            <input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" name="courseCode" defaultValue={searchParams.get("courseCode") || ""} placeholder="例如 MANUAL-FOREIGN-001" required />
          </label>
          <label className="text-sm font-semibold text-slate-700">課名
            <input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" name="courseName" defaultValue={searchParams.get("courseName") || ""} placeholder="例如 外文抵免" required />
          </label>
          <label className="text-sm font-semibold text-slate-700">學分
            <input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" name="credits" defaultValue={searchParams.get("credits") || ""} placeholder="3" type="number" step="0.5" required />
          </label>
          <label className="text-sm font-semibold text-slate-700">學年度
            <input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" name="academicYear" defaultValue={searchParams.get("academicYear") || "111"} />
          </label>
          <label className="text-sm font-semibold text-slate-700">學期
            <input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" name="semester" defaultValue={searchParams.get("semester") || "1"} />
          </label>
          <label className="text-sm font-semibold text-slate-700">課程分類
            <input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" name="courseCategory" defaultValue="選修" />
          </label>
          <label className="text-sm font-semibold text-slate-700">開課單位
            <input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" name="department" defaultValue="應用數學系" />
          </label>
          <label className="text-sm font-semibold text-slate-700">成績
            <input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" name="score" defaultValue="MANUAL" />
          </label>
          <label className="text-sm font-semibold text-slate-700">備註
            <input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" name="remark" defaultValue={searchParams.get("remark") || ""} placeholder="例如 外文通" />
          </label>
          <label className="text-sm font-semibold text-slate-700">認列方式
            <select className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" name="recognitionType" defaultValue="MANUAL_CREDIT">
              <option value="MANUAL_CREDIT">人工認列</option>
              <option value="APPROVED_SUBSTITUTION">核准替代</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-700">核准狀態
            <select className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" name="approvalStatus" defaultValue="APPROVED">
              <option value="APPROVED">已核准</option>
              <option value="PENDING">待確認</option>
              <option value="REJECTED">已拒絕</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-700">替代必修課號
            <input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" name="substitutionForCourseCode" placeholder="例如 701001001" />
          </label>
          <label className="text-sm font-semibold text-slate-700">核准來源
            <input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" name="approvalSource" defaultValue="系辦人工調整" />
          </label>
          <label className="text-sm font-semibold text-slate-700 lg:col-span-2">審核說明
            <input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" name="approvalNote" placeholder="補充判斷依據或簽核來源" />
          </label>
          <button className="self-end rounded-md bg-navy-800 px-4 py-3 text-sm font-bold text-white hover:bg-navy-900" disabled={createManual.isPending}>
            {createManual.isPending ? "儲存中..." : "儲存人工調整"}
          </button>
        </div>
      </form>
      {createManual.error ? <div className="mt-4"><ErrorState message={createManual.error.message} /></div> : null}
      {createManual.data ? <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">人工調整已儲存，created: {String(createManual.data.created)}</p> : null}
      <div className="mt-6">
        <h3 className="mb-3 font-bold text-navy-900">既有人工調整</h3>
        {manualRows.length ? (
          <div className="grid gap-3">
            {manualRows.map((row) => (
              <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 md:flex-row md:items-center md:justify-between" key={row.id}>
                <div>
                  <p className="font-bold text-navy-900">{row.course_code} {row.course_name}</p>
                  <p className="text-sm text-slate-500">{formatCredits(row.credits)} 學分 / {row.remark || "無備註"}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <StatusBadge value={row.recognition_type} />
                    <StatusBadge value={row.approval_status} />
                  </div>
                </div>
                <button className="rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-700" onClick={() => deleteManual.mutate(row.id)}>刪除</button>
              </div>
            ))}
          </div>
        ) : <EmptyState title="目前沒有人工調整資料" />}
      </div>
    </div>
  );
}

export function AdminCoursesPage() {
  const [params, setParams] = useState({ year: "111", limit: "50", keyword: "" });
  const courses = useCourses(params);
  return (
    <div>
      <PageHeader title="課程查詢" description="查詢由 Excel seed 進資料庫的 course catalog。" />
      <div className="mb-4 flex flex-wrap gap-3">
        <input className="rounded-md border border-slate-300 px-3 py-2" value={params.year} onChange={(event) => setParams({ ...params, year: event.target.value })} placeholder="學年度" />
        <input className="rounded-md border border-slate-300 px-3 py-2" value={params.keyword} onChange={(event) => setParams({ ...params, keyword: event.target.value })} placeholder="課號或課名" />
      </div>
      {courses.isLoading ? <LoadingState /> : null}
      {courses.error ? <ErrorState message={courses.error.message} /> : null}
      {courses.data?.rows.length ? (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
              <tr><th className="px-3 py-2">學期</th><th className="px-3 py-2">課號</th><th className="px-3 py-2">課名</th><th className="px-3 py-2">學分</th><th className="px-3 py-2">系所</th><th className="px-3 py-2">類別</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {courses.data.rows.map((course) => (
                <tr key={course.id}>
                  <td className="px-3 py-2">{course.semester}</td>
                  <td className="px-3 py-2 font-semibold text-navy-800">{course.course_code}</td>
                  <td className="px-3 py-2">{course.course_name}</td>
                  <td className="px-3 py-2">{formatCredits(course.credits)}</td>
                  <td className="px-3 py-2">{course.department || "—"}</td>
                  <td className="px-3 py-2">{course.category || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : !courses.isLoading ? <EmptyState title="查無課程" /> : null}
    </div>
  );
}

export function AdminRequirementsPage() {
  const [year, setYear] = useState("111");
  const requirements = useRequirements(year);
  return (
    <div>
      <PageHeader title="畢業規則查詢" description="查看學年度 curriculum groups 與 requirement rules。" actions={<select className="rounded-md border border-slate-300 px-3 py-2 text-sm" value={year} onChange={(event) => setYear(event.target.value)}><option value="111">111</option><option value="112">112</option><option value="113">113</option><option value="114">114</option></select>} />
      {requirements.isLoading ? <LoadingState /> : null}
      {requirements.error ? <ErrorState message={requirements.error.message} /> : null}
      <div className="space-y-4">
        {requirements.data?.groups.map((group) => {
          const rules = (group.RequirementRules || []) as Array<Record<string, unknown>>;
          return (
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" key={String(group.id)}>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-navy-900">{String(group.group_name)}</h3>
                  <p className="text-sm text-slate-500">{String(group.group_code)} / min credits {String(group.min_credits ?? "—")}</p>
                </div>
                <StatusBadge value={String(group.group_code)} tone="navy" />
              </div>
              {rules.length ? (
                <div className="overflow-hidden rounded-lg border border-slate-200">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                      <tr><th className="px-3 py-2">Rule</th><th className="px-3 py-2">Type</th><th className="px-3 py-2">Credits</th><th className="px-3 py-2">Cap</th><th className="px-3 py-2">Accepted Codes</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rules.map((rule) => {
                        const metadata = rule.metadata_json as { acceptedCourseCodes?: string[]; specialPolicy?: string } | null;
                        return (
                          <tr key={String(rule.id)}>
                            <td className="px-3 py-2">{String(rule.course_name || rule.rule_key)}</td>
                            <td className="px-3 py-2">{String(rule.rule_type)}</td>
                            <td className="px-3 py-2">{String(rule.min_credits ?? "—")}</td>
                            <td className="px-3 py-2">{String(rule.credit_cap ?? "—")}</td>
                            <td className="px-3 py-2">{metadata?.acceptedCourseCodes?.join(", ") || "—"}{metadata?.specialPolicy ? <p className="mt-1 text-xs text-amber-700">{metadata.specialPolicy}</p> : null}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : <p className="text-sm text-slate-500">此群組無明細規則。</p>}
            </section>
          );
        })}
      </div>
    </div>
  );
}

export function AdminAuditHistoryPage() {
  const { targetUserId, setLastAuditResult } = useAppState();
  const history = useAuditHistory(targetUserId);
  const [selected, setSelected] = useState<number | null>(null);
  const latestRow = useMemo(() => (history.data?.rows || []).reduce<AuditHistoryRow | null>((current, row) => {
    if (!current) return row;
    return row.id > current.id ? row : current;
  }, null), [history.data?.rows]);
  const selectedRow = history.data?.rows.find((row) => row.id === selected) || latestRow;
  const result = selectedRow?.result_json || null;
  return (
    <div>
      <PageHeader title="學生審核紀錄" description="管理員可載入指定學生歷次審核結果，確認人工調整後是否改善缺漏項目。" actions={<TargetUserControl />} />
      {history.isLoading ? <LoadingState /> : null}
      {history.error ? <ErrorState message={history.error.message} /> : null}
      <div className="mb-4 grid gap-4 md:grid-cols-3">
        <MetricTile label="紀錄數" value={history.data?.rows.length || 0} detail={`userId ${targetUserId}`} icon={<History className="h-5 w-5" />} />
        <MetricTile label="目前載入" value={selectedRow ? `#${selectedRow.id}` : "尚無"} detail={selectedRow ? new Date(selectedRow.created_at).toLocaleString() : undefined} icon={<ClipboardCheck className="h-5 w-5" />} />
        <MetricTile label="完成率" value={selectedRow ? `${formatCredits(selectedRow.progress_percentage)}%` : "—"} detail="該次審核進度" icon={<Sparkles className="h-5 w-5" />} />
      </div>
      <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
        <div className="space-y-3">
          {history.data?.rows.map((row) => (
            <button className={`block w-full rounded-lg border bg-white p-4 text-left hover:border-navy-200 ${selectedRow?.id === row.id ? "border-navy-300 ring-2 ring-navy-100" : "border-slate-200"}`} key={row.id} onClick={() => {
              setSelected(row.id);
              if (row.result_json) setLastAuditResult(row.result_json);
            }}>
              <div className="flex items-center justify-between gap-3">
                <p className="font-bold text-navy-900">Audit #{row.id}</p>
                {row.result_json ? <StatusBadge value={row.result_json.graduationEligible ? "COMPLETE" : "INCOMPLETE"} /> : null}
              </div>
              <p className="mt-1 text-sm text-slate-500">{new Date(row.created_at).toLocaleString()}</p>
              <p className="mt-2 text-sm">採計 {formatCredits(row.total_credits_earned)} / {formatCredits(row.total_required_credits)}，完成率 {formatCredits(row.progress_percentage)}%</p>
            </button>
          ))}
          {!history.isLoading && !history.data?.rows.length ? <EmptyState title="尚無審核紀錄" /> : null}
        </div>
        <div>{result ? <AuditResultView result={result} /> : <EmptyState title="選擇一筆審核紀錄" />}</div>
      </div>
    </div>
  );
}
