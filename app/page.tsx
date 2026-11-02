"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";

type Assignment = {
  number: 1 | 2 | 3 | 4 | 5;
  title: string | null;
  status: "submitted" | "not_submitted" | "unassigned" | "needs_check";
  submittedAt: string | null;
  note: string | null;
};

type Course = {
  name: string;
  section: string;
  assignments: Assignment[];
};

type LookupResult = {
  asOf: string;
  demo: boolean;
  courses: Course[];
};

type SiteStatus = {
  asOf: string | null;
  demo: boolean;
};

type ViewState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; result: LookupResult; studentId: string }
  | { kind: "invalid"; message: string }
  | { kind: "not-found" }
  | { kind: "failed"; message: string };

const STATUS_LABEL: Record<Assignment["status"], string> = {
  submitted: "제출",
  not_submitted: "미제출",
  unassigned: "과제 미지정",
  needs_check: "확인 필요",
};

function formatDate(value: string | null) {
  if (!value) return "—";
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (dateOnly) return `${dateOnly[1]}.${dateOnly[2]}.${dateOnly[3]}`;
  const localKst = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}(?::\d{2})?)$/.exec(value);
  const date = new Date(localKst ? `${localKst[1]}T${localKst[2]}+09:00` : value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: localKst && localKst[2].length === 5 ? undefined : "2-digit",
    hourCycle: "h23",
    timeZone: "Asia/Seoul",
  }).format(date);
}

function statusMessage(state: ViewState, input: string) {
  if (state.kind === "loading") return "학번을 조회하고 있습니다.";
  if (state.kind === "invalid") return state.message;
  if (state.kind === "not-found") return "등록된 학번을 찾지 못했습니다. 학번을 확인해 주세요.";
  if (state.kind === "failed") return state.message;
  if (state.kind === "success") return `${state.studentId} 학번의 제출 현황을 표시합니다.`;
  if (input.length > 0) return "학번이 바뀌어 이전 조회 결과를 지웠습니다.";
  return "학번 8자리를 입력한 뒤 조회해 주세요.";
}

export default function Home({ request = fetch }: { request?: typeof fetch } = {}) {
  const [studentId, setStudentId] = useState("");
  const [view, setView] = useState<ViewState>({ kind: "idle" });
  const [siteDemo, setSiteDemo] = useState(false);
  const requestSequence = useRef(0);

  useEffect(() => {
    let active = true;
    request("/api/status", { method: "GET" })
      .then(async (response) => {
        if (!response.ok) return;
        const status = (await response.json()) as SiteStatus;
        if (active && typeof status?.demo === "boolean") setSiteDemo(status.demo);
      })
      .catch(() => {
        // A status lookup failure must not block the regular student lookup.
      });
    return () => { active = false; };
  }, [request]);

  function updateStudentId(value: string) {
    const next = value.replace(/\D/g, "").slice(0, 8);
    requestSequence.current += 1;
    setStudentId(next);
    setView({ kind: "idle" });
  }

  async function lookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^\d{8}$/.test(studentId)) {
      setView({ kind: "invalid", message: "학번 8자리를 입력해 주세요." });
      return;
    }

    const requestedId = studentId;
    const sequence = ++requestSequence.current;
    setView({ kind: "loading" });
    try {
      const response = await request("/api/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: requestedId }),
      });
      if (sequence !== requestSequence.current) return;

      const body = response.ok ? null : await response.json().catch(() => null) as { error?: unknown } | null;
      const serverError = typeof body?.error === "string" ? body.error : null;
      if (response.status === 404) {
        setView({ kind: "not-found" });
        return;
      }
      if (!response.ok) {
        setView({
          kind: "failed",
          message: serverError ?? (response.status >= 500
            ? "서버에서 조회하지 못했습니다. 잠시 후 다시 시도해 주세요."
            : "조회에 실패했습니다. 입력한 학번을 확인해 주세요."),
        });
        return;
      }

      const result = (await response.json()) as LookupResult;
      if (sequence !== requestSequence.current) return;
      if (!result || !Array.isArray(result.courses) || typeof result.asOf !== "string") {
        setView({ kind: "failed", message: "조회 결과를 읽지 못했습니다. 잠시 후 다시 시도해 주세요." });
        return;
      }
      setView({ kind: "success", result, studentId: requestedId });
    } catch {
      if (sequence !== requestSequence.current) return;
      setView({ kind: "failed", message: "서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요." });
    }
  }

  const result = view.kind === "success" ? view.result : null;

  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="wordmark" href="#main" aria-label="Extra Credit 제출 조회 홈">
          <span className="wordmark-mark" aria-hidden="true">EC</span>
          <span>SEOULTECH <span className="wordmark-divider">/</span> 학습 확인</span>
        </a>
        <span className="term-label">2026-2</span>
      </header>

      <div className="content" id="main">
        <section className="intro" aria-labelledby="page-title">
          <p className="eyebrow">EXTRA CREDIT · 2026-2</p>
          <h1 id="page-title">제출 현황 조회</h1>
          <p className="intro-copy">학번을 입력하면 본인 수업의 Extra Credit 제출 상태를 확인할 수 있습니다.</p>
        </section>

        {(result?.demo ?? siteDemo) && (
          <div className="demo-banner" role="note">
            <span className="demo-dot" aria-hidden="true" />
            <strong>검토용 예시 · 실제 학생 정보 없음</strong>
            <span className="demo-samples">예시 학번 00000001 / 00000002</span>
          </div>
        )}

        <section className="lookup-card" aria-label="학번 조회" aria-busy={view.kind === "loading"}>
          <form onSubmit={lookup} noValidate>
            <label htmlFor="student-id">학번</label>
            <div className="form-row">
              <div className="input-wrap">
                <input
                  id="student-id"
                  name="studentId"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  pattern="[0-9]{8}"
                  maxLength={8}
                  placeholder="학번 8자리"
                  value={studentId}
                  onChange={(event) => updateStudentId(event.target.value)}
                  aria-describedby="student-id-help status-message"
                  aria-invalid={view.kind === "invalid"}
                />
                <span className="input-count" aria-hidden="true">{studentId.length}/8</span>
              </div>
              <button type="submit" disabled={view.kind === "loading"}>
                {view.kind === "loading" ? <><span className="spinner" aria-hidden="true" /> 조회 중</> : <>조회 <span aria-hidden="true">→</span></>}
              </button>
            </div>
            <p className="field-help" id="student-id-help">숫자 8자리로 입력해 주세요.</p>
          </form>
        </section>

        <p className={`status-message ${view.kind === "failed" || view.kind === "invalid" || view.kind === "not-found" ? "is-error" : ""}`} id="status-message" role="status" aria-live="polite" aria-atomic="true">
          {statusMessage(view, studentId)}
        </p>

        {view.kind === "success" && result && (
          <section className="results" aria-label="Extra Credit 제출 현황">
            <div className="results-heading">
              <div>
                <p className="eyebrow">조회 결과</p>
                <h2>내 제출 현황</h2>
              </div>
              <p className="as-of">조회 기준 <time dateTime={result.asOf}>{formatDate(result.asOf)}</time></p>
            </div>

            {result.courses.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon" aria-hidden="true">—</span>
                <p>조회할 수업이 없습니다.</p>
              </div>
            ) : result.courses.map((course) => (
              <article className="course-card" key={`${course.name}-${course.section}`}>
                <div className="course-heading">
                  <div>
                    <p className="course-kicker">수업</p>
                    <h3>{course.name}</h3>
                  </div>
                  <span className="section-tag">분반 {course.section}</span>
                </div>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th scope="col">과제</th>
                        <th scope="col">제출 여부</th>
                        <th scope="col">제출 일시</th>
                      </tr>
                    </thead>
                    <tbody>
                      {course.assignments
                        .slice()
                        .sort((a, b) => a.number - b.number)
                        .map((assignment) => (
                          <tr key={assignment.number}>
                            <th scope="row">
                              <span className="assignment-number">Extra Credit #{assignment.number}</span>
                              {assignment.title && <span className="assignment-title">{assignment.title}</span>}
                              {assignment.note && <span className="row-note">{assignment.note}</span>}
                            </th>
                            <td>
                              <span className={`status-pill status-${assignment.status}`}>
                                <span className="status-dot" aria-hidden="true" />
                                {STATUS_LABEL[assignment.status]}
                              </span>
                            </td>
                            <td className="date-cell">{assignment.submittedAt ? formatDate(assignment.submittedAt) : "—"}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </article>
            ))}

            <p className="receipt-note">제출 일시는 확인된 수신 시각입니다. 제출 파일만 확인된 건은 수신 시각을 별도로 표시하지 않습니다.</p>
          </section>
        )}
      </div>

      <footer className="footer">
        <span>2026-2 Extra Credit 제출 조회</span>
        <span className="footer-mark">SEOULTECH</span>
      </footer>
    </main>
  );
}
