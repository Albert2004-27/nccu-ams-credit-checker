import { AlertTriangle, BookOpenCheck, CheckCircle2, Medal, XCircle } from "lucide-react";
import { useState } from "react";
import { formatCredits, getAuditEligibilityLabel } from "../lib/status";
import type { StudentAcademicProfile } from "../lib/transcriptProfile";
import type { AuditGroup, AuditResult } from "../types/api";
import { CreditProgressBar } from "./CreditProgressBar";
import { MetricTile } from "./MetricTile";
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

function StudentProfileItem({ label, value, emphasis = false }: { label: string; value?: string; emphasis?: boolean }) {
  if (!value) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white/80 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 font-bold ${emphasis ? "text-2xl text-navy-900" : "text-base text-navy-900"}`}>{value}</p>
    </div>
  );
}

function formatRanking(profile: StudentAcademicProfile) {
  if (!profile.ranking) return undefined;
  return profile.rankingPercent ? `${profile.ranking}（前 ${profile.rankingPercent}）` : profile.ranking;
}

function StudentAcademicProfileCard({ profile }: { profile: StudentAcademicProfile }) {
  return (
    <section className="overflow-hidden rounded-lg border border-navy-100 bg-white shadow-sm">
      <div className="border-b border-navy-100 bg-gradient-to-r from-navy-900 via-navy-800 to-navy-700 px-5 py-4 text-white">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-white/12 p-2">
              <BookOpenCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">學生學籍資訊</h3>
              <p className="text-sm text-blue-100">由匯入的 NCCU transcript JSON 解析</p>
            </div>
          </div>
          {profile.ranking ? (
            <div className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-2 text-sm font-semibold">
              <Medal className="h-4 w-4 text-amber-200" />
              系排名 {formatRanking(profile)}
            </div>
          ) : null}
        </div>
      </div>
      <div className="grid gap-3 bg-slate-50 p-5 md:grid-cols-2 xl:grid-cols-5">
        <StudentProfileItem label="主修" value={profile.major} emphasis />
        <StudentProfileItem label="雙主修" value={profile.doubleMajor} />
        <StudentProfileItem label="輔修" value={profile.minor} />
        <StudentProfileItem label="系排名" value={formatRanking(profile)} />
        <StudentProfileItem label="總平均" value={profile.averageScore} />
      </div>
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

  return (
    <div className="space-y-6">
      {result.projectedResult ? (
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
          <button className={`rounded-md px-4 py-2 text-sm font-semibold ${mode === "official" ? "bg-navy-800 text-white" : "text-slate-600"}`} onClick={() => setMode("official")}>正式結果</button>
          <button className={`rounded-md px-4 py-2 text-sm font-semibold ${mode === "projected" ? "bg-navy-800 text-white" : "text-slate-600"}`} onClick={() => setMode("projected")}>預估結果</button>
        </div>
      ) : null}
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            {active.graduationEligible ? <CheckCircle2 className="h-12 w-12 text-emerald-600" /> : <XCircle className="h-12 w-12 text-red-600" />}
            <div>
              <h2 className="text-2xl font-bold text-navy-900">{getAuditEligibilityLabel(active.graduationEligible)}</h2>
              <p className="text-sm text-slate-500">模式：{active.mode}，學年度：{active.academicYear}</p>
            </div>
          </div>
          <div className="w-full md:w-72">
            <CreditProgressBar value={active.totalCredits.earned} max={active.totalCredits.required} label="總完成率" />
          </div>
        </div>
      </section>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile label="採計學分" value={`${formatCredits(active.totalCredits.earned)} / ${formatCredits(active.totalCredits.required)}`} />
        <MetricTile label="缺少學分" value={formatCredits(active.totalCredits.missing)} />
        <MetricTile label="完成率" value={`${active.progressPercentage}%`} />
        <MetricTile label="排除學分" value={formatCredits(active.totalCredits.excludedByRules)} />
      </div>
      {studentProfile ? <StudentAcademicProfileCard profile={studentProfile} /> : null}
      {active.warnings.length ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="mb-2 flex items-center gap-2 font-semibold text-amber-800">
            <AlertTriangle className="h-4 w-4" />
            系統提醒
          </div>
          <ul className="space-y-1 text-sm text-amber-800">
            {active.warnings.map((warning) => <li key={warning}>{warning}</li>)}
          </ul>
        </div>
      ) : null}
      <div className="space-y-4">
        {active.groups.map((group) => <GroupPanel group={group} key={group.groupCode} />)}
      </div>
    </div>
  );
}
