import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowDown, ArrowRight, BookOpenCheck, Lock, Mail, ShieldCheck, UserRound } from "lucide-react";
import { getDefaultRouteForRole } from "../lib/navigation";
import { useAppState } from "../state/AppState";
import type { DemoUser, UserRole } from "../types/api";
import nccuLogo from "../assets/nccu-logo.png";
import nccuMainGate from "../assets/nccu-main-gate.jpg";

function AuthFrame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#eaf1f8] text-slate-900">
      <section className="relative flex min-h-[72vh] overflow-hidden bg-[#071f3f] px-6 py-8 text-white md:px-12 lg:px-20">
        <div className="absolute inset-0 scale-[1.01] bg-cover bg-center" style={{ backgroundImage: `url(${nccuMainGate})` }} />
        <div className="absolute inset-0 bg-[#071f3f]/34 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#071f3f]/10 via-[#071f3f]/18 to-[#071f3f]/64" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_46%,rgba(5,20,43,0.62)_0%,rgba(5,20,43,0.42)_30%,rgba(5,20,43,0.12)_56%,transparent_76%),linear-gradient(90deg,rgba(7,31,63,0.26),transparent_30%,transparent_74%,rgba(7,31,63,0.32))]" />
        <div className="absolute inset-x-0 top-0 h-1 bg-[#C5A059]" />
        <div className="relative z-10 flex w-full flex-col">
          <header className="flex items-center gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <img className="h-14 w-14 shrink-0 rounded-full bg-white object-contain p-1.5 shadow-xl shadow-black/20" src={nccuLogo} alt="NCCU logo" />
              <div>
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <p className="whitespace-nowrap font-serif text-xl font-bold tracking-normal md:text-2xl">國立政治大學 應用數學系</p>
                  <p className="whitespace-nowrap rounded-full border border-[#C5A059]/40 px-3 py-1 text-xs font-black tracking-[0.16em] text-[#f4d68c]">畢業審核系統</p>
                </div>
                <p className="mt-1 text-sm font-semibold text-blue-100">Department of Mathematical Sciences, NCCU</p>
              </div>
            </div>
          </header>

          <div className="flex flex-1 items-center justify-center py-16 text-center">
            <div className="w-full max-w-5xl">
              <p className="mx-auto mb-5 inline-flex rounded-full border border-[#C5A059]/55 bg-[#071f3f]/35 px-7 py-2 text-xs font-black uppercase tracking-[0.28em] text-[#f4d68c] shadow-lg shadow-black/15 backdrop-blur-sm">
                Graduation Audit Platform
              </p>
              <h1
                className="mx-auto whitespace-nowrap font-serif text-5xl font-bold leading-none tracking-normal text-white sm:text-6xl md:text-7xl lg:text-8xl"
                style={{ textShadow: "0 5px 22px rgba(0,0,0,0.72), 0 1px 2px rgba(0,0,0,0.9)" }}
              >
                畢業審核系統
              </h1>

              <a className="mx-auto mt-10 inline-flex items-center gap-2 rounded-xl bg-[#C5A059] px-7 py-3 text-sm font-black text-navy-950 shadow-xl shadow-black/20 transition hover:-translate-y-0.5 hover:bg-[#d7b670]" href="#auth-panel">
                前往登入
                <ArrowDown className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      <main className="flex min-h-screen items-center justify-center px-5 py-12" id="auth-panel">
        <div className="w-full max-w-[540px]">
          <a
            className="group mb-6 flex items-center justify-center gap-4 rounded-3xl px-4 py-3 transition hover:bg-white/55 focus:outline-none focus:ring-4 focus:ring-[#C5A059]/25"
            href="https://ms.nccu.edu.tw/"
            rel="noreferrer"
            target="_blank"
          >
            <img className="h-14 w-14 shrink-0 rounded-full border border-slate-200 bg-white object-contain p-1.5 shadow-lg shadow-blue-950/10" src={nccuLogo} alt="NCCU logo" />
            <div>
              <p className="font-serif text-xl font-bold text-navy-950 transition group-hover:text-[#082f63]">Mathematical Sciences</p>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400 transition group-hover:text-[#9f7c31]">Graduate Audit</p>
            </div>
          </a>
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-2xl shadow-blue-950/10 md:p-10">
            <div className="mb-7">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#C5A059]">Secure Access</p>
              <h2 className="mt-3 font-serif text-4xl font-bold text-navy-950">{title}</h2>
            </div>
            {children}
          </div>
        </div>
      </main>
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
