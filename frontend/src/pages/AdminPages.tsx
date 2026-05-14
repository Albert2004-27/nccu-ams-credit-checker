import { FormEvent, type ReactNode, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, BookOpen, ChevronDown, ClipboardCheck, Database, FileWarning, History, ListChecks, Route, Sparkles, UserCog } from "lucide-react";
import { useAuditHistory, useAuditHistoryDetail, useCourses, useCreateManualCourse, useDeleteManualCourse, useRequirements, useStudentCourses, useUnresolvedCourses } from "../api/hooks";
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [showGuide, setShowGuide] = useState(false);
  const createManual = useCreateManualCourse(targetUserId);
  const deleteManual = useDeleteManualCourse(targetUserId);
  const courses = useStudentCourses(targetUserId);
  const manualRows = useMemo(() => (courses.data || []).filter((course) => course.source === "MANUAL"), [courses.data]);
  const formKey = `${targetUserId}:${searchParams.toString()}`;

  const examples = [
    {
      title: "情境 A：外文免修 / 通識抵免",
      description: "適用於學生已通過免修檢定，需手動補足畢業學分，但不對應特定必修課。",
      data: {
        courseCode: "MANUAL-WAIVER-FOREIGN",
        courseName: "外國語文免修抵免",
        credits: "3",
        courseCategory: "通識-外文",
        recognitionType: "MANUAL_CREDIT",
        remark: "通過免修考試",
        approvalNote: "依教務處 111-1 核准函辦理"
      }
    },
    {
      title: "情境 B：以「高微」替代「微積分」",
      description: "適用於學生修讀進階課程來抵免基礎必修課，需指定被替代的原始必修課號。",
      data: {
        courseCode: "701002001",
        courseName: "高等微積分（上）",
        credits: "4",
        courseCategory: "系必修",
        recognitionType: "APPROVED_SUBSTITUTION",
        substitutionForCourseCode: "701001001",
        remark: "核准替代必修",
        approvalNote: "系務會議通過進階抵免基礎"
      }
    }
  ];

  function applyExample(data: any) {
    const params = new URLSearchParams();
    Object.entries(data).forEach(([key, value]) => params.set(key, String(value)));
    setSearchParams(params);
    setShowGuide(false);
  }

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
    <div className="space-y-6">
      <PageHeader title="人工調整" description="建立手動修課資料，用於處理抵免、替代必修或特殊認列。" actions={<TargetUserControl />} />
      
      <div className="rounded-3xl border border-blue-100 bg-blue-50/50 p-5 shadow-sm">
        <button 
          onClick={() => setShowGuide(!showGuide)}
          className="flex w-full items-center justify-between font-bold text-navy-900"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            不知道該怎麼填？查看填寫指南與範例
          </div>
          <ChevronDown className={`h-5 w-5 transition-transform ${showGuide ? "rotate-180" : ""}`} />
        </button>
        
        {showGuide && (
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {examples.map((ex, i) => (
              <div key={i} className="flex flex-col justify-between rounded-2xl border border-white bg-white/80 p-4 shadow-sm">
                <div>
                  <h4 className="font-bold text-blue-900">{ex.title}</h4>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">{ex.description}</p>
                </div>
                <button 
                  onClick={() => applyExample(ex.data)}
                  className="mt-4 w-full rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-blue-700"
                >
                  套用此範本
                </button>
              </div>
            ))}
            <div className="rounded-2xl border border-dashed border-blue-200 bg-white/40 p-4 lg:col-span-2">
              <h4 className="text-sm font-bold text-navy-800">重要欄位說明</h4>
              <ul className="mt-2 space-y-1.5 text-xs text-slate-600">
                <li><span className="font-bold text-blue-700">人工認列 (MANUAL_CREDIT)：</span>最常見，用於補足學分。系統會直接把這門課算進指定的類別（如通識、選修）。</li>
                <li><span className="font-bold text-blue-700">核准替代 (APPROVED_SUBSTITUTION)：</span>用於取代特定必修。一定要填寫<span className="underline">替代必修課號</span>。</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      <form className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm" key={formKey} onSubmit={submit}>
        <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <h3 className="font-bold text-navy-900">新增調整資料</h3>
            {searchParams.toString() ? (
              <button 
                type="button"
                className="text-xs font-bold text-red-600 hover:text-red-700" 
                onClick={() => setSearchParams(new URLSearchParams())}
              >
                清除已填資料
              </button>
            ) : null}
          </div>
        </div>
        <div className="grid gap-x-6 gap-y-4 p-6 lg:grid-cols-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">課號
            <input className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-navy-950 focus:border-blue-500 focus:bg-white focus:outline-none" name="courseCode" defaultValue={searchParams.get("courseCode") || ""} placeholder="例如 MANUAL-001" required />
          </label>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">課名
            <input className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-navy-950 focus:border-blue-500 focus:bg-white focus:outline-none" name="courseName" defaultValue={searchParams.get("courseName") || ""} placeholder="例如 外文抵免" required />
          </label>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">學分
            <input className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-navy-950 focus:border-blue-500 focus:bg-white focus:outline-none" name="credits" defaultValue={searchParams.get("credits") || ""} placeholder="3" type="number" step="0.5" required />
          </label>
          
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">認列方式
            <select className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-navy-950 focus:border-blue-500 focus:bg-white focus:outline-none" name="recognitionType" defaultValue={searchParams.get("recognitionType") || "MANUAL_CREDIT"}>
              <option value="MANUAL_CREDIT">人工認列 (General Credit)</option>
              <option value="APPROVED_SUBSTITUTION">核准替代 (Substitute Required)</option>
            </select>
          </label>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">替代必修課號
            <input className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-navy-950 focus:border-blue-500 focus:bg-white focus:outline-none" name="substitutionForCourseCode" defaultValue={searchParams.get("substitutionForCourseCode") || ""} placeholder="例如 701001001" />
          </label>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">課程類別
            <input className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-navy-950 focus:border-blue-500 focus:bg-white focus:outline-none" name="courseCategory" defaultValue={searchParams.get("courseCategory") || "選修"} />
          </label>

          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">學年度
            <input className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-navy-950 focus:border-blue-500 focus:bg-white focus:outline-none" name="academicYear" defaultValue={searchParams.get("academicYear") || "111"} />
          </label>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">學期
            <input className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-navy-950 focus:border-blue-500 focus:bg-white focus:outline-none" name="semester" defaultValue={searchParams.get("semester") || "1"} />
          </label>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">成績
            <input className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-navy-950 focus:border-blue-500 focus:bg-white focus:outline-none" name="score" defaultValue={searchParams.get("score") || "MANUAL"} />
          </label>

          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 lg:col-span-2">審核說明/備註
            <input className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-navy-950 focus:border-blue-500 focus:bg-white focus:outline-none" name="approvalNote" defaultValue={searchParams.get("approvalNote") || ""} placeholder="例如：依系務會議通過..." />
          </label>

          <div className="flex items-end lg:col-span-1">
            <button className="w-full rounded-xl bg-navy-900 py-3 text-sm font-black text-white shadow-lg shadow-blue-950/20 transition hover:-translate-y-0.5 hover:bg-navy-950 active:translate-y-0" disabled={createManual.isPending}>
              {createManual.isPending ? "正在儲存資料..." : "確認新增調整"}
            </button>
          </div>
        </div>
      </form>
      {createManual.error ? <div className="mt-4"><ErrorState message={createManual.error.message} /></div> : null}
      {createManual.data ? <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">✅ 人工調整已成功儲存！</p> : null}
      
      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-serif text-xl font-bold text-navy-900">既有人工調整</h3>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">{manualRows.length} 筆紀錄</span>
        </div>
        {manualRows.length ? (
          <div className="grid gap-3">
            {manualRows.map((row) => (
              <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 md:flex-row md:items-center md:justify-between" key={row.id}>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-black text-navy-900">{row.course_name}</p>
                    <span className="text-xs font-bold text-slate-400">#{row.course_code}</span>
                  </div>
                  <p className="mt-1 text-xs font-bold text-slate-500">
                    {formatCredits(row.credits)} 學分 • {row.course_category} • {row.academic_year_semester}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <StatusBadge value={row.recognition_type} />
                    <StatusBadge value={row.approval_status} />
                  </div>
                </div>
                <button 
                  className="rounded-xl border border-red-100 px-4 py-2 text-xs font-black text-red-600 transition hover:bg-red-50" 
                  onClick={() => { if(confirm("確定要刪除這筆手動紀錄嗎？")) deleteManual.mutate(row.id) }}
                >
                  刪除紀錄
                </button>
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

function displayRuleName(name: string | null, key: string) {
  if (name) return name;
  if (key === "TOTAL_CREDITS_128") return "畢業總學分門檻 (128)";
  if (key === "OTHER_ELECTIVE_CREDITS") return "其他選修總學分要求";
  if (key === "GENERAL_CREDITS") return "通識課程總學分要求";
  return key;
}

type RequirementRuleRow = {
  id: number | string;
  rule_type: string;
  rule_key: string;
  course_name: string | null;
  min_credits: number | string | null;
  credit_cap: number | string | null;
  metadata_json?: {
    acceptedCourseCodes?: string[];
    specialPolicy?: string | null;
  } | null;
};

type RequirementGroupRow = {
  id: number | string;
  group_code: string;
  group_name: string;
  min_credits?: number | string | null;
  min_courses?: number | string | null;
  RequirementRules?: RequirementRuleRow[];
};

function formatCreditsValue(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  return formatCredits(Number(value));
}

function formatGroupThreshold(group: RequirementGroupRow) {
  const parts = [];
  const credits = formatCreditsValue(group.min_credits);
  const courses = group.min_courses === null || group.min_courses === undefined || group.min_courses === "" ? null : String(group.min_courses);
  if (credits !== null) parts.push(`${credits} 學分`);
  if (courses !== null) parts.push(`${courses} 門`);
  return parts.length ? `最低門檻：${parts.join(" / ")}` : "依下方規則檢核";
}

function groupPolicyText(groupCode: string) {
  const policies: Record<string, string[]> = {
    TOTAL: [
      "總畢業學分：128 學分",
      "採計學分由系必修、體育必修、通識課程及其他選修加總。"
    ],
    REQUIRED: [
      "依學生適用學年度，檢核應數系專業必修課程是否完成。",
      "111-112 年度：線性代數為 8 學分。",
      "113 年度起：線性代數改為 6 學分，並新增數學導論 2 學分。",
      "高等微積分、線性代數存在不同課號版本，需納入等價課號認列。"
    ],
    PE: [
      "體育必修：需修滿 4 門",
      "體育課一、二年級共 4 學期必修。"
    ],
    GENERAL: [
      "通識課程：總計 28 學分，超修部分不採計。",
      "語文通識：中國語文 3-6 學分；外國語文 6 學分。",
      "一般通識：人文 3-7、社會 3-7、自然 3-7、資訊 0-3、書院 0-3 學分。",
      "核心通識：須於人文、社會、自然三領域中，至少修讀 2 門不同領域核心通識。",
      "應數系可免修資訊通識，但須以其他一般通識課程補足 28 學分。"
    ],
    ELECTIVE: [
      "其他選修：需修滿 45 學分，國防課程與選修體育課程各最多採計 4 學分。",
      "選修課程用於補足畢業總學分。",
      "需避免通識超修、體育超修或不可採計課程被錯誤算入畢業學分。"
    ]
  };
  return policies[groupCode] || [];
}

function PolicySummaryCard({ title, items, tone }: { title: string; items: string[]; tone: "navy" | "blue" | "green" | "amber" | "purple" }) {
  const toneClass = {
    navy: "border-navy-100 bg-navy-50/60 text-navy-950",
    blue: "border-blue-100 bg-blue-50/70 text-blue-950",
    green: "border-emerald-100 bg-emerald-50/70 text-emerald-950",
    amber: "border-amber-100 bg-amber-50/70 text-amber-950",
    purple: "border-violet-100 bg-violet-50/70 text-violet-950"
  }[tone];

  return (
    <section className={`rounded-2xl border p-4 ${toneClass}`}>
      <h3 className="font-serif text-lg font-bold">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm font-medium leading-6">
        {items.map((item) => (
          <li className="flex gap-2" key={item}>
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-45" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function RulesTable({ rules }: { rules: RequirementRuleRow[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-100">
      <table className="min-w-[880px] divide-y divide-slate-100 text-sm">
        <thead className="bg-slate-50 text-left text-xs font-bold text-slate-500">
          <tr>
            <th className="whitespace-nowrap px-4 py-3">課程或規則</th>
            <th className="whitespace-nowrap px-4 py-3 text-center">應修學分</th>
            <th className="whitespace-nowrap px-4 py-3 text-center">採計上限</th>
            <th className="whitespace-nowrap px-4 py-3">可採計課號</th>
            <th className="whitespace-nowrap px-4 py-3">特殊採認說明</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 bg-white">
          {rules.map((rule) => {
            const metadata = rule.metadata_json || null;
            const acceptedCodes = metadata?.acceptedCourseCodes || [];
            return (
              <tr key={String(rule.id)} className="align-top">
                <td className="whitespace-nowrap px-4 py-3.5 font-bold text-navy-900">
                  {displayRuleName(rule.course_name, rule.rule_key)}
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 text-center font-black text-slate-700">
                  {formatCreditsValue(rule.min_credits) ?? "—"}
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 text-center font-black text-amber-700">
                  {rule.credit_cap !== null && rule.credit_cap !== undefined ? `${formatCredits(Number(rule.credit_cap))} 學分` : "—"}
                </td>
                <td className="px-4 py-3.5">
                  {acceptedCodes.length ? (
                    <div className="flex flex-wrap gap-1.5">
                      {acceptedCodes.map((code) => (
                        <span key={code} className="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">{code}</span>
                      ))}
                    </div>
                  ) : <span className="text-slate-300">—</span>}
                </td>
                <td className="px-4 py-3.5 text-sm font-medium leading-6 text-slate-600">
                  {metadata?.specialPolicy ? metadata.specialPolicy : <span className="text-slate-300">—</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function AdminRequirementsPage() {
  const [year, setYear] = useState("111");
  const requirements = useRequirements(year);
  const groups = (requirements.data?.groups || []) as RequirementGroupRow[];
  return (
    <div className="space-y-6">
      <PageHeader title="畢業規則查詢" description="提供行政人員查閱各學年度畢業門檻、通識與選修採計原則，以及系必修可採認課號。" actions={<select className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold shadow-sm focus:border-blue-500 focus:outline-none" value={year} onChange={(event) => setYear(event.target.value)}><option value="111">111 學年度</option><option value="112">112 學年度</option><option value="113">113 學年度</option><option value="114">114 學年度</option></select>} />
      
      {requirements.isLoading ? <LoadingState /> : null}
      {requirements.error ? <ErrorState message={requirements.error.message} /> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <PolicySummaryCard title="一、必修課程" tone="blue" items={groupPolicyText("REQUIRED")} />
        <PolicySummaryCard title="二、通識課程與體育" tone="green" items={[...groupPolicyText("GENERAL"), ...groupPolicyText("PE")]} />
        <PolicySummaryCard title="三、選修課程" tone="purple" items={groupPolicyText("ELECTIVE")} />
        <PolicySummaryCard title="四、畢業總學分" tone="navy" items={groupPolicyText("TOTAL")} />
      </div>
      
      <div className="space-y-6">
        {groups.map((group) => {
          const rules = group.RequirementRules || [];
          const policyItems = groupPolicyText(group.group_code);
          const shouldShowTable = rules.length > 0 && group.group_code === "REQUIRED";
          return (
            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:border-blue-200" key={String(group.id)}>
              <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-navy-950">{String(group.group_name)}</h3>
                    <p className="mt-1 text-sm font-bold text-slate-500">{formatGroupThreshold(group)}</p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-white px-3 py-1.5 text-xs font-bold text-slate-500 shadow-sm">
                    {rules.length ? `${rules.length} 項明細` : "固定政策檢核"}
                  </div>
                </div>
              </div>
              
              <div className="p-5">
                {shouldShowTable ? (
                  <RulesTable rules={rules} />
                ) : policyItems.length ? (
                  <div className="rounded-2xl border border-slate-100 bg-white p-4">
                    <ul className="space-y-2 text-sm font-medium leading-6 text-slate-700">
                      {policyItems.map((item) => (
                        <li className="flex gap-2" key={item}>
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-navy-300" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    {!rules.length ? <p className="mt-4 rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500">此類規則由系統依固定政策自動檢核，沒有逐條課程明細。</p> : null}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-sm font-bold text-slate-400">此群組目前沒有可顯示的規則說明</p>
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

export function AdminAuditHistoryPage() {
  const { targetUserId } = useAppState();
  const history = useAuditHistory(targetUserId);
  const [selected, setSelected] = useState<number | null>(null);
  
  const rows = useMemo(() => history.data?.rows || [], [history.data?.rows]);
  const latestRow = useMemo(() => rows.reduce<AuditHistoryRow | null>((current, row) => {
    if (!current) return row;
    return row.id > current.id ? row : current;
  }, null), [rows]);
  
  const selectedRow = rows.find((row) => row.id === selected) || latestRow;
  const historyDetail = useAuditHistoryDetail(selectedRow?.id ?? null);
  const result = historyDetail.data?.result_json || null;

  return (
    <div className="space-y-6">
      <PageHeader title="學生審核紀錄" description="載入歷次審核結果，確認人工調整後是否改善缺漏項目。" actions={<TargetUserControl />} />
      
      {history.isLoading ? <LoadingState /> : null}
      {history.error ? <ErrorState message={history.error.message} /> : null}
      
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile label="紀錄數" value={rows.length} detail={`userId ${targetUserId}`} icon={<History className="h-5 w-5" />} />
        <MetricTile label="目前載入" value={selectedRow ? `#${selectedRow.id}` : "尚無"} detail={selectedRow ? new Date(selectedRow.created_at).toLocaleString() : undefined} icon={<ClipboardCheck className="h-5 w-5" />} />
        <MetricTile label="完成率" value={selectedRow ? `${formatCredits(selectedRow.progress_percentage)}%` : "—"} detail="該次審核進度" icon={<Sparkles className="h-5 w-5" />} />
        
        <div className="rounded-2xl border border-navy-200 bg-white p-4 shadow-sm shadow-blue-950/5">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">選擇歷史紀錄</p>
            <ChevronDown className="h-4 w-4 text-slate-300" />
          </div>
          <select 
            className="w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-sm font-bold text-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-100"
            value={selectedRow?.id || ""}
            onChange={(e) => setSelected(Number(e.target.value))}
          >
            {rows.length === 0 && <option value="">尚無紀錄</option>}
            {rows.sort((a, b) => b.id - a.id).map((row) => (
              <option key={row.id} value={row.id}>
                Audit #{row.id} ({new Date(row.created_at).toLocaleDateString()} {new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}) - {formatCredits(row.progress_percentage)}%
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="min-h-[400px]">
        {historyDetail.isLoading ? <LoadingState label="正在載入審核明細" /> : null}
        {historyDetail.error ? <ErrorState message={historyDetail.error.message} /> : null}
        {!historyDetail.isLoading && !historyDetail.error ? (
          result ? <AuditResultView result={result} /> : <EmptyState title={selectedRow ? "這筆紀錄沒有審核明細" : "選擇一筆審核紀錄"} />
        ) : null}
      </div>
    </div>
  );
}
