import { createContext, useContext } from 'react'
import { t } from './i18n.js'
import { buildDatabase, courseById, COURSES, SEED_VERSION } from './seed.js'

export const DB_KEY = 'vibrant.db'
export const SESSION_KEY = 'vibrant.session'

export const StoreContext = createContext(null)

export function loadDb() {
  try {
    const raw = localStorage.getItem(DB_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed.version === SEED_VERSION) return parsed
    }
  } catch {
    /* повреждённые данные — пересоздаём */
  }
  const fresh = buildDatabase()
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(fresh))
  } catch {
    /* квота — работаем в памяти */
  }
  return fresh
}

// ─── Даты и статусы ──────────────────────────────────────────
export const today = () => new Date(new Date().toISOString().slice(0, 10))

export function daysLeft(dateStr) {
  if (!dateStr) return -9999
  return Math.round((new Date(dateStr) - today()) / 86400000)
}

/** Статус конкретной записи на курс. Активен = курс оплачен. */
export function enrollmentStatus(enrollment) {
  if (!enrollment) return 'inactive'
  if (enrollment.frozen) return 'frozen'
  const d = daysLeft(enrollment.paidUntil)
  if (d < 0) return 'unpaid'
  if (d <= 5) return 'expiring'
  return 'active'
}

/** Сводный статус ученика по всем его курсам. */
export function studentStatus(enrollments) {
  if (!enrollments.length) return 'inactive'
  const st = enrollments.map(enrollmentStatus)
  if (st.includes('active')) return 'active'
  if (st.includes('expiring')) return 'expiring'
  if (st.includes('unpaid')) return 'unpaid'
  return 'frozen'
}

/** Подписи статусов берутся из словаря в момент отрисовки — язык переключается на лету. */
const statusMeta = (key, tone) => ({
  tone,
  get label() {
    return t('status.' + key)
  },
  get hint() {
    return t('statusHint.' + key)
  },
})

export const STATUS_META = {
  active: statusMeta('active', 'ok'),
  expiring: statusMeta('expiring', 'warn'),
  unpaid: statusMeta('unpaid', 'bad'),
  frozen: statusMeta('frozen', 'muted'),
  inactive: statusMeta('inactive', 'muted'),
}

const hwMeta = (key, tone) => ({
  tone,
  get label() {
    return t('hw.' + key)
  },
})

export const HW_META = {
  graded: hwMeta('graded', 'ok'),
  submitted: hwMeta('submitted', 'info'),
  assigned: hwMeta('assigned', 'muted'),
  missing: hwMeta('missing', 'bad'),
}

export function performanceLabel(avg) {
  if (avg == null) return { label: t('perf.none'), tone: 'muted' }
  if (avg >= 90) return { label: t('perf.excellent'), tone: 'ok' }
  if (avg >= 75) return { label: t('perf.good'), tone: 'info' }
  if (avg >= 60) return { label: t('perf.ok'), tone: 'warn' }
  return { label: t('perf.attention'), tone: 'bad' }
}

export { fmtDate, money } from './i18n.js'
export const initials = (name) =>
  name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore должен использоваться внутри StoreProvider')
  return ctx
}

// ─── Селекторы (чистые функции над db) ───────────────────────
export function selectStudentProfile(db, studentId) {
  const student = db.students.find((s) => s.id === studentId)
  if (!student) return null
  const enrollments = db.enrollments.filter((e) => e.studentId === studentId)

  const courses = enrollments.map((e) => {
    const group = db.groups.find((g) => g.id === e.groupId)
    const teacher = db.teachers.find((t) => t.id === group?.teacherId)
    const course = courseById(e.courseId)
    const subs = db.submissions.filter((s) => s.enrollmentId === e.id)
    const graded = subs.filter((s) => s.status === 'graded')
    const avg = graded.length ? Math.round(graded.reduce((a, s) => a + s.score, 0) / graded.length) : null
    const done = graded.length
    const totalHw = subs.length
    return {
      enrollment: e,
      group,
      teacher,
      course,
      status: enrollmentStatus(e),
      daysLeft: daysLeft(e.paidUntil),
      courseProgress: course ? Math.round((e.lessonsCompleted / course.totalLessons) * 100) : 0,
      hwProgress: totalHw ? Math.round((done / totalHw) * 100) : 0,
      hwDone: done,
      hwTotal: totalHw,
      hwPending: subs.filter((s) => s.status === 'submitted').length,
      hwMissing: subs.filter((s) => s.status === 'missing').length,
      avgScore: avg,
      attendance: e.totalLessonsHeld ? Math.round((e.attendedLessons / e.totalLessonsHeld) * 100) : 0,
    }
  })

  const allGraded = courses.flatMap((c) => (c.avgScore == null ? [] : [c.avgScore]))
  const avgScore = allGraded.length ? Math.round(allGraded.reduce((a, b) => a + b, 0) / allGraded.length) : null
  const hwTotal = courses.reduce((a, c) => a + c.hwTotal, 0)
  const hwDone = courses.reduce((a, c) => a + c.hwDone, 0)

  return {
    student,
    courses,
    status: studentStatus(enrollments),
    avgScore,
    performance: performanceLabel(avgScore),
    hwTotal,
    hwDone,
    hwProgress: hwTotal ? Math.round((hwDone / hwTotal) * 100) : 0,
    hwMissing: courses.reduce((a, c) => a + c.hwMissing, 0),
    hwPending: courses.reduce((a, c) => a + c.hwPending, 0),
    attendance: courses.length ? Math.round(courses.reduce((a, c) => a + c.attendance, 0) / courses.length) : 0,
    courseProgress: courses.length ? Math.round(courses.reduce((a, c) => a + c.courseProgress, 0) / courses.length) : 0,
    debt: courses.filter((c) => c.status === 'unpaid').reduce((a, c) => a + c.enrollment.pricePerMonth, 0),
  }
}

export function selectAllProfiles(db) {
  return db.students.map((s) => selectStudentProfile(db, s.id))
}

export function selectCourseStats(db) {
  return COURSES.map((course) => {
    const enrollments = db.enrollments.filter((e) => e.courseId === course.id)
    const groups = db.groups.filter((g) => g.courseId === course.id)
    const active = enrollments.filter((e) => enrollmentStatus(e) === 'active').length
    const subs = db.submissions.filter((s) => enrollments.some((e) => e.id === s.enrollmentId) && s.status === 'graded')
    const avg = subs.length ? Math.round(subs.reduce((a, s) => a + s.score, 0) / subs.length) : null
    return {
      course,
      groups,
      teachers: [...new Set(groups.map((g) => g.teacherId))],
      students: enrollments.length,
      active,
      unpaid: enrollments.filter((e) => enrollmentStatus(e) === 'unpaid').length,
      revenue: active * course.price,
      avgScore: avg,
      avgProgress: enrollments.length
        ? Math.round((enrollments.reduce((a, e) => a + e.lessonsCompleted, 0) / enrollments.length / course.totalLessons) * 100)
        : 0,
    }
  })
}

export { COURSES, courseById }
