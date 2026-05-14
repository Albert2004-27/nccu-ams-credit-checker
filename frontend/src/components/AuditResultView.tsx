import { AlertTriangle, Award, BookOpenCheck, CheckCircle2, Clock3, FileWarning, GraduationCap, Layers3, Medal, Sparkles, Trophy } from "lucide-react";
import { useState, type ReactNode } from "react";
import { formatCredits } from "../lib/status";
import type { StudentAcademicProfile } from "../lib/transcriptProfile";
import type { AuditGroup, AuditResult } from "../types/api";
import { CreditProgressBar } from "./CreditProgressBar";
import { StatusBadge } from "./StatusBadge";

const GENERAL_BUCKET_DISPLAY_NAMES: Record<string, string> = {
  CHINESE: "中國語文通識課程",
  FOREIGN: "外國語文通識課程",
  HUMANITIES: "人文學通識",
  SOCIAL: "社會科學通識",
  NATURAL: "自然科學通識",
  INFO: "資訊通識",
  COLLEGE: "書院通識"
};

function valueOf(row: Record<string, unknown>, key: string) {
  const value = row[key];
  return value === null || value === undefined || value === "" ? "—" : String(value);
}

function recordsOf(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => item !== null && typeof item === "object" && !Array.isArray(item)) : [];
}

function displayGroupName(group: AuditGroup) {
  return group.groupCode === "GENERAL" ? "通識課程" : group.groupName;
}

function displayGeneralBucketName(bucketCode: string, bucketName: string) {
  return GENERAL_BUCKET_DISPLAY_NAMES[bucketCode] || bucketName;
}

function displayCreditRequirement(minCredits: number, maxCredits: number) {
  if (maxCredits > minCredits) return `${formatCredits(minCredits)}-${formatCredits(maxCredits)}`;
  return formatCredits(minCredits);
}

function displayCoreCourse(course: Record<string, unknown>) {
  const bucketName = String(course.bucketName || course.assignedBucket || "核心領域");
  const courseName = String(course.courseName || course.courseCode || "未命名課程");
  return `${bucketName}：${courseName}`;
}

function groupByCode(result: AuditResult, groupCode: string) {
  return result.groups.find((group) => group.groupCode === groupCode);
}

function percentOf(earned: number, required: number) {
  if (!required) return earned > 0 ? 100 : 0;
  return Math.min(100, Math.max(0, (earned / required) * 100));
}

function displayPercent(value: number) {
  return Number.isInteger(value) ? `${value}%` : `${value.toFixed(1)}%`;
}

function ThinProgressBar({ percent, tone = "blue" }: { percent: number; tone?: "blue" | "green" | "purple" | "gold" }) {
  const safePercent = Math.min(100, Math.max(0, percent));
  const toneClass = {
    blue: "bg-blue-700",
    green: "bg-emerald-600",
    purple: "bg-violet-600",
    gold: "bg-[#C5A059]"
  }[tone];
  return (
    <div className="h-2 rounded-full bg-slate-200">
      <div className={`h-2 rounded-full ${toneClass}`} style={{ width: `${safePercent}%` }} />
    </div>
  );
}

function statusText(isComplete: boolean) {
  return isComplete ? "完成" : "未完成";
}

function StudentProfileItem({ label, value, emphasis = false }: { label: string; value?: string; emphasis?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-sm shadow-blue-950/5">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className={`mt-2 font-bold ${emphasis ? "text-2xl text-navy-950" : "text-base text-navy-900"}`}>{value || "JSON 未提供"}</p>
    </div>
  );
}

function formatRanking(profile: StudentAcademicProfile) {
  if (!profile.ranking) return undefined;
  return profile.rankingPercent ? `${profile.ranking}（前 ${profile.rankingPercent}）` : profile.ranking;
}

function StudentAcademicProfileCard({ profile }: { profile: StudentAcademicProfile }) {
  return (
    <section className="overflow-hidden rounded-3xl border border-amber-100 bg-gradient-to-r from-white via-[#fff8ec] to-blue-50 p-5 shadow-sm shadow-blue-950/5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-navy-900 p-3 text-white shadow-lg shadow-blue-950/20">
            <BookOpenCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-serif text-xl font-bold text-navy-950">學生學籍資訊</h3>
            <p className="text-sm text-slate-500">由匯入的 NCCU transcript JSON 解析</p>
          </div>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-[#C5A059]/30 bg-white/80 px-4 py-2 text-sm font-bold text-navy-900">
          <Medal className="h-4 w-4 text-[#C5A059]" />
          排名：{formatRanking(profile) || "JSON 未提供"}
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <StudentProfileItem label="主修" value={profile.major} emphasis />
        <StudentProfileItem label="雙主修" value={profile.doubleMajor} />
        <StudentProfileItem label="輔修" value={profile.minor} />
        <StudentProfileItem label="成績 Ranking" value={formatRanking(profile)} />
        <StudentProfileItem label="平均成績" value={profile.averageScore} />
      </div>
    </section>
  );
}

function ResultHero({ result, studentProfile }: { result: AuditResult; studentProfile?: StudentAcademicProfile | null }) {
  const eligible = result.graduationEligible;
  const studentName = studentProfile?.studentName ? `${studentProfile.studentName}，` : "";
  const statusColor = eligible ? "text-emerald-700" : "text-orange-600";
  const StatusIcon = eligible ? CheckCircle2 : AlertTriangle;

  return (
    <section className="relative overflow-hidden rounded-3xl border border-[#C5A059]/25 bg-[#fffaf1] p-6 shadow-xl shadow-blue-950/5">
      <div className="absolute -right-16 -top-24 h-56 w-56 rounded-full bg-[#C5A059]/20 blur-3xl" />
      <div className="absolute -bottom-24 left-1/3 h-52 w-52 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex gap-4">
          <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full ${eligible ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-600"}`}>
            <StatusIcon className="h-9 w-9" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#C5A059]">Graduation Audit</p>
            <h2 className="mt-2 font-serif text-2xl font-bold text-navy-950 md:text-3xl">
              {studentName}畢業檢核結果：<span className={statusColor}>{eligible ? "已完成" : "尚未完成"}</span>
            </h2>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-semibold text-slate-600">
              <span>目前採計 {formatCredits(result.totalCredits.earned)} / {formatCredits(result.totalCredits.required)} 學分</span>
              <span className="text-orange-600">尚缺 {formatCredits(result.totalCredits.missing)} 學分</span>
              <span>規則版本：{result.academicYear} 學年度 / {result.department}</span>
              <span className="inline-flex items-center gap-1"><Clock3 className="h-4 w-4" />模式 {result.mode}</span>
            </div>
          </div>
        </div>
        <div className="grid min-w-[320px] gap-3 sm:grid-cols-3">
          <HeroInfoCard icon={<GraduationCap className="h-5 w-5" />} label="主修" value={studentProfile?.major || result.department} />
          <HeroInfoCard icon={<Award className="h-5 w-5" />} label="成績 Ranking" value={studentProfile ? formatRanking(studentProfile) || "JSON 未提供" : "JSON 未提供"} />
          <HeroInfoCard icon={<Sparkles className="h-5 w-5" />} label="平均成績" value={studentProfile?.averageScore || "JSON 未提供"} />
        </div>
      </div>
    </section>
  );
}

function HeroInfoCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/80 bg-white/85 px-4 py-3 shadow-lg shadow-blue-950/5 backdrop-blur">
      <div className="mb-2 inline-flex rounded-xl bg-blue-50 p-2 text-navy-800">
        {icon}
      </div>
      <p className="text-xs font-bold tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-1 font-bold text-navy-950">{value}</p>
    </div>
  );
}

function CategoryProgressCard({ title, group, earned, required, icon, tone }: {
  title: string;
  group?: AuditGroup;
  earned: number;
  required: number;
  icon: ReactNode;
  tone: "blue" | "green" | "purple" | "gold";
}) {
  const progress = percentOf(earned, required);
  const isComplete = group ? group.status === "COMPLETE" : progress >= 100;
  const toneClass = {
    blue: "from-navy-900 to-blue-700 text-blue-50 bg-blue-50",
    green: "from-emerald-700 to-teal-500 text-emerald-50 bg-emerald-50",
    purple: "from-violet-700 to-indigo-500 text-violet-50 bg-violet-50",
    gold: "from-[#9f7c31] to-[#C5A059] text-amber-50 bg-amber-50"
  }[tone];

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-blue-950/5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`rounded-2xl bg-gradient-to-br p-3 shadow-lg ${toneClass}`}>
            {icon}
          </div>
          <div>
            <p className="font-bold text-navy-950">{title}</p>
            <p className="mt-1 text-2xl font-black text-navy-950">{formatCredits(earned)} / {formatCredits(required)} <span className="text-base font-semibold text-slate-500">學分</span></p>
          </div>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${isComplete ? "bg-emerald-50 text-emerald-700" : "bg-orange-50 text-orange-600"}`}>
          {statusText(isComplete)}
        </span>
      </div>
      <div className="mt-4">
        <ThinProgressBar percent={progress} tone={tone} />
        <p className="mt-1 text-right text-xs font-bold text-navy-800">{displayPercent(progress)}</p>
      </div>
    </section>
  );
}

function GraduationRing({ progress, eligible }: { progress: number; eligible: boolean }) {
  const safeProgress = Math.min(100, Math.max(0, progress));
  return (
    <div className="mx-auto flex h-44 w-44 items-center justify-center rounded-full shadow-inner" style={{ background: `conic-gradient(#1f5fd0 ${safeProgress * 3.6}deg, #e2e8f0 0deg)` }}>
      <div className="flex h-32 w-32 flex-col items-center justify-center rounded-full bg-white text-center shadow-lg shadow-blue-950/10">
        <p className="text-3xl font-black text-navy-950">{displayPercent(safeProgress)}</p>
        <p className="mt-1 text-xs font-bold tracking-[0.16em] text-slate-400">總進度</p>
        <span className={`mt-2 rounded-full px-3 py-1 text-xs font-bold ${eligible ? "bg-emerald-50 text-emerald-700" : "bg-orange-50 text-orange-600"}`}>
          {eligible ? "已完成" : "尚未完成"}
        </span>
      </div>
    </div>
  );
}

function GraduationProgressPanel({ result }: { result: AuditResult }) {
  const rows = [
    { label: "必修課程", group: groupByCode(result, "REQUIRED"), required: result.totalCredits.structure.required, tone: "blue" as const },
    { label: "通識課程", group: groupByCode(result, "GENERAL"), required: result.totalCredits.structure.generalEducation, tone: "green" as const },
    { label: "選修課程", group: groupByCode(result, "ELECTIVE"), required: result.totalCredits.structure.elective, tone: "purple" as const },
    { label: "體育課程", group: groupByCode(result, "PE"), required: result.totalCredits.structure.physicalEducation, tone: "gold" as const }
  ].filter((row) => row.group || row.required > 0);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-blue-950/5">
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <h3 className="font-serif text-xl font-bold text-navy-950">畢業進度</h3>
        <span className="text-sm font-medium text-slate-500">Graduation Progress</span>
      </div>
      <div className="grid gap-6 lg:grid-cols-[220px_1fr] lg:items-center">
        <GraduationRing progress={result.progressPercentage} eligible={result.graduationEligible} />
        <div className="space-y-3">
          {rows.map((row) => {
            const earned = Number(row.group?.earnedCredits || 0);
            const required = Number(row.group?.requiredCredits || row.required || 0);
            const percent = required ? percentOf(earned, required) : 0;
            return (
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3" key={row.label}>
                <div className="mb-2 flex items-center justify-between gap-4">
                  <p className="whitespace-nowrap font-bold text-navy-950">{row.label}</p>
                  <p className="whitespace-nowrap text-sm font-bold text-slate-600">
                    {formatCredits(earned)} / {formatCredits(required)}
                    <span className="ml-3 text-navy-900">{required ? displayPercent(percent) : "—"}</span>
                  </p>
                </div>
                <ThinProgressBar percent={percent} tone={row.tone} />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ActionRequiredPanel({ result }: { result: AuditResult }) {
  const missingItems = result.groups.flatMap((group) => (group.missingCourses || []).map((course) => ({
    title: `缺少：${String(course.courseName || group.groupName)}`,
    tag: group.groupName,
    acceptedCodes: Array.isArray(course.acceptedCourseCodes) ? course.acceptedCourseCodes.join("、") : ""
  })));
  const uncountedCount = result.groups.reduce((sum, group) => sum + (group.uncountedCourses?.length || 0), 0);
  const summaryItems = [
    ...(result.totalCredits.missing > 0 ? [{ title: `尚缺 ${formatCredits(result.totalCredits.missing)} 學分`, tag: "未完成", tone: "orange" as const }] : []),
    ...(uncountedCount > 0 ? [{ title: `有 ${uncountedCount} 門課不可採計`, tag: "需留意", tone: "amber" as const }] : []),
    ...(result.warnings.length ? [{ title: result.warnings[0], tag: "系統提醒", tone: "purple" as const }] : [])
  ];
  const hasItems = missingItems.length || summaryItems.length;
  const toneClass = {
    orange: "border-orange-100 bg-orange-50 text-orange-700",
    amber: "border-amber-100 bg-amber-50 text-amber-700",
    purple: "border-violet-100 bg-violet-50 text-violet-700"
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-blue-950/5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="font-serif text-xl font-bold text-navy-950">待處理事項</h3>
          <p className="text-sm text-slate-500">Action Required</p>
        </div>
        <FileWarning className="h-5 w-5 text-orange-500" />
      </div>
      {hasItems ? (
        <div className="space-y-4">
          {missingItems.length ? (
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <p className="font-bold text-red-800">缺少必修項目</p>
                <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700">{missingItems.length} 項</span>
              </div>
              <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                {missingItems.map((item, index) => (
                  <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700" key={`${item.title}-${index}`}>
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-bold">{item.title}</p>
                      <span className="shrink-0 rounded-full bg-white/70 px-2 py-1 text-xs font-bold">{item.tag}</span>
                    </div>
                    {item.acceptedCodes ? <p className="mt-1 text-xs font-semibold text-red-500">可接受課號：{item.acceptedCodes}</p> : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          {summaryItems.map((item, index) => (
            <div className={`flex items-start justify-between gap-3 rounded-2xl border px-4 py-3 text-sm ${toneClass[item.tone]}`} key={`${item.title}-${index}`}>
              <p className="font-bold">{item.title}</p>
              <span className="shrink-0 rounded-full bg-white/70 px-2 py-1 text-xs font-bold">{item.tag}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
          目前沒有待處理事項
        </div>
      )}
    </section>
  );
}

function CompactRows({ rows, keys }: { rows: Array<Record<string, unknown>>; keys: string[] }) {
  if (!rows.length) return <p className="text-sm text-slate-500">無資料</p>;
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
          <tr>{keys.map((key) => <th className="px-3 py-2" key={key}>{key}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {rows.slice(0, 8).map((row, index) => (
            <tr key={index}>
              {keys.map((key) => <td className="px-3 py-2 text-slate-700" key={key}>{valueOf(row, key)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function GroupPanel({ group }: { group: AuditGroup }) {
  const coreCourses = recordsOf(group.coreRequirement?.courses);
  const earnedDomains = Array.isArray(group.coreRequirement?.earnedDomains) ? group.coreRequirement.earnedDomains : [];

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-navy-900">{displayGroupName(group)}</h3>
          <p className="mt-1 text-sm text-slate-500">
            {formatCredits(group.earnedCredits)} / {formatCredits(group.requiredCredits)} 學分
            {group.missingCredits > 0 ? `，尚缺 ${formatCredits(group.missingCredits)} 學分` : ""}
          </p>
        </div>
        <StatusBadge value={group.status} />
      </div>
      <CreditProgressBar value={Number(group.earnedCredits || 0)} max={Number(group.requiredCredits || 1)} />
      {group.missingCourses?.length ? (
        <div className="mt-4">
          <p className="mb-2 text-sm font-semibold text-red-700">缺少項目</p>
          <CompactRows rows={group.missingCourses} keys={["courseName", "requiredCredits", "acceptedCourseCodes"]} />
        </div>
      ) : null}
      {group.completedRules?.length ? (
        <div className="mt-4">
          <p className="mb-2 text-sm font-semibold text-slate-700">已完成規則</p>
          <CompactRows rows={group.completedRules} keys={["courseName", "matchedCourseCode", "countedCredits", "recognitionType"]} />
        </div>
      ) : null}
      {group.requirements?.length ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {group.requirements.map((item) => (
            <div className="rounded-lg border border-slate-200 p-3" key={item.bucketCode}>
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-navy-900">{displayGeneralBucketName(item.bucketCode, item.bucketName)}</p>
                <StatusBadge value={item.status} />
              </div>
              <p className="mt-2 text-sm text-slate-500">
                {formatCredits(item.earnedCredits)} / {displayCreditRequirement(item.minCredits, item.maxCredits)} 學分
              </p>
            </div>
          ))}
        </div>
      ) : null}
      {group.coreRequirement ? (
        <div className="mt-4 rounded-lg border border-navy-100 bg-navy-50 p-4 text-sm text-navy-800">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold">核心通識課程</p>
            <StatusBadge value={String(group.coreRequirement.status || "INCOMPLETE")} />
          </div>
          <p className="mt-2">
            已完成 {valueOf(group.coreRequirement, "earnedDistinctDomains")} / {valueOf(group.coreRequirement, "requiredDistinctDomains")} 個不同領域
          </p>
          {coreCourses.length ? (
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {coreCourses.map((course, index) => (
                <div className="rounded-md border border-navy-100 bg-white px-3 py-2 font-medium text-navy-900" key={`${String(course.courseCode || course.courseName || index)}-${index}`}>
                  {displayCoreCourse(course)}
                </div>
              ))}
            </div>
          ) : earnedDomains.length ? (
            <p className="mt-2 text-slate-600">已完成領域：{earnedDomains.join("、")}</p>
          ) : null}
        </div>
      ) : null}
      {group.uncountedCourses?.length ? (
        <div className="mt-4">
          <p className="mb-2 text-sm font-semibold text-amber-700">未採計課程</p>
          <CompactRows rows={group.uncountedCourses} keys={["courseCode", "courseName", "credits", "reason"]} />
        </div>
      ) : null}
      {group.notes?.length ? (
        <ul className="mt-4 space-y-1 text-sm text-slate-500">
          {group.notes.map((note) => <li key={note}>{note}</li>)}
        </ul>
      ) : null}
    </section>
  );
}

export function AuditResultView({ result, studentProfile }: { result: AuditResult; studentProfile?: StudentAcademicProfile | null }) {
  const [mode, setMode] = useState<"official" | "projected">("official");
  const active = mode === "projected" && result.projectedResult ? result.projectedResult : result;
  const requiredGroup = groupByCode(active, "REQUIRED");
  const generalGroup = groupByCode(active, "GENERAL");
  const electiveGroup = groupByCode(active, "ELECTIVE");
  const totalGroup = groupByCode(active, "TOTAL");
  const tabGroups = active.groups.filter((group) => ["REQUIRED", "GENERAL", "ELECTIVE", "PE", "TOTAL"].includes(group.groupCode));
  const defaultTab = tabGroups.find((group) => group.groupCode === "GENERAL") || tabGroups[0] || null;
  const [selectedGroupCode, setSelectedGroupCode] = useState(defaultTab?.groupCode || "");
  const selectedGroup = tabGroups.find((group) => group.groupCode === selectedGroupCode) || defaultTab;

  return (
    <div className="space-y-5">
      {result.projectedResult ? (
        <div className="inline-flex rounded-2xl border border-slate-200 bg-white p-1 shadow-sm shadow-blue-950/5">
          <button className={`rounded-xl px-5 py-2 text-sm font-bold transition ${mode === "official" ? "bg-navy-900 text-white shadow-lg shadow-blue-950/20" : "text-slate-600 hover:bg-slate-50"}`} onClick={() => setMode("official")}>正式結果</button>
          <button className={`rounded-xl px-5 py-2 text-sm font-bold transition ${mode === "projected" ? "bg-navy-900 text-white shadow-lg shadow-blue-950/20" : "text-slate-600 hover:bg-slate-50"}`} onClick={() => setMode("projected")}>預估結果</button>
        </div>
      ) : null}
      <ResultHero result={active} studentProfile={studentProfile} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <CategoryProgressCard title="必修課程" group={requiredGroup} earned={Number(requiredGroup?.earnedCredits || 0)} required={Number(requiredGroup?.requiredCredits || active.totalCredits.structure.required)} icon={<BookOpenCheck className="h-6 w-6" />} tone="blue" />
        <CategoryProgressCard title="通識課程" group={generalGroup} earned={Number(generalGroup?.earnedCredits || 0)} required={Number(generalGroup?.requiredCredits || active.totalCredits.structure.generalEducation)} icon={<GraduationCap className="h-6 w-6" />} tone="green" />
        <CategoryProgressCard title="選修課程" group={electiveGroup} earned={Number(electiveGroup?.earnedCredits || 0)} required={Number(electiveGroup?.requiredCredits || active.totalCredits.structure.elective)} icon={<Layers3 className="h-6 w-6" />} tone="purple" />
        <CategoryProgressCard title="畢業總學分" group={totalGroup} earned={Number(active.totalCredits.earned || 0)} required={Number(active.totalCredits.required || 0)} icon={<Trophy className="h-6 w-6" />} tone="gold" />
      </div>
      {studentProfile ? <StudentAcademicProfileCard profile={studentProfile} /> : null}
      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <GraduationProgressPanel result={active} />
        <ActionRequiredPanel result={active} />
      </div>
      {active.warnings.length ? (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
          <div className="mb-2 flex items-center gap-2 font-semibold text-amber-800">
            <AlertTriangle className="h-4 w-4" />
            系統提醒
          </div>
          <ul className="space-y-1 text-sm text-amber-800">
            {active.warnings.map((warning) => <li key={warning}>{warning}</li>)}
          </ul>
        </div>
      ) : null}
      {tabGroups.length ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-blue-950/5">
          <div className="mb-4 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
            {tabGroups.map((group) => (
              <button
                className={`rounded-xl px-4 py-2 text-sm font-bold transition ${selectedGroup?.groupCode === group.groupCode ? "bg-navy-900 text-white shadow-lg shadow-blue-950/20" : "bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-navy-900"}`}
                key={group.groupCode}
                onClick={() => setSelectedGroupCode(group.groupCode)}
              >
                {displayGroupName(group)}
              </button>
            ))}
          </div>
          {selectedGroup ? <GroupPanel group={selectedGroup} /> : null}
        </section>
      ) : null}
    </div>
  );
}
