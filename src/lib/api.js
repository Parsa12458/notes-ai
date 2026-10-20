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

export async function getCourse(courseId) {
  return request(`${API}/courses/${courseId}/`);
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

export async function updateCourse(courseId, data) {
  return request(`${API}/courses/${courseId}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function deleteCourse(courseId) {
  return request(`${API}/courses/${courseId}/`, {
    method: 'DELETE',
  });
}

// ── Classrooms ───────────────────────────────

export async function getClassrooms() {
  return request(`${API}/classrooms/`);
}

export async function createClassroom(data) {
  return request(`${API}/classrooms/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

// ── Schedules ────────────────────────────────

export async function getSchedules(courseId) {
  const url = courseId ? `${API}/schedules/?course=${courseId}` : `${API}/schedules/`;
  return request(url);
}

export async function createSchedule(data) {
  return request(`${API}/schedules/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function deleteSchedule(scheduleId) {
  return request(`${API}/schedules/${scheduleId}/`, {
    method: 'DELETE',
  });
}

// ── Sessions ─────────────────────────────────

export async function getSessions(courseId) {
  const url = courseId
    ? `${API}/sessions/?course_id=${courseId}`
    : `${API}/sessions/`;
  return request(url);
}

export async function getSession(sessionId) {
  return request(`${API}/sessions/${sessionId}/`);
}

export async function createSession(courseId, title) {
  return request(`${API}/sessions/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ course: courseId, title }),
  });
}

export async function updateSession(sessionId, data) {
  return request(`${API}/sessions/${sessionId}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function deleteSession(sessionId) {
  return request(`${API}/sessions/${sessionId}/`, {
    method: 'DELETE',
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

export async function getNote(noteId) {
  return request(`${API}/notes/${noteId}/`);
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

export async function generateQuiz(sessionId, title, description = '') {
  return request(`${API}/quizzes/generate/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session: sessionId,
      title: title || 'کوییز سنجش یادگیری جلسه',
      description,
    }),
  });
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

// ── Tips ─────────────────────────────────────

export async function getTips(sessionId) {
  const url = sessionId ? `${API}/tips/?session_id=${sessionId}` : `${API}/tips/`;
  return request(url);
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

export async function getConversations() {
  return request(`${API}/chat/conversations/`);
}

export async function deleteConversation(conversationId) {
  return request(`${API}/chat/conversations/${conversationId}/`, {
    method: 'DELETE',
  });
}
