import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, BookOpenCheck, ClipboardCheck, GraduationCap, Lock, Mail, ShieldCheck, UserRound } from "lucide-react";
import { getDefaultRouteForRole } from "../lib/navigation";
import { useAppState } from "../state/AppState";
import type { DemoUser, UserRole } from "../types/api";
import nccuLogo from "../assets/nccu-logo.png";

function AuthFrame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#eef3f8] text-slate-900">
      <div className="grid min-h-screen lg:grid-cols-[0.95fr_1.05fr]">
        <section className="relative hidden overflow-hidden bg-[#071f3f] px-14 py-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.10)_0_1px,transparent_1px_18px)] opacity-20" />
          <div className="absolute inset-x-0 top-0 h-1 bg-[#C5A059]" />
          <div className="relative">
            <div className="flex items-center gap-4">
              <div className="grid h-16 w-16 place-items-center rounded-2xl border border-white/15 bg-white/10 shadow-xl shadow-black/20">
                <GraduationCap className="h-8 w-8" />
              </div>
              <div>
                <p className="font-serif text-3xl font-bold tracking-normal">畢業審核系統</p>
                <p className="mt-1 text-sm font-semibold text-blue-100">NCCU Applied Mathematics</p>
              </div>
            </div>

            <div className="mt-20 max-w-2xl">
              <p className="mb-5 inline-flex rounded-full border border-[#C5A059]/40 bg-[#C5A059]/10 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-[#f4d68c]">
                Graduation Audit
              </p>
              <h1 className="font-serif text-5xl font-bold leading-tight tracking-normal">
                以清楚的規則與結果，完成畢業資格檢核。
              </h1>
              <p className="mt-6 max-w-xl text-lg font-medium leading-8 text-blue-100">
                支援 transcript 匯入、畢業審核、通識與必修解釋，以及管理員人工調整。
              </p>
            </div>

            <div className="mt-12 grid max-w-xl gap-3 sm:grid-cols-3">
              <HeroPill icon={<BookOpenCheck className="h-5 w-5" />} label="規則清楚" />
              <HeroPill icon={<ClipboardCheck className="h-5 w-5" />} label="結果可追溯" />
              <HeroPill icon={<ShieldCheck className="h-5 w-5" />} label="行政可管理" />
            </div>
          </div>

          <div className="relative flex items-center justify-start gap-6 border-t border-white/10 pt-8">
            <div className="flex items-center gap-4">
              <div className="grid h-24 w-24 place-items-center rounded-3xl border border-white/10 bg-white p-3 shadow-xl shadow-black/20">
                <img className="h-full w-full object-contain" src={nccuLogo} alt="NCCU logo" />
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/10 px-8 py-5 text-left backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-100">Department</p>
              <p className="mt-2 whitespace-nowrap font-serif text-2xl font-bold leading-tight">Applied Mathematics</p>
            </div>
          </div>
        </section>

        <main className="flex items-center justify-center px-5 py-10">
          <div className="w-full max-w-[520px]">
            <div className="mb-6 flex items-center gap-3 lg:hidden">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-navy-900 text-white shadow-lg shadow-blue-950/20">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div>
                <p className="font-serif text-xl font-bold text-navy-950">畢業審核系統</p>
                <p className="text-xs font-bold text-slate-500">NCCU Applied Mathematics</p>
              </div>
            </div>
            <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-2xl shadow-blue-950/10">
              <div className="mb-7">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#C5A059]">Secure Access</p>
                <h2 className="mt-3 font-serif text-3xl font-bold text-navy-950">{title}</h2>
              </div>
            {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function HeroPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-3 py-3 text-sm font-bold text-blue-50 backdrop-blur">
      <span className="grid h-8 w-8 place-items-center rounded-xl bg-white/10 text-[#f4d68c]">{icon}</span>
      <span className="whitespace-nowrap">{label}</span>
    </div>
  );
}

function FieldShell({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-black text-slate-700">
      {label}
      <div className="mt-2 flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-navy-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100">
        <span className="mr-3 text-slate-400">{icon}</span>
        {children}
      </div>
    </label>
  );
}

function RoleSelector({ role, setRole }: { role: UserRole; setRole: (role: UserRole) => void }) {
  const options: Array<{ value: UserRole; label: string; icon: React.ReactNode }> = [
    { value: "student", label: "學生", icon: <UserRound className="h-4 w-4" /> },
    { value: "admin", label: "管理員", icon: <ShieldCheck className="h-4 w-4" /> }
  ];

  return (
    <div>
      <p className="mb-2 text-sm font-black text-slate-700">身份</p>
      <div className="grid grid-cols-2 rounded-2xl border border-slate-200 bg-slate-100 p-1">
        {options.map((option) => (
          <button
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black transition ${role === option.value ? "bg-white text-navy-950 shadow-sm" : "text-slate-500 hover:text-navy-900"}`}
            key={option.value}
            onClick={() => setRole(option.value)}
            type="button"
          >
            {option.icon}
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const { setRole, setCurrentUser } = useAppState();
  const [role, setSelectedRole] = useState<UserRole>("student");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRole(role);
    const form = new FormData(event.currentTarget);
    setCurrentUser({
      id: role === "admin" ? 999 : 1,
      student_number: role === "admin" ? "ADMIN-DEMO" : "JSON 匯入後更新",
      name: role === "admin" ? "管理員" : "學生使用者",
      email: String(form.get("email") || (role === "admin" ? "admin@nccu.edu.tw" : "demo@nccu.edu.tw")),
      admission_year: 111,
      role
    });
    navigate(getDefaultRouteForRole(role));
  }

  return (
    <AuthFrame title="登入系統">
      <form className="space-y-5" onSubmit={submit}>
        <FieldShell label="Email" icon={<Mail className="h-5 w-5" />}>
          <input className="h-[52px] w-full bg-transparent py-3 text-base font-bold text-navy-950 outline-none placeholder:text-slate-400" name="email" type="email" defaultValue="demo@nccu.edu.tw" />
        </FieldShell>
        <FieldShell label="Password" icon={<Lock className="h-5 w-5" />}>
          <input className="h-[52px] w-full bg-transparent py-3 text-base font-bold text-navy-950 outline-none placeholder:text-slate-400" name="password" type="password" defaultValue="demo1234" />
        </FieldShell>
        <RoleSelector role={role} setRole={setSelectedRole} />
        <button className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-navy-900 px-4 py-4 text-base font-black text-white shadow-xl shadow-blue-950/20 transition hover:-translate-y-0.5 hover:bg-navy-950 active:translate-y-0">
          登入
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
        </button>
      </form>
      <p className="mt-6 text-center text-sm font-semibold text-slate-500">尚未有帳號？ <Link className="font-black text-navy-800 hover:text-navy-950" to="/register">前往註冊</Link></p>
    </AuthFrame>
  );
}

export function RegisterPage() {
  const navigate = useNavigate();
  const { setRole, setCurrentUser } = useAppState();
  const [role, setSelectedRole] = useState<UserRole>("student");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const user: DemoUser = {
      id: role === "admin" ? 999 : 1,
      student_number: String(form.get("studentNumber") || "JSON 匯入後更新"),
      name: String(form.get("name") || "學生使用者"),
      email: String(form.get("email") || "demo@nccu.edu.tw"),
      admission_year: Number(form.get("admissionYear") || 111),
      role
    };
    setRole(role);
    setCurrentUser(user);
    navigate(getDefaultRouteForRole(role));
  }

  return (
    <AuthFrame title="註冊帳號">
      <form className="space-y-5" onSubmit={submit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldShell label="學號" icon={<UserRound className="h-5 w-5" />}>
            <input className="h-[52px] w-full bg-transparent py-3 text-base font-bold text-navy-950 outline-none" name="studentNumber" defaultValue="JSON 匯入後更新" />
          </FieldShell>
          <FieldShell label="入學年度" icon={<BookOpenCheck className="h-5 w-5" />}>
            <input className="h-[52px] w-full bg-transparent py-3 text-base font-bold text-navy-950 outline-none" name="admissionYear" defaultValue="111" />
          </FieldShell>
        </div>
        <FieldShell label="姓名" icon={<UserRound className="h-5 w-5" />}>
          <input className="h-[52px] w-full bg-transparent py-3 text-base font-bold text-navy-950 outline-none" name="name" defaultValue="學生使用者" />
        </FieldShell>
        <FieldShell label="Email" icon={<Mail className="h-5 w-5" />}>
          <input className="h-[52px] w-full bg-transparent py-3 text-base font-bold text-navy-950 outline-none" name="email" type="email" defaultValue="demo@nccu.edu.tw" />
        </FieldShell>
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldShell label="密碼" icon={<Lock className="h-5 w-5" />}>
            <input className="h-[52px] w-full bg-transparent py-3 text-base font-bold text-navy-950 outline-none" type="password" defaultValue="demo1234" />
          </FieldShell>
          <FieldShell label="確認密碼" icon={<Lock className="h-5 w-5" />}>
            <input className="h-[52px] w-full bg-transparent py-3 text-base font-bold text-navy-950 outline-none" type="password" defaultValue="demo1234" />
          </FieldShell>
        </div>
        <RoleSelector role={role} setRole={setSelectedRole} />
        <button className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-navy-900 px-4 py-4 text-base font-black text-white shadow-xl shadow-blue-950/20 transition hover:-translate-y-0.5 hover:bg-navy-950 active:translate-y-0">
          建立帳號
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
        </button>
      </form>
      <p className="mt-6 text-center text-sm font-semibold text-slate-500">已有帳號？ <Link className="font-black text-navy-800 hover:text-navy-950" to="/login">回到登入</Link></p>
    </AuthFrame>
  );
}
