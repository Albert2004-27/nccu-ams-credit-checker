import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { BookOpen, ClipboardCheck, Database, FileInput, GraduationCap, History, Home, ListChecks, LogOut, Settings, ShieldCheck, UserCog } from "lucide-react";
import { clsx } from "clsx";
import { useHealth } from "../api/hooks";
import { useAppState } from "../state/AppState";

const studentLinks = [
  { to: "/student", label: "學生總覽", icon: Home },
  { to: "/student/import", label: "Transcript 匯入", icon: FileInput },
  { to: "/student/courses", label: "我的修課資料", icon: BookOpen },
  { to: "/student/audit/run", label: "執行審核", icon: ClipboardCheck },
  { to: "/student/audit/history", label: "審核歷史", icon: History }
];

const adminLinks = [
  { to: "/admin", label: "管理員總覽", icon: Home },
  { to: "/admin/unresolved", label: "待確認課程", icon: ListChecks },
  { to: "/admin/manual-courses", label: "人工調整", icon: UserCog },
  { to: "/admin/courses", label: "課程查詢", icon: Database },
  { to: "/admin/requirements", label: "畢業規則", icon: ShieldCheck },
  { to: "/admin/audit-history", label: "學生審核紀錄", icon: History }
];

export function AppShell({ role }: { role: "student" | "admin" }) {
  const links = role === "student" ? studentLinks : adminLinks;
  const { currentUser, targetUserId, setRole, studentProfile } = useAppState();
  const health = useHealth();
  const navigate = useNavigate();
  const studentName = studentProfile?.studentName || currentUser.name;
  const studentNumber = studentProfile?.studentNumber || currentUser.student_number;

  function logout() {
    setRole(null);
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 border-r border-navy-800 bg-navy-900 text-white lg:block">
        <div className="flex h-20 items-center gap-3 border-b border-white/10 px-6">
          <div className="rounded-lg bg-white/10 p-2">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <p className="text-lg font-bold">畢業審核系統</p>
            <p className="text-xs text-blue-100">NCCU AMS</p>
          </div>
        </div>
        <nav className="space-y-1 px-4 py-5">
          {links.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === `/${role}`}
              className={({ isActive }) => clsx(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold transition",
                isActive ? "bg-white text-navy-900" : "text-blue-50 hover:bg-white/10"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="lg:pl-72">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-navy-700">{role === "student" ? "學生端" : "管理員端"}</p>
              <p className="text-sm text-slate-500">
                {role === "student" ? `${studentName} / 學號 ${studentNumber} / userId ${currentUser.id}` : `目前檢視 userId ${targetUserId}`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={clsx(
                "rounded-md border px-2.5 py-1 text-xs font-semibold",
                health.data?.status === "ok" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"
              )}>
                後端{health.data?.status === "ok" ? "連線正常" : "連線待確認"}
              </span>
              <button className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" onClick={logout}>
                <LogOut className="h-4 w-4" />
                登出
              </button>
            </div>
          </div>
        </header>
        <main className="px-5 py-6">
          <Outlet />
        </main>
      </div>
      <div className="fixed bottom-4 right-4 lg:hidden">
        <NavLink to={role === "student" ? "/student/audit/run" : "/admin/manual-courses"} className="inline-flex items-center gap-2 rounded-full bg-navy-800 px-4 py-3 text-sm font-semibold text-white shadow-lg">
          <Settings className="h-4 w-4" />
          快速操作
        </NavLink>
      </div>
    </div>
  );
}
