import { createContext, useContext, useMemo, useState } from "react";
import type { StudentAcademicProfile } from "../lib/transcriptProfile";
import type { AuditResult, DemoUser, UserRole } from "../types/api";

const DEFAULT_STUDENT: DemoUser = {
  id: 1,
  student_number: "JSON 匯入後更新",
  name: "學生使用者",
  email: "demo@nccu.edu.tw",
  admission_year: 111,
  role: "student"
};

const DEFAULT_ADMIN: DemoUser = {
  id: 999,
  student_number: "ADMIN-DEMO",
  name: "管理員",
  email: "admin@nccu.edu.tw",
  admission_year: 111,
  role: "admin"
};

type AppState = {
  role: UserRole | null;
  currentUser: DemoUser;
  targetUserId: number;
  lastAuditResult: AuditResult | null;
  studentProfile: StudentAcademicProfile | null;
  targetStudentProfile: StudentAcademicProfile | null;
  setRole: (role: UserRole | null) => void;
  setCurrentUser: (user: DemoUser) => void;
  setTargetUserId: (userId: number) => void;
  setLastAuditResult: (result: AuditResult | null) => void;
  setStudentProfile: (profile: StudentAcademicProfile | null) => void;
};

const AppStateContext = createContext<AppState | null>(null);

function readRole(): UserRole | null {
  const value = localStorage.getItem("nccu-role");
  return value === "student" || value === "admin" ? value : null;
}

function readTargetUserId() {
  const value = Number(localStorage.getItem("nccu-target-user-id") || "1");
  return Number.isFinite(value) && value > 0 ? value : 1;
}

function profileStorageKey(userId: number) {
  return `nccu-student-profile:${userId}`;
}

function readStudentProfile(userId: number): StudentAcademicProfile | null {
  const raw = localStorage.getItem(profileStorageKey(userId));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed as StudentAcademicProfile : null;
  } catch (_error) {
    return null;
  }
}

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<UserRole | null>(() => readRole());
  const [currentUser, setCurrentUserState] = useState<DemoUser>(() => (readRole() === "admin" ? DEFAULT_ADMIN : DEFAULT_STUDENT));
  const [targetUserId, setTargetUserIdState] = useState(() => readTargetUserId());
  const [lastAuditResult, setLastAuditResult] = useState<AuditResult | null>(null);
  const [studentProfile, setStudentProfileState] = useState<StudentAcademicProfile | null>(() => readStudentProfile(DEFAULT_STUDENT.id));
  const [targetStudentProfile, setTargetStudentProfileState] = useState<StudentAcademicProfile | null>(() => readStudentProfile(readTargetUserId()));

  const value = useMemo<AppState>(() => ({
    role,
    currentUser,
    targetUserId,
    lastAuditResult,
    studentProfile,
    targetStudentProfile,
    setRole(nextRole) {
      if (nextRole) localStorage.setItem("nccu-role", nextRole);
      else localStorage.removeItem("nccu-role");
      setRoleState(nextRole);
      if (nextRole === "admin") {
        setCurrentUserState(DEFAULT_ADMIN);
        setStudentProfileState(null);
        setTargetStudentProfileState(readStudentProfile(targetUserId));
      }
      if (nextRole === "student") {
        setCurrentUserState(DEFAULT_STUDENT);
        setTargetUserIdState(DEFAULT_STUDENT.id);
        const profile = readStudentProfile(DEFAULT_STUDENT.id);
        setStudentProfileState(profile);
        setTargetStudentProfileState(profile);
      }
    },
    setCurrentUser(user) {
      setCurrentUserState(user);
      if (user.role === "student") {
        setTargetUserIdState(user.id);
        const profile = readStudentProfile(user.id);
        setStudentProfileState(profile);
        setTargetStudentProfileState(profile);
      } else {
        setStudentProfileState(null);
        setTargetStudentProfileState(readStudentProfile(targetUserId));
      }
    },
    setTargetUserId(userId) {
      localStorage.setItem("nccu-target-user-id", String(userId));
      setTargetUserIdState(userId);
      setTargetStudentProfileState(readStudentProfile(userId));
    },
    setLastAuditResult,
    setStudentProfile(profile) {
      if (profile) localStorage.setItem(profileStorageKey(currentUser.id), JSON.stringify(profile));
      else localStorage.removeItem(profileStorageKey(currentUser.id));
      setStudentProfileState(profile);
      if (currentUser.id === targetUserId) setTargetStudentProfileState(profile);
    }
  }), [currentUser, lastAuditResult, role, studentProfile, targetStudentProfile, targetUserId]);

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) throw new Error("useAppState must be used inside AppStateProvider");
  return context;
}
