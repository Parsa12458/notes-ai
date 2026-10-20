// ──────────────────────────────────────────────
// API Service — connects to NoteAi backend (JavaScript)
// ──────────────────────────────────────────────

export const BASE = (
  process.env.NEXT_PUBLIC_API_URL || 'https://noteai-o24g.onrender.com'
).replace(/\/+$/, '');

export const API = `${BASE}/api/v1`;

export function getFullMediaUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${BASE}${path.startsWith('/') ? '' : '/'}${path}`;
}

async function request(url, options = {}) {
  const headers = {
    Accept: 'application/json',
    ...(options.headers || {}),
  };

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorDetail = '';
    try {
      const errorJson = await res.json();
      errorDetail = errorJson.detail || errorJson.message || JSON.stringify(errorJson);
    } catch {
      errorDetail = await res.text().catch(() => '');
    }
    throw new Error(`API Error ${res.status}: ${errorDetail || res.statusText}`);
  }

  if (res.status === 204) {
    return {};
  }

  const rawText = await res.text();
  if (!rawText.trim()) {
    return {};
  }

  try {
    return JSON.parse(rawText);
  } catch {
    return rawText;
  }
}

// ── Courses ──────────────────────────────────

export async function getCourses() {
  return request(`${API}/courses/`);
}

export async function getCurrentBell() {
  return request(`${API}/courses/current_bell/`);
}

export async function createCourse(data) {
  return request(`${API}/courses/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

// ── Sessions ─────────────────────────────────

export async function getSessions(courseId) {
  const url = courseId
    ? `${API}/sessions/?course_id=${courseId}`
    : `${API}/sessions/`;
  return request(url);
}

export async function createSession(courseId, title) {
  return request(`${API}/sessions/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ course: courseId, title }),
  });
}

export async function getSessionStatus(sessionId) {
  return request(`${API}/sessions/${sessionId}/status/`);
}

export async function uploadChunk(sessionId, audioFile, chunkIndex, durationSeconds) {
  const formData = new FormData();
  const fileName = audioFile instanceof File ? audioFile.name : `chunk_${chunkIndex || 1}.webm`;
  formData.append('audio_file', audioFile, fileName);
  if (chunkIndex !== undefined && chunkIndex !== null) {
    formData.append('chunk_index', String(chunkIndex));
  }
  if (durationSeconds !== undefined && durationSeconds !== null) {
    formData.append('duration_seconds', String(durationSeconds));
  }

  return request(`${API}/sessions/${sessionId}/chunks/`, {
    method: 'POST',
    body: formData,
  });
}

export async function finalizeSession(sessionId) {
  return request(`${API}/sessions/${sessionId}/finalize/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
}

// ── Notes ────────────────────────────────────

export async function getNoteBySession(sessionId) {
  try {
    return await request(`${API}/notes/by-session/${sessionId}/`);
  } catch (err) {
    const msg = err?.message || String(err);
    if (msg.includes('404')) {
      return null;
    }
    throw err;
  }
}

export function getNoteDownloadUrl(noteId) {
  return `${API}/notes/${noteId}/download/`;
}

// ── Quizzes ──────────────────────────────────

export async function getQuizzes(sessionId) {
  try {
    return await request(`${API}/quizzes/?session_id=${sessionId}`);
  } catch (err) {
    const msg = err?.message || String(err);
    if (msg.includes('404')) {
      return [];
    }
    throw err;
  }
}

export async function submitQuiz(quizId, studentName, answers) {
  const answersMap = {};
  if (Array.isArray(answers)) {
    answers.forEach((a) => {
      answersMap[String(a.question_id)] = a.selected_choice_id;
    });
  }

  try {
    return await request(`${API}/quizzes/${quizId}/submit/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_name: studentName,
        answers,
      }),
    });
  } catch (primaryErr) {
    try {
      return await request(`${API}/quizzes/${quizId}/submit/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_name: studentName,
          answers: answersMap,
        }),
      });
    } catch {
      throw primaryErr;
    }
  }
}

// ── Flashcards ───────────────────────────────

export async function getFlashcards(sessionId) {
  try {
    return await request(`${API}/flashcards/?session_id=${sessionId}`);
  } catch (err) {
    const msg = err?.message || String(err);
    if (msg.includes('404')) {
      return [];
    }
    throw err;
  }
}

// ── Chat (RAG) ───────────────────────────────

export async function askQuestion(courseId, question, sessionId) {
  const raw = await request(`${API}/chat/conversations/ask/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      course_id: courseId,
      session_id: sessionId ?? null,
      question,
    }),
  });

  if (raw && typeof raw.answer === 'string') {
    return raw;
  }

  const messages = Array.isArray(raw?.messages) ? raw.messages : [];
  const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null;

  return {
    conversation_id: raw?.id || raw?.conversation_id || 0,
    answer: lastMsg?.content || raw?.content || 'پاسخی از مدل دریافت نشد.',
    sources: lastMsg?.sources || raw?.sources || [],
    message_id: lastMsg?.id || raw?.message_id || 0,
  };
}

