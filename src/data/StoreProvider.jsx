import { useCallback, useEffect, useMemo, useState } from 'react'
import { buildDatabase, courseById } from './seed.js'
import { t } from './i18n.js'
import { DB_KEY, daysLeft, enrollmentStatus, loadDb, SESSION_KEY, StoreContext, today } from './store.js'
// ─── Провайдер ───────────────────────────────────────────────
export function StoreProvider({ children }) {
  const [db, setDb] = useState(loadDb)
  const [session, setSession] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null')
    } catch {
      return null
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(db))
    } catch {
      /* превышена квота — изменения останутся только в памяти */
    }
  }, [db])

  useEffect(() => {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    else localStorage.removeItem(SESSION_KEY)
  }, [session])

  // ─── Аутентификация ────────────────────────────────────────
  const login = useCallback(
    (login, password) => {
      const all = [...db.admins, ...db.teachers, ...db.students]
      const user = all.find((u) => u.login.toLowerCase() === login.trim().toLowerCase())
      if (!user) return { ok: false, error: t('login.errNoUser') }
      if (user.password !== password) return { ok: false, error: t('login.errPassword') }
      setSession({ id: user.id, role: user.role })
      return { ok: true, role: user.role, name: user.name.split(' ').slice(1).join(' ') || user.name }
    },
    [db],
  )

  const logout = useCallback(() => setSession(null), [])

  const currentUser = useMemo(() => {
    if (!session) return null
    const pool = session.role === 'admin' ? db.admins : session.role === 'teacher' ? db.teachers : db.students
    return pool.find((u) => u.id === session.id) || null
  }, [session, db])

  // ─── Действия ──────────────────────────────────────────────
  const actions = useMemo(
    () => ({
      /** Админ принял офлайн-оплату → запись становится активной. */
      acceptPayment(enrollmentId, { months = 1, amount, method = 'Наличные', comment = '', by = 'A01' }) {
        setDb((prev) => {
          const e = prev.enrollments.find((x) => x.id === enrollmentId)
          if (!e) return prev
          const from = daysLeft(e.paidUntil) > 0 ? new Date(e.paidUntil) : today()
          const until = new Date(from.getTime() + months * 30 * 86400000).toISOString().slice(0, 10)
          const payment = {
            id: 'P' + Date.now().toString(36).toUpperCase(),
            enrollmentId,
            studentId: e.studentId,
            courseId: e.courseId,
            amount: amount ?? e.pricePerMonth * months,
            months,
            method,
            paidAt: new Date().toISOString().slice(0, 10),
            acceptedBy: by,
            comment,
          }
          return {
            ...prev,
            enrollments: prev.enrollments.map((x) =>
              x.id === enrollmentId ? { ...x, paidUntil: until, frozen: false } : x,
            ),
            payments: [payment, ...prev.payments],
          }
        })
      },

      /** Ручное управление статусом: заморозка / разморозка / деактивация. */
      setEnrollmentFrozen(enrollmentId, frozen) {
        setDb((prev) => ({
          ...prev,
          enrollments: prev.enrollments.map((e) => (e.id === enrollmentId ? { ...e, frozen } : e)),
        }))
      },

      deactivateEnrollment(enrollmentId) {
        setDb((prev) => ({
          ...prev,
          enrollments: prev.enrollments.map((e) =>
            e.id === enrollmentId
              ? { ...e, paidUntil: new Date(Date.now() - 86400000).toISOString().slice(0, 10) }
              : e,
          ),
        }))
      },

      /** Учитель оценивает домашнюю работу. */
      gradeSubmission(submissionId, score, feedback) {
        setDb((prev) => ({
          ...prev,
          submissions: prev.submissions.map((s) =>
            s.id === submissionId
              ? {
                  ...s,
                  status: 'graded',
                  score: Number(score),
                  feedback,
                  gradedAt: new Date().toISOString().slice(0, 10),
                  submittedAt: s.submittedAt || new Date().toISOString().slice(0, 10),
                }
              : s,
          ),
        }))
      },

      /** Учитель отмечает проведённый урок для всей группы (прогресс по курсу). */
      markLessonDone(groupId) {
        setDb((prev) => {
          const group = prev.groups.find((g) => g.id === groupId)
          if (!group) return prev
          const total = courseById(group.courseId).totalLessons
          if (group.lessonsDone >= total) return prev
          return {
            ...prev,
            groups: prev.groups.map((g) => (g.id === groupId ? { ...g, lessonsDone: g.lessonsDone + 1 } : g)),
            enrollments: prev.enrollments.map((e) =>
              e.groupId === groupId && enrollmentStatus(e) !== 'frozen'
                ? {
                    ...e,
                    lessonsCompleted: Math.min(total, e.lessonsCompleted + 1),
                    totalLessonsHeld: e.totalLessonsHeld + 1,
                    attendedLessons: e.attendedLessons + 1,
                  }
                : e,
            ),
          }
        })
      },

      /** Учитель создаёт новое ДЗ — сразу появляется у всех учеников группы. */
      createAssignment(groupId, { title, description, dueDate, maxScore = 100, teacherId }) {
        setDb((prev) => {
          const stamp = Date.now().toString(36).toUpperCase()
          const group = prev.groups.find((g) => g.id === groupId)
          const assignment = {
            id: 'H' + stamp,
            groupId,
            courseId: group.courseId,
            teacherId,
            title,
            description,
            maxScore: Number(maxScore),
            assignedAt: new Date().toISOString().slice(0, 10),
            dueDate,
          }
          const subs = prev.enrollments
            .filter((e) => e.groupId === groupId)
            .map((e, i) => ({
              id: 'SB' + stamp + i,
              assignmentId: assignment.id,
              studentId: e.studentId,
              enrollmentId: e.id,
              groupId,
              status: 'assigned',
              score: null,
              feedback: '',
              submittedAt: null,
              gradedAt: null,
              answer: '',
            }))
          return { ...prev, assignments: [assignment, ...prev.assignments], submissions: [...prev.submissions, ...subs] }
        })
      },

      /** Ученик сдаёт работу. */
      submitHomework(submissionId, answer) {
        setDb((prev) => ({
          ...prev,
          submissions: prev.submissions.map((s) =>
            s.id === submissionId
              ? { ...s, status: 'submitted', answer, submittedAt: new Date().toISOString().slice(0, 10) }
              : s,
          ),
        }))
      },

      /** Админ добавляет ученика (без оплаты — статус «Не оплачен»). */
      addStudent({ name, age, phone, parentPhone, groupIds }) {
        setDb((prev) => {
          const stamp = Date.now().toString(36).toUpperCase()
          const id = 'S' + stamp
          const student = {
            id,
            role: 'student',
            name,
            login: 'user' + stamp.toLowerCase(),
            password: 'student',
            age: Number(age) || 0,
            phone,
            parentPhone: parentPhone || null,
            email: '',
            joinedAt: new Date().toISOString().slice(0, 10),
            note: '',
          }
          const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
          const newEnrollments = groupIds.map((gid, i) => {
            const g = prev.groups.find((x) => x.id === gid)
            return {
              id: 'E' + stamp + i,
              studentId: id,
              groupId: gid,
              courseId: g.courseId,
              enrolledAt: student.joinedAt,
              paidUntil: yesterday, // ещё не оплачено
              frozen: false,
              pricePerMonth: courseById(g.courseId).price,
              lessonsCompleted: 0,
              attendedLessons: 0,
              totalLessonsHeld: 0,
            }
          })
          const newSubs = []
          newEnrollments.forEach((e) => {
            prev.assignments
              .filter((a) => a.groupId === e.groupId)
              .forEach((a, i) => {
                newSubs.push({
                  id: 'SB' + stamp + e.id + i,
                  assignmentId: a.id,
                  studentId: id,
                  enrollmentId: e.id,
                  groupId: e.groupId,
                  status: 'assigned',
                  score: null,
                  feedback: '',
                  submittedAt: null,
                  gradedAt: null,
                  answer: '',
                })
              })
          })
          return {
            ...prev,
            students: [student, ...prev.students],
            enrollments: [...prev.enrollments, ...newEnrollments],
            submissions: [...prev.submissions, ...newSubs],
          }
        })
      },

      /** Записать существующего ученика ещё на один курс. */
      enrollStudent(studentId, groupId) {
        setDb((prev) => {
          if (prev.enrollments.some((e) => e.studentId === studentId && e.groupId === groupId)) return prev
          const stamp = Date.now().toString(36).toUpperCase()
          const g = prev.groups.find((x) => x.id === groupId)
          const e = {
            id: 'E' + stamp,
            studentId,
            groupId,
            courseId: g.courseId,
            enrolledAt: new Date().toISOString().slice(0, 10),
            paidUntil: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
            frozen: false,
            pricePerMonth: courseById(g.courseId).price,
            lessonsCompleted: 0,
            attendedLessons: 0,
            totalLessonsHeld: 0,
          }
          const subs = prev.assignments
            .filter((a) => a.groupId === groupId)
            .map((a, i) => ({
              id: 'SB' + stamp + i,
              assignmentId: a.id,
              studentId,
              enrollmentId: e.id,
              groupId,
              status: 'assigned',
              score: null,
              feedback: '',
              submittedAt: null,
              gradedAt: null,
              answer: '',
            }))
          return { ...prev, enrollments: [...prev.enrollments, e], submissions: [...prev.submissions, ...subs] }
        })
      },

      updateStudent(studentId, patch) {
        setDb((prev) => ({
          ...prev,
          students: prev.students.map((s) => (s.id === studentId ? { ...s, ...patch } : s)),
        }))
      },

      resetDatabase() {
        localStorage.removeItem(DB_KEY)
        setDb(buildDatabase())
      },
    }),
    [],
  )

  const value = useMemo(() => ({ db, session, currentUser, login, logout, ...actions }), [db, session, currentUser, login, logout, actions])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}
