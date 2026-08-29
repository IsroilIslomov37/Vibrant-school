import { useMemo, useState } from 'react'
import { Layout } from '../components/Layout.jsx'
import {
  CourseIcon,
  IconAssignments,
  IconClock,
  IconDashboard,
  IconGrading,
  IconGroups,
  IconOk,
  IconPlus,
  IconSearch,
  IconStar,
  IconStudents,
  IconWarning,
  IconCheck,
} from '../components/icons.jsx'
import { Avatar, Badge, Card, Empty, Field, Kpi, Modal, Progress, Segmented } from '../components/ui.jsx'
import { courseById } from '../data/seed.js'
import { answerText, feedbackText, levelLabel, roomLabel, scheduleLabel, t } from '../data/i18n.js'
import {
  enrollmentStatus,
  fmtDate,
  HW_META,
  performanceLabel,
  selectStudentProfile,
  STATUS_META,
  useStore,
} from '../data/store.js'
import StudentDetail from './StudentDetail.jsx'

export default function TeacherApp() {
  const { db, currentUser } = useStore()
  const [route, setRoute] = useState({ page: 'dashboard', params: {} })
  const go = (page, params = {}) => setRoute({ page, params })

  const course = courseById(currentUser.courseId)
  const myGroups = useMemo(() => db.groups.filter((g) => g.teacherId === currentUser.id), [db, currentUser])
  const groupIds = useMemo(() => new Set(myGroups.map((g) => g.id)), [myGroups])
  const myEnrollments = useMemo(() => db.enrollments.filter((e) => groupIds.has(e.groupId)), [db, groupIds])
  const myAssignments = useMemo(() => db.assignments.filter((a) => groupIds.has(a.groupId)), [db, groupIds])
  const mySubs = useMemo(() => db.submissions.filter((s) => groupIds.has(s.groupId)), [db, groupIds])
  const pending = mySubs.filter((s) => s.status === 'submitted')

  const nav = [
    {
      title: t('group.learning'),
      items: [
        { id: 'dashboard', icon: IconDashboard, label: t('nav.overview') },
        { id: 'grading', icon: IconGrading, label: t('nav.grading'), count: pending.length, alert: pending.length > 0 },
        { id: 'assignments', icon: IconAssignments, label: t('nav.assignments'), count: myAssignments.length },
      ],
    },
    {
      title: t('group.people'),
      items: [
        { id: 'groups', icon: IconGroups, label: t('nav.myGroups'), count: myGroups.length },
        { id: 'students', icon: IconStudents, label: t('nav.myStudents'), count: new Set(myEnrollments.map((e) => e.studentId)).size },
      ],
    },
  ]

  const TITLES = {
    dashboard: [t('teacher.titleDashboard'), t('teacher.subDashboard')],
    grading: [t('teacher.titleGrading'), t('teacher.subGrading')],
    groups: [t('teacher.titleGroups'), t('teacher.subGroups')],
    students: [t('teacher.titleStudents'), t('teacher.subStudents')],
    assignments: [t('teacher.titleAssignments'), t('teacher.subAssignments')],
    student: [t('teacher.titleStudent'), t('teacher.subStudent')],
  }
  const [title, sub] = TITLES[route.page]
  const ctx = { myGroups, myEnrollments, myAssignments, mySubs, pending, course, go }

  return (
    <Layout
      nav={nav}
      route={route}
      go={go}
      title={title}
      sub={sub}
      actions={<Badge tone="brand" lg><CourseIcon id={course.id} /> {course.name}</Badge>}
    >
      {route.page === 'dashboard' && <Dashboard ctx={ctx} />}
      {route.page === 'grading' && <GradingPage ctx={ctx} />}
      {route.page === 'assignments' && <AssignmentsPage ctx={ctx} />}
      {route.page === 'groups' && <GroupsPage ctx={ctx} />}
      {route.page === 'students' && <StudentsPage ctx={ctx} />}
      {route.page === 'student' && (
        <StudentDetail
          studentId={route.params.id}
          role="teacher"
          onBack={() => go('students')}
          backLabel={t('detail.backTeacher')}
        />
      )}
    </Layout>
  )
}

/* ─── Обзор ────────────────────────────────────────────────── */
function Dashboard({ ctx }) {
  const { db, currentUser } = useStore()
  const { myGroups, myEnrollments, mySubs, pending, course, go } = ctx

  const graded = mySubs.filter((s) => s.status === 'graded')
  const avg = graded.length ? Math.round(graded.reduce((a, s) => a + s.score, 0) / graded.length) : 0
  const missing = mySubs.filter((s) => s.status === 'missing').length
  const studentIds = [...new Set(myEnrollments.map((e) => e.studentId))]
  const unpaid = myEnrollments.filter((e) => enrollmentStatus(e) === 'unpaid').length

  const top = studentIds
    .map((id) => selectStudentProfile(db, id))
    .filter((p) => p.avgScore != null)
    .sort((a, b) => b.avgScore - a.avgScore)

  return (
    <div className="stack">
      <div
        className="card"
        style={{ padding: 20, background: `linear-gradient(120deg, ${course.color} 0%, ${course.color}bb 100%)`, border: 0, color: '#fff' }}
      >
        <div className="row wrap" style={{ gap: 16 }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <h1 style={{ fontSize: 23, color: '#fff' }}>{t('teacher.hello', { name: currentUser.name.split(' ')[1] })}</h1>
            <p style={{ opacity: 0.9, marginTop: 5 }}>
              {t('teacher.subline', {
                title: currentUser.title || t('role.teacher'),
                course: course.name,
                n: currentUser.experience,
              })}
            </p>
          </div>
          {pending.length > 0 && (
            <button className="btn" onClick={() => go('grading')} style={{ background: '#fff', borderColor: '#fff', color: '#17181c' }}>
              <IconOk /> {t('teacher.checkWorks', { n: pending.length })}
            </button>
          )}
        </div>
      </div>

      <div className="grid g4">
        <Kpi label={t('teacher.kpiPending')} value={pending.length} foot={t('teacher.kpiPendingFoot')} icon={IconClock} tone={pending.length ? 'warn' : 'muted'} />
        <Kpi label={t('teacher.kpiStudents')} value={studentIds.length} foot={t('teacher.kpiStudentsFoot', { n: myGroups.length })} icon={IconStudents} tone="brand" />
        <Kpi label={t('admin.kpiAvg')} value={avg} foot={t('teacher.kpiAvgFoot', { n: graded.length })} icon={IconStar} tone="ok" />
        <Kpi
          label={t('teacher.kpiMissing')}
          value={missing}
          foot={unpaid ? t('teacher.kpiMissingUnpaid', { n: unpaid }) : t('teacher.kpiMissingOk')}
          icon={IconWarning}
          tone={missing ? 'bad' : 'muted'}
        />
      </div>

      <div className="grid g-2-1">
        <Card title={t('teacher.myGroups')} sub={t('teacher.myGroupsSub')} tight>
          {myGroups.map((g) => {
            const enr = myEnrollments.filter((e) => e.groupId === g.id)
            const p = Math.round((g.lessonsDone / course.totalLessons) * 100)
            return (
              <div className="list-item" key={g.id}>
                <div className="avatar sm" style={{ background: course.color + '22', color: course.color }}><CourseIcon id={course.id} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <b style={{ fontSize: 13 }}>{g.name} · {levelLabel(g.level)}</b>
                  <div className="small muted">
                    {scheduleLabel(g)} · {roomLabel(g.room)} · {t('unit.students', { n: enr.length })}
                  </div>
                </div>
                <div style={{ width: 150 }}><Progress value={p} tone="info" /></div>
              </div>
            )
          })}
        </Card>

        <Card title={t('teacher.performance')} sub={t('teacher.performanceSub')} tight>
          {top.slice(0, 4).map((p) => (<StudentRow key={p.student.id} p={p} go={go} />))}
          {top.length > 4 && <div className="divider" />}
          {top.slice(-3).reverse().map((p) => (<StudentRow key={'w' + p.student.id} p={p} go={go} />))}
        </Card>
      </div>
    </div>
  )
}

function StudentRow({ p, go }) {
  return (
    <div className="list-item" style={{ cursor: 'pointer' }} onClick={() => go('student', { id: p.student.id })}>
      <Avatar name={p.student.name} size="sm" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <b style={{ fontSize: 13 }}>{p.student.name}</b>
        <div className="small muted">{t('teacher.rowSub', { a: p.hwDone, b: p.hwTotal, n: p.attendance })}</div>
      </div>
      <Badge tone={performanceLabel(p.avgScore).tone}>{p.avgScore}</Badge>
    </div>
  )
}

/* ─── Проверка ДЗ ──────────────────────────────────────────── */
function GradingPage({ ctx }) {
  const { db } = useStore()
  const { myGroups, mySubs } = ctx
  const [filter, setFilter] = useState('submitted')
  const [group, setGroup] = useState('all')
  const [grading, setGrading] = useState(null)

  const rows = mySubs
    .filter((s) => (filter === 'all' ? true : s.status === filter))
    .filter((s) => group === 'all' || s.groupId === group)
    .map((s) => ({
      s,
      student: db.students.find((x) => x.id === s.studentId),
      assignment: db.assignments.find((a) => a.id === s.assignmentId),
      group: myGroups.find((g) => g.id === s.groupId),
    }))
    .filter((r) => r.assignment && r.student)
    .sort((a, b) => (a.s.submittedAt || '').localeCompare(b.s.submittedAt || ''))

  const counts = {
    submitted: mySubs.filter((s) => s.status === 'submitted').length,
    missing: mySubs.filter((s) => s.status === 'missing').length,
    graded: mySubs.filter((s) => s.status === 'graded').length,
  }

  return (
    <div className="stack">
      <div className="row wrap" style={{ gap: 10 }}>
        <Segmented
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'submitted', label: t('teacher.segSubmitted'), count: counts.submitted },
            { value: 'missing', label: t('teacher.segMissing'), count: counts.missing },
            { value: 'graded', label: t('teacher.segGraded'), count: counts.graded },
            { value: 'all', label: t('common.all') },
          ]}
        />
        <select className="select" style={{ width: 200 }} value={group} onChange={(e) => setGroup(e.target.value)}>
          <option value="all">{t('common.allGroups')}</option>
          {myGroups.map((g) => (<option key={g.id} value={g.id}>{g.name} · {levelLabel(g.level)}</option>))}
        </select>
      </div>

      <Card tight>
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>{t('common.student')}</th>
                <th>{t('common.task')}</th>
                <th>{t('common.group')}</th>
                <th>{t('teacher.colSubmitted')}</th>
                <th>{t('common.status')}</th>
                <th>{t('common.grade')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 120).map((r) => {
                const m = HW_META[r.s.status]
                return (
                  <tr key={r.s.id}>
                    <td>
                      <div className="cell-user">
                        <Avatar name={r.student.name} size="sm" />
                        <div><b>{r.student.name}</b><span>{r.student.id}</span></div>
                      </div>
                    </td>
                    <td>
                      <b className="small">{r.assignment.title}</b>
                      <div className="small muted">{t('teacher.dueAt', { date: fmtDate(r.assignment.dueDate) })}</div>
                    </td>
                    <td className="small">{r.group?.name}</td>
                    <td className="small mono">{r.s.submittedAt ? fmtDate(r.s.submittedAt) : '—'}</td>
                    <td><Badge tone={m.tone} dot>{m.label}</Badge></td>
                    <td className="mono"><b>{r.s.score ?? '—'}</b></td>
                    <td style={{ textAlign: 'right' }}>
                      <button className={'btn sm ' + (r.s.status === 'graded' ? '' : 'primary')} onClick={() => setGrading(r)}>
                        {r.s.status === 'graded' ? t('teacher.regrade') : t('teacher.grade')}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {!rows.length && <Empty icon={IconOk} title={t('teacher.allChecked')} text={t('teacher.allCheckedSub')} />}
      </Card>

      {grading && <GradeModal row={grading} onClose={() => setGrading(null)} />}
    </div>
  )
}

function GradeModal({ row, onClose }) {
  const { gradeSubmission } = useStore()
  const { s, student, assignment } = row
  const [score, setScore] = useState(s.score ?? '')
  const [feedback, setFeedback] = useState(feedbackText(s.feedback))

  const quick = [
    { v: 95, l: t('teacher.quickExcellent'), text: t('teacher.fbExcellent') },
    { v: 82, l: t('teacher.quickGood'), text: t('teacher.fbGood') },
    { v: 68, l: t('teacher.quickOk'), text: t('teacher.fbOk') },
    { v: 45, l: t('teacher.quickWeak'), text: t('teacher.fbWeak') },
  ]

  const valid = score !== '' && Number(score) >= 0 && Number(score) <= assignment.maxScore

  return (
    <Modal
      title={t('teacher.gradeTitle')}
      sub={`${student.name} · ${assignment.title}`}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>{t('common.cancel')}</button>
          <button
            className="btn success"
            disabled={!valid}
            onClick={() => {
              gradeSubmission(s.id, score, feedback)
              onClose()
            }}
          >
            <IconCheck /> {t('teacher.saveGrade')}
          </button>
        </>
      }
    >
      <div className="stack">
        <div className="card" style={{ padding: '4px 14px' }}>
          <div className="kv"><span>{t('teacher.dueDate')}</span><b>{fmtDate(assignment.dueDate)}</b></div>
          <div className="kv"><span>{t('teacher.submittedAt')}</span><b>{s.submittedAt ? fmtDate(s.submittedAt) : t('teacher.notInTime')}</b></div>
          <div className="kv"><span>{t('common.maxScore')}</span><b>{assignment.maxScore}</b></div>
        </div>

        <Field label={t('teacher.studentWork')}>
          <div className="card" style={{ padding: 12, background: 'var(--surface-2)' }}>
            <p className="small">{answerText(s.answer) || t('teacher.noWork')}</p>
          </div>
        </Field>

        <Field label={t('teacher.scoreLabel', { max: assignment.maxScore })}>
          <input className="input" type="number" min="0" max={assignment.maxScore} value={score} onChange={(e) => setScore(e.target.value)} />
        </Field>

        <div className="row wrap" style={{ gap: 6 }}>
          {quick.map((q) => (
            <button
              key={q.v}
              className="btn sm"
              onClick={() => {
                setScore(q.v)
                setFeedback(q.text)
              }}
            >
              {q.l} · {q.v}
            </button>
          ))}
        </div>

        <Field label={t('teacher.feedbackLabel')}>
          <textarea
            className="textarea"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder={t('teacher.feedbackPlaceholder')}
          />
        </Field>
      </div>
    </Modal>
  )
}

/* ─── Задания ──────────────────────────────────────────────── */
function AssignmentsPage({ ctx }) {
  const { db, currentUser, createAssignment } = useStore()
  const { myGroups, myAssignments, mySubs } = ctx
  const [creating, setCreating] = useState(false)

  const rows = myAssignments
    .map((a) => {
      const subs = mySubs.filter((s) => s.assignmentId === a.id)
      const graded = subs.filter((s) => s.status === 'graded')
      return {
        a,
        group: myGroups.find((g) => g.id === a.groupId),
        total: subs.length,
        graded: graded.length,
        pending: subs.filter((s) => s.status === 'submitted').length,
        missing: subs.filter((s) => s.status === 'missing').length,
        avg: graded.length ? Math.round(graded.reduce((x, s) => x + s.score, 0) / graded.length) : null,
      }
    })
    .sort((x, y) => y.a.dueDate.localeCompare(x.a.dueDate))

  return (
    <div className="stack">
      <div className="row">
        <span className="small muted">{t('teacher.totalTasks', { n: rows.length })}</span>
        <button className="btn primary spacer" onClick={() => setCreating(true)}><IconPlus /> {t('teacher.newTask')}</button>
      </div>

      <Card tight>
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>{t('common.task')}</th>
                <th>{t('common.group')}</th>
                <th>{t('teacher.colAssigned')}</th>
                <th>{t('common.deadline')}</th>
                <th>{t('admin.colGraded')}</th>
                <th>{t('admin.colPending')}</th>
                <th>{t('admin.colMissing')}</th>
                <th>{t('common.avgScore')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.a.id}>
                  <td><b>{r.a.title}</b></td>
                  <td className="small">{r.group?.name}</td>
                  <td className="mono small">{fmtDate(r.a.assignedAt)}</td>
                  <td className="mono small">{fmtDate(r.a.dueDate)}</td>
                  <td style={{ minWidth: 130 }}>
                    <Progress value={r.total ? Math.round((r.graded / r.total) * 100) : 0} tone="ok" />
                    <span className="small muted mono">{r.graded}/{r.total}</span>
                  </td>
                  <td>{r.pending ? <Badge tone="info">{r.pending}</Badge> : <span className="muted">—</span>}</td>
                  <td>{r.missing ? <Badge tone="bad">{r.missing}</Badge> : <span className="muted">—</span>}</td>
                  <td className="mono"><b>{r.avg ?? '—'}</b></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!rows.length && <Empty icon={IconAssignments} title={t('teacher.noTasks')} text={t('teacher.noTasksSub')} />}
      </Card>

      {creating && (
        <NewAssignmentModal
          groups={myGroups}
          onSave={(gid, data) => {
            createAssignment(gid, { ...data, teacherId: currentUser.id })
            setCreating(false)
          }}
          onClose={() => setCreating(false)}
          studentsIn={(gid) => db.enrollments.filter((e) => e.groupId === gid).length}
        />
      )}
    </div>
  )
}

function NewAssignmentModal({ groups, onSave, onClose, studentsIn }) {
  const [groupId, setGroupId] = useState(groups[0]?.id || '')
  const [form, setForm] = useState(() => ({
    title: '',
    description: '',
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    maxScore: 100,
  }))
  const valid = groupId && form.title.trim().length > 3

  return (
    <Modal
      title={t('teacher.newTaskTitle')}
      sub={t('teacher.newTaskSub')}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>{t('common.cancel')}</button>
          <button className="btn primary" disabled={!valid} onClick={() => onSave(groupId, form)}>{t('teacher.issue')}</button>
        </>
      }
    >
      <div className="stack">
        <Field label={t('common.group')}>
          <select className="select" value={groupId} onChange={(e) => setGroupId(e.target.value)}>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} · {levelLabel(g.level)} · {t('unit.students', { n: studentsIn(g.id) })}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('teacher.taskTitle')}>
          <input
            className="input"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder={t('teacher.taskTitlePlaceholder')}
          />
        </Field>
        <Field label={t('teacher.taskDesc')}>
          <textarea
            className="textarea"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder={t('teacher.taskDescPlaceholder')}
          />
        </Field>
        <div className="grid g2">
          <Field label={t('teacher.dueDate')}>
            <input className="input" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          </Field>
          <Field label={t('common.maxScore')}>
            <input className="input" type="number" value={form.maxScore} onChange={(e) => setForm({ ...form, maxScore: e.target.value })} />
          </Field>
        </div>
      </div>
    </Modal>
  )
}

/* ─── Мои группы ───────────────────────────────────────────── */
function GroupsPage({ ctx }) {
  const { db, markLessonDone } = useStore()
  const { myGroups, myEnrollments, course, go } = ctx

  return (
    <div className="grid g2">
      {myGroups.map((g) => {
        const enr = myEnrollments.filter((e) => e.groupId === g.id)
        const p = Math.round((g.lessonsDone / course.totalLessons) * 100)
        return (
          <div className="card" key={g.id}>
            <div className="card-head">
              <div className="avatar" style={{ background: course.color + '22', color: course.color, fontSize: 17 }}><CourseIcon id={course.id} /></div>
              <div>
                <h2>{g.name} · {levelLabel(g.level)}</h2>
                <div className="sub">{scheduleLabel(g)} · {roomLabel(g.room)}</div>
              </div>
              <div className="right"><Badge tone="brand">{t('unit.people', { n: enr.length })}</Badge></div>
            </div>
            <div className="card-body stack" style={{ gap: 12 }}>
              <div>
                <div className="row small muted" style={{ marginBottom: 5 }}>
                  <span>{t('teacher.programProgress')}</span>
                  <span className="spacer mono">{g.lessonsDone} / {course.totalLessons}</span>
                </div>
                <Progress value={p} tone="info" />
              </div>
              <button className="btn sm" onClick={() => markLessonDone(g.id)}><IconCheck /> {t('teacher.markLesson')}</button>
              <div className="divider" />
              <div className="stack" style={{ gap: 0 }}>
                {enr.slice(0, 6).map((e) => {
                  const st = db.students.find((s) => s.id === e.studentId)
                  const m = STATUS_META[enrollmentStatus(e)]
                  return (
                    <div
                      className="row"
                      key={e.id}
                      style={{ padding: '6px 0', cursor: 'pointer' }}
                      onClick={() => go('student', { id: st.id })}
                    >
                      <Avatar name={st.name} size="sm" />
                      <b className="small" style={{ flex: 1 }}>{st.name}</b>
                      <Badge tone={m.tone}>{m.label}</Badge>
                    </div>
                  )
                })}
                {enr.length > 6 && (
                  <span className="small muted" style={{ paddingTop: 6 }}>{t('teacher.andMore', { n: enr.length - 6 })}</span>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ─── Мои ученики ──────────────────────────────────────────── */
function StudentsPage({ ctx }) {
  const { db } = useStore()
  const { myEnrollments, myGroups, go } = ctx
  const [q, setQ] = useState('')
  const [group, setGroup] = useState('all')

  const rows = myEnrollments
    .filter((e) => group === 'all' || e.groupId === group)
    .map((e) => {
      const profile = selectStudentProfile(db, e.studentId)
      const forCourse = profile.courses.find((c) => c.enrollment.id === e.id)
      return { e, profile, forCourse, group: myGroups.find((g) => g.id === e.groupId) }
    })
    .filter((r) => !q || r.profile.student.name.toLowerCase().includes(q.toLowerCase()))

  return (
    <div className="stack">
      <div className="row wrap" style={{ gap: 10 }}>
        <div className="search" style={{ minWidth: 240 }}>
          <IconSearch className="search-ico" />
          <input className="input" placeholder={t('common.searchStudent')} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="select" style={{ width: 220 }} value={group} onChange={(e) => setGroup(e.target.value)}>
          <option value="all">{t('common.allGroups')}</option>
          {myGroups.map((g) => (<option key={g.id} value={g.id}>{g.name} · {levelLabel(g.level)}</option>))}
        </select>
      </div>

      <Card tight>
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>{t('common.student')}</th>
                <th>{t('common.group')}</th>
                <th>{t('teacher.colPayStatus')}</th>
                <th>{t('common.courseProgress')}</th>
                <th>{t('common.homework')}</th>
                <th>{t('common.avgScore')}</th>
                <th>{t('common.attendanceShort')}</th>
                <th>{t('common.study')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const m = STATUS_META[r.forCourse.status]
                const perf = performanceLabel(r.forCourse.avgScore)
                return (
                  <tr key={r.e.id} className="clickable" onClick={() => go('student', { id: r.profile.student.id })}>
                    <td>
                      <div className="cell-user">
                        <Avatar name={r.profile.student.name} size="sm" />
                        <div><b>{r.profile.student.name}</b><span>{t('unit.years', { n: r.profile.student.age })}</span></div>
                      </div>
                    </td>
                    <td className="small">{r.group?.name}</td>
                    <td><Badge tone={m.tone} dot>{m.label}</Badge></td>
                    <td style={{ minWidth: 130 }}><Progress value={r.forCourse.courseProgress} tone="info" /></td>
                    <td style={{ minWidth: 140 }}>
                      <Progress value={r.forCourse.hwProgress} tone="ok" />
                      <span className="small muted mono">
                        {r.forCourse.hwDone}/{r.forCourse.hwTotal}
                        {r.forCourse.hwMissing > 0 && ' · ' + t('common.notSubmitted', { n: r.forCourse.hwMissing })}
                      </span>
                    </td>
                    <td className="mono"><b>{r.forCourse.avgScore ?? '—'}</b></td>
                    <td className="mono small">{r.forCourse.attendance}%</td>
                    <td><Badge tone={perf.tone}>{perf.label}</Badge></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {!rows.length && <Empty icon={IconSearch} title={t('teacher.studentsNotFound')} />}
      </Card>
      <p className="small muted">{t('teacher.shownRows', { n: rows.length })}</p>
    </div>
  )
}
