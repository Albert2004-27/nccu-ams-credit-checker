import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  scenarios: {
    query_browsing: {
      executor: "constant-vus",
      exec: "queryBrowsing",
      vus: Number(__ENV.QUERY_VUS || 30),
      duration: __ENV.QUERY_DURATION || "45s"
    },
    audit_checking: {
      executor: "constant-vus",
      exec: "auditChecking",
      vus: Number(__ENV.AUDIT_VUS || 30),
      duration: __ENV.AUDIT_DURATION || "45s"
    },
    full_user_flow: {
      executor: "constant-vus",
      exec: "fullUserFlow",
      vus: Number(__ENV.FLOW_VUS || 1),
      duration: __ENV.FLOW_DURATION || "20s",
      startTime: __ENV.FLOW_START || "50s"
    }
  },
  thresholds: {
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(95)<1500"],
    "http_req_duration{scenario:query_browsing}": ["p(95)<1000"],
    "http_req_duration{scenario:audit_checking}": ["p(95)<1500"],
    "http_req_duration{scenario:full_user_flow}": ["p(95)<3000"]
  }
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:3001";
const DEMO_USER_ID = Number(__ENV.DEMO_USER_ID || 1);
const FULL_FLOW_USER_ID = Number(__ENV.FULL_FLOW_USER_ID || __ENV.K6_USER_ID || 2);
const DEMO_ACADEMIC_YEAR = __ENV.DEMO_ACADEMIC_YEAR || "111";
const HEADERS = { "Content-Type": "application/json" };
const transcript = JSON.parse(open("../data/transcript.json"));

export function queryBrowsing() {
  const health = http.get(`${BASE_URL}/api/health`);
  check(health, { "health is 200": (r) => r.status === 200 });

  const courses = http.get(`${BASE_URL}/api/courses?year=${DEMO_ACADEMIC_YEAR}&limit=50`);
  check(courses, { "courses is 200": (r) => r.status === 200 });

  const requirements = http.get(`${BASE_URL}/api/curriculums/${DEMO_ACADEMIC_YEAR}/requirements`);
  check(requirements, { "requirements is 200": (r) => r.status === 200 });

  const history = http.get(`${BASE_URL}/api/audit/history?userId=${DEMO_USER_ID}&limit=10`);
  check(history, { "history is 200": (r) => r.status === 200 });

  sleep(1);
}

export function auditChecking() {
  const audit = http.post(
    `${BASE_URL}/api/audit/run`,
    JSON.stringify({
      userId: DEMO_USER_ID,
      academicYear: DEMO_ACADEMIC_YEAR,
      includeInProgress: false,
      saveResult: false
    }),
    { headers: HEADERS }
  );

  check(audit, {
    "audit is 200": (r) => r.status === 200,
    "audit is not saved": (r) => {
      try {
        return r.json("saved") === false;
      } catch (_error) {
        return false;
      }
    },
    "audit has official mode": (r) => {
      try {
        return r.json("mode") === "OFFICIAL";
      } catch (_error) {
        return false;
      }
    }
  });

  sleep(1);
}

export function fullUserFlow() {
  const importResponse = http.post(
    `${BASE_URL}/api/transcripts/import`,
    JSON.stringify({
      userId: FULL_FLOW_USER_ID,
      sourceFilename: "k6-transcript.json",
      transcript
    }),
    { headers: HEADERS }
  );
  check(importResponse, {
    "transcript import is 201": (r) => r.status === 201,
    "transcript imports courses": (r) => {
      try {
        return Number(r.json("importedCourses")) > 0;
      } catch (_error) {
        return false;
      }
    }
  });

  const audit = http.post(
    `${BASE_URL}/api/audit/run`,
    JSON.stringify({
      userId: FULL_FLOW_USER_ID,
      academicYear: DEMO_ACADEMIC_YEAR,
      includeInProgress: false,
      saveResult: true
    }),
    { headers: HEADERS }
  );
  check(audit, {
    "full flow audit is 201": (r) => r.status === 201,
    "full flow audit is saved": (r) => {
      try {
        return r.json("saved") === true;
      } catch (_error) {
        return false;
      }
    }
  });

  const history = http.get(`${BASE_URL}/api/audit/history?userId=${FULL_FLOW_USER_ID}&limit=1`);
  check(history, {
    "full flow history is 200": (r) => r.status === 200,
    "full flow history has row": (r) => {
      try {
        return Number(r.json("count")) >= 1;
      } catch (_error) {
        return false;
      }
    }
  });

  sleep(2);
}
