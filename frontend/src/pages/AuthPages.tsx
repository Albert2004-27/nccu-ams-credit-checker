import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap } from "lucide-react";
import { getDefaultRouteForRole } from "../lib/navigation";
import { useAppState } from "../state/AppState";
import type { DemoUser, UserRole } from "../types/api";

function AuthFrame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-100">
      <div className="grid min-h-screen lg:grid-cols-[0.9fr_1.1fr]">
        <section className="hidden bg-navy-900 px-12 py-14 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-white/10 p-3">
                <GraduationCap className="h-7 w-7" />
              </div>
              <div>
                <p className="text-2xl font-bold">畢業審核系統</p>
                <p className="text-sm text-blue-100">NCCU Applied Mathematics</p>
              </div>
            </div>
            <div className="mt-16 max-w-xl">
              <h1 className="text-4xl font-bold leading-tight">以清楚的規則與結果，完成畢業資格檢核。</h1>
              <p className="mt-5 text-base leading-7 text-blue-100">
                支援 transcript 匯入、畢業審核、通識與必修解釋，以及管理員人工調整。
              </p>
            </div>
          </div>
          <p className="text-sm text-blue-100">深藍白制度型介面，對齊正式校務系統使用情境。</p>
        </section>
        <main className="flex items-center justify-center px-5 py-10">
          <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-navy-900">{title}</h2>
            {children}
          </div>
        </main>
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
      <form className="mt-6 space-y-4" onSubmit={submit}>
        <label className="block text-sm font-semibold text-slate-700">Email
          <input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" name="email" type="email" defaultValue="demo@nccu.edu.tw" />
        </label>
        <label className="block text-sm font-semibold text-slate-700">Password
          <input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" name="password" type="password" defaultValue="demo1234" />
        </label>
        <label className="block text-sm font-semibold text-slate-700">身份
          <select className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" value={role} onChange={(event) => setSelectedRole(event.target.value as UserRole)}>
            <option value="student">學生</option>
            <option value="admin">管理員</option>
          </select>
        </label>
        <button className="w-full rounded-md bg-navy-800 px-4 py-3 text-sm font-bold text-white hover:bg-navy-900">登入</button>
      </form>
      <p className="mt-5 text-sm text-slate-500">尚未有帳號？ <Link className="font-semibold text-navy-700" to="/register">前往註冊</Link></p>
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
      <form className="mt-6 space-y-4" onSubmit={submit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-semibold text-slate-700">學號
            <input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" name="studentNumber" defaultValue="JSON 匯入後更新" />
          </label>
          <label className="block text-sm font-semibold text-slate-700">入學年度
            <input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" name="admissionYear" defaultValue="111" />
          </label>
        </div>
        <label className="block text-sm font-semibold text-slate-700">姓名
          <input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" name="name" defaultValue="學生使用者" />
        </label>
        <label className="block text-sm font-semibold text-slate-700">Email
          <input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" name="email" type="email" defaultValue="demo@nccu.edu.tw" />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-semibold text-slate-700">密碼
            <input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" type="password" defaultValue="demo1234" />
          </label>
          <label className="block text-sm font-semibold text-slate-700">確認密碼
            <input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" type="password" defaultValue="demo1234" />
          </label>
        </div>
        <label className="block text-sm font-semibold text-slate-700">身份
          <select className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" value={role} onChange={(event) => setSelectedRole(event.target.value as UserRole)}>
            <option value="student">學生</option>
            <option value="admin">管理員</option>
          </select>
        </label>
        <button className="w-full rounded-md bg-navy-800 px-4 py-3 text-sm font-bold text-white hover:bg-navy-900">建立帳號</button>
      </form>
      <p className="mt-5 text-sm text-slate-500">已有帳號？ <Link className="font-semibold text-navy-700" to="/login">回到登入</Link></p>
    </AuthFrame>
  );
}
