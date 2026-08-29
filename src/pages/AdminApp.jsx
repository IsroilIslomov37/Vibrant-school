import { useMemo, useState } from 'react'
import { Layout } from '../components/Layout.jsx'
import PaymentModal from '../components/PaymentModal.jsx'
import {
  CourseIcon,
  IconAward,
  IconBell,
  IconClock,
  IconCourses,
  IconDashboard,
  IconForward,
  IconGroups,
  IconHomework,
  IconInfo,
  IconMoney,
  IconOk,
  IconPayments,
  IconPlus,
  IconSchedule,
  IconSearch,
  IconSettings,
  IconSmile,
  IconStar,
  IconStudents,
  IconTeacher,
  IconTeachers,
  IconWarning,
} from '../components/icons.jsx'
import { notify } from '../components/toast.js'
import { Avatar, Badge, Card, Empty, Field, Kpi, Modal, Progress, Segmented, Select } from '../components/ui.jsx'
import { CENTER, COURSES, courseById } from '../data/seed.js'
import { annText, annTitle, levelLabel, payMethod, roomLabel, scheduleLabel, t } from '../data/i18n.js'
import {
  daysLeft,
  enrollmentStatus,
  fmtDate,
  money,
  selectAllProfiles,
  selectCourseStats,
  STATUS_META,
  useStore,
} from '../data/store.js'
import StudentDetail from './StudentDetail.jsx'

export default function AdminApp() {
  const { db } = useStore()
  const [route, setRoute] = useState({ page: 'dashboard', params: {} })
  const go = (page, params = {}) => setRoute({ page, params })

  const profiles = useMemo(() => selectAllProfiles(db), [db])
  const stats = useMemo(() => selectCourseStats(db), [db])
  const unpaidCount = db.enrollments.filter((e) => enrollmentStatus(e) === 'unpaid').length
  const toGrade = db.submissions.filter((s) => s.status === 'submitted').length

  const nav = [
    {
      title: t('group.management'),
      items: [
        { id: 'dashboard', icon: IconDashboard, label: t('nav.overview') },
        { id: 'students', icon: IconStudents, label: t('nav.students'), count: db.students.length },
        { id: 'payments', icon: IconPayments, label: t('nav.payments'), count: unpaidCount, alert: unpaidCount > 0 },
      ],
    },
    {
      title: t('group.process'),
      items: [
        { id: 'courses', icon: IconCourses, label: t('nav.courses'), count: COURSES.length },
        { id: 'groups', icon: IconGroups, label: t('nav.groups'), count: db.groups.length },
        { id: 'teachers', icon: IconTeachers, label: t('nav.teachers'), count: db.teachers.length },
        { id: 'homework', icon: IconHomework, label: t('nav.homework'), count: toGrade },
      ],
    },
    { title: t('group.system'), items: [{ id: 'settings', icon: IconSettings, label: t('nav.settings') }] },
  ]

  const TITLES = {
    dashboard: [t('admin.titleDashboard'), t('admin.subDashboard')],
    students: [t('admin.titleStudents'), t('admin.subStudents')],
    payments: [t('admin.titlePayments'), t('admin.subPayments')],
    courses: [t('admin.titleCourses'), t('admin.subCourses')],
    groups: [t('admin.titleGroups'), t('admin.subGroups')],
    teachers: [t('admin.titleTeachers'), t('admin.subTeachers')],
    homework: [t('admin.titleHomework'), t('admin.subHomework')],
    settings: [t('admin.titleSettings'), t('admin.subSettings')],
    student: [t('admin.titleStudent'), t('admin.subStudent')],
  }
  const [title, sub] = TITLES[route.page]

  return (
    <Layout nav={nav} route={route} go={go} title={title} sub={sub} actions={<Badge tone="brand" lg><IconAward /> {t('admin.badge')}</Badge>}>
      {route.page === 'dashboard' && <Dashboard profiles={profiles} stats={stats} go={go} />}
      {route.page === 'students' && <StudentsPage profiles={profiles} go={go} />}
      {route.page === 'student' && <StudentDetail studentId={route.params.id} role="admin" onBack={() => go('students')} />}
      {route.page === 'payments' && <PaymentsPage go={go} />}
      {route.page === 'courses' && <CoursesPage stats={stats} />}
      {route.page === 'groups' && <GroupsPage />}
      {route.page === 'teachers' && <TeachersPage />}
      {route.page === 'homework' && <HomeworkPage />}
      {route.page === 'settings' && <SettingsPage />}
    </Layout>
  )
}

/* ─── Обзор ────────────────────────────────────────────────── */
function Dashboard({ profiles, stats, go }) {
  const { db } = useStore()
  const [payFor, setPayFor] = useState(null)

  const active = profiles.filter((p) => p.status === 'active').length
  const expiring = profiles.filter((p) => p.status === 'expiring').length
  const unpaid = profiles.filter((p) => p.status === 'unpaid').length
  const graded = profiles.filter((p) => p.avgScore != null)
  const avg = graded.length ? Math.round(graded.reduce((a, p) => a + p.avgScore, 0) / graded.length) : 0
  const revenue = stats.reduce((a, s) => a + s.revenue, 0)
  const debt = profiles.reduce((a, p) => a + p.debt, 0)

  const attention = db.enrollments
    .filter((e) => enrollmentStatus(e) === 'unpaid')
    .map((e) => ({ e, student: db.students.find((s) => s.id === e.studentId), overdue: -daysLeft(e.paidUntil) }))
    .sort((a, b) => b.overdue - a.overdue)
    .slice(0, 8)

  const recent = [...db.payments].sort((a, b) => b.paidAt.localeCompare(a.paidAt)).slice(0, 7)

  return (
    <div className="stack">
      <div
        className="card"
        style={{ padding: 20, background: 'linear-gradient(120deg, #2f3337 0%, #4a4438 48%, var(--brand) 100%)', border: 0, color: '#fff' }}
      >
        <div className="row wrap" style={{ gap: 18 }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <h1 style={{ fontSize: 25, color: '#fff' }}>{CENTER.name}</h1>
            <p style={{ opacity: 0.9, marginTop: 6 }}>{t('center.tagline')} · {t('center.subtitle')}</p>
            <p style={{ opacity: 0.75, marginTop: 4, fontSize: 12.5 }}>
              {t('center.experience', { n: CENTER.experienceYears, address: CENTER.address })}
            </p>
          </div>
          <div className="row" style={{ gap: 26 }}>
            <div><b style={{ fontSize: 24 }}>{db.students.length}</b><div style={{ fontSize: 12, opacity: 0.8 }}>{t('login.statStudents')}</div></div>
            <div><b style={{ fontSize: 24 }}>{db.teachers.length}</b><div style={{ fontSize: 12, opacity: 0.8 }}>{t('login.statTeachers')}</div></div>
            <div><b style={{ fontSize: 24 }}>{db.groups.length}</b><div style={{ fontSize: 12, opacity: 0.8 }}>{t('nav.groups')}</div></div>
          </div>
        </div>
      </div>

      <div className="grid g5">
        <Kpi
          label={t('admin.kpiActive')}
          value={active}
          foot={t('admin.kpiActiveFoot', { total: profiles.length, pct: Math.round((active / profiles.length) * 100) })}
          icon={IconOk}
          tone="ok"
        />
        <Kpi label={t('admin.kpiExpiring')} value={expiring} foot={t('admin.kpiExpiringFoot')} icon={IconClock} tone="warn" />
        <Kpi label={t('admin.kpiUnpaid')} value={unpaid} foot={t('admin.kpiUnpaidFoot', { sum: money(debt) })} icon={IconWarning} tone="bad" />
        <Kpi label={t('admin.kpiRevenue')} value={money(revenue)} foot={t('admin.kpiRevenueFoot')} icon={IconMoney} tone="brand" />
        <Kpi label={t('admin.kpiAvg')} value={avg} foot={t('admin.kpiAvgFoot')} icon={IconStar} tone="info" />
      </div>

      <div className="grid g-2-1">
        <Card
          title={t('admin.attention')}
          sub={t('admin.attentionSub')}
          right={
            <button className="btn sm" onClick={() => go('payments')}>
              {t('admin.allPayments')} <IconForward />
            </button>
          }
          tight
        >
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>{t('common.student')}</th>
                  <th>{t('common.course')}</th>
                  <th>{t('admin.overdue')}</th>
                  <th>{t('common.amount')}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {attention.map(({ e, student, overdue }) => {
                  const c = courseById(e.courseId)
                  return (
                    <tr key={e.id}>
                      <td>
                        <div className="cell-user" onClick={() => go('student', { id: student.id })} style={{ cursor: 'pointer' }}>
                          <Avatar name={student.name} size="sm" />
                          <div><b>{student.name}</b><span>{student.phone}</span></div>
                        </div>
                      </td>
                      <td className="small"><span className="ic"><CourseIcon id={c.id} /></span> {c.name}</td>
                      <td><Badge tone="bad">{t('unit.days', { n: overdue })}</Badge></td>
                      <td className="mono small">{money(e.pricePerMonth)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn success sm" onClick={() => setPayFor(e)}>{t('admin.accept')}</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {!attention.length && <Empty icon={IconSmile} title={t('admin.allPaid')} />}
        </Card>

        <div className="stack">
          <Card title={t('admin.recentPayments')} tight>
            {recent.map((p) => {
              const s = db.students.find((x) => x.id === p.studentId)
              const c = courseById(p.courseId)
              return (
                <div className="list-item" key={p.id}>
                  <Avatar name={s?.name || '??'} size="sm" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <b style={{ fontSize: 13 }}>{s?.name}</b>
                    <div className="small muted"><span className="ic"><CourseIcon id={c.id} /></span> {c.name} · {payMethod(p.method)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <b className="mono small">{money(p.amount)}</b>
                    <div className="small muted">{fmtDate(p.paidAt)}</div>
                  </div>
                </div>
              )
            })}
          </Card>

          <Card title={t('admin.announcements')} tight>
            {db.announcements.map((a) => (
              <div className="list-item" key={a.id} style={{ alignItems: 'flex-start' }}>
                <span className="ic lg"><IconBell /></span>
                <div>
                  <b style={{ fontSize: 13 }}>{annTitle(a.key)}</b>
                  <div className="small muted">{annText(a.key)}</div>
                  <div className="small" style={{ color: 'var(--text-3)', marginTop: 3 }}>{fmtDate(a.date)}</div>
                </div>
              </div>
            ))}
          </Card>
        </div>
      </div>

      <Card title={t('admin.courseStats')} sub={t('admin.courseStatsSub')} tight>
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>{t('common.course')}</th>
                <th>{t('admin.colGroups')}</th>
                <th>{t('admin.colStudents')}</th>
                <th>{t('admin.colActive')}</th>
                <th>{t('admin.colUnpaid')}</th>
                <th>{t('common.courseProgress')}</th>
                <th>{t('admin.kpiAvg')}</th>
                <th>{t('admin.colRevenue')}</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((s) => (
                <tr key={s.course.id}>
                  <td>
                    <div className="cell-user">
                      <div className="avatar sm" style={{ background: s.course.color + '26', color: s.course.color }}><CourseIcon id={s.course.id} /></div>
                      <div>
                        <b>{s.course.name}</b>
                        <span>{t('unit.lessons', { n: s.course.totalLessons })} · {t('detail.perMonth', { sum: money(s.course.price) })}</span>
                      </div>
                    </div>
                  </td>
                  <td className="mono">{s.groups.length}</td>
                  <td className="mono">{s.students}</td>
                  <td><Badge tone="ok">{s.active}</Badge></td>
                  <td>{s.unpaid ? <Badge tone="bad">{s.unpaid}</Badge> : <span className="muted">—</span>}</td>
                  <td style={{ minWidth: 150 }}><Progress value={s.avgProgress} /></td>
                  <td className="mono"><b>{s.avgScore ?? '—'}</b></td>
                  <td className="mono small">{money(s.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {payFor && <PaymentModal enrollment={payFor} onClose={() => setPayFor(null)} />}
    </div>
  )
}

/* ─── Ученики ──────────────────────────────────────────────── */
function StudentsPage({ profiles, go }) {
  const { addStudent, db } = useStore()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const [course, setCourse] = useState('all')
  const [adding, setAdding] = useState(false)

  const filtered = profiles.filter((p) => {
    if (status !== 'all' && p.status !== status) return false
    if (course !== 'all' && !p.courses.some((c) => c.course.id === course)) return false
    if (
      q &&
      !(
        p.student.name.toLowerCase().includes(q.toLowerCase()) ||
        p.student.phone.includes(q) ||
        p.student.id.toLowerCase().includes(q.toLowerCase())
      )
    )
      return false
    return true
  })

  const counts = {
    all: profiles.length,
    active: profiles.filter((p) => p.status === 'active').length,
    expiring: profiles.filter((p) => p.status === 'expiring').length,
    unpaid: profiles.filter((p) => p.status === 'unpaid').length,
    frozen: profiles.filter((p) => p.status === 'frozen').length,
  }

  return (
    <div className="stack">
      <div className="row wrap" style={{ gap: 10 }}>
        <div className="search" style={{ flex: 1, minWidth: 220, maxWidth: 340 }}>
          <IconSearch className="search-ico" />
          <input className="input" placeholder={t('admin.searchStudents')} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Segmented
          value={status}
          onChange={setStatus}
          options={[
            { value: 'all', label: t('common.all'), count: counts.all },
            { value: 'active', label: t('admin.segActive'), count: counts.active },
            { value: 'expiring', label: t('status.expiring'), count: counts.expiring },
            { value: 'unpaid', label: t('status.unpaid'), count: counts.unpaid },
            { value: 'frozen', label: t('status.frozen'), count: counts.frozen },
          ]}
        />
        <Select
          width={195}
          value={course}
          onChange={setCourse}
          options={[
            { value: 'all', label: t('common.allCourses') },
            ...COURSES.map((c) => ({ value: c.id, label: c.name, icon: <CourseIcon id={c.id} /> })),
          ]}
        />
        <button className="btn primary spacer" onClick={() => setAdding(true)}><IconPlus /> {t('admin.addStudent')}</button>
      </div>

      <Card tight>
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>{t('common.student')}</th>
                <th>{t('common.courses')}</th>
                <th>{t('common.status')}</th>
                <th>{t('common.courseProgress')}</th>
                <th>{t('common.homework')}</th>
                <th>{t('common.avgScore')}</th>
                <th>{t('common.attendanceShort')}</th>
                <th>{t('common.study')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const m = STATUS_META[p.status]
                return (
                  <tr key={p.student.id} className="clickable" onClick={() => go('student', { id: p.student.id })}>
                    <td>
                      <div className="cell-user">
                        <Avatar name={p.student.name} size="sm" />
                        <div><b>{p.student.name}</b><span>{t('unit.years', { n: p.student.age })} · {p.student.phone}</span></div>
                      </div>
                    </td>
                    <td>
                      <div className="row" style={{ gap: 4 }}>
                        {p.courses.map((c) => (
                          <span
                            key={c.enrollment.id}
                            className="ic"
                            title={c.course.name + ' — ' + STATUS_META[c.status].label}
                            style={{ opacity: c.status === 'active' ? 1 : 0.4 }}
                          >
                            <CourseIcon id={c.course.id} />
                          </span>
                        ))}
                        <span className="small muted">{p.courses.length}</span>
                      </div>
                    </td>
                    <td><Badge tone={m.tone} dot>{m.label}</Badge></td>
                    <td style={{ minWidth: 130 }}><Progress value={p.courseProgress} tone="info" /></td>
                    <td style={{ minWidth: 140 }}>
                      <Progress value={p.hwProgress} tone="ok" />
                      <span className="small muted mono">
                        {p.hwDone}/{p.hwTotal}
                        {p.hwMissing > 0 && ' · ' + t('common.notSubmitted', { n: p.hwMissing })}
                      </span>
                    </td>
                    <td className="mono"><b>{p.avgScore ?? '—'}</b></td>
                    <td className="mono small">{p.attendance}%</td>
                    <td><Badge tone={p.performance.tone}>{p.performance.label}</Badge></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {!filtered.length && <Empty icon={IconSearch} title={t('common.notFound')} text={t('common.changeFilters')} />}
      </Card>
      <p className="small muted">{t('admin.shown', { a: filtered.length, b: profiles.length })}</p>

      {adding && (
        <AddStudentModal
          groups={db.groups}
          teachers={db.teachers}
          onSave={(data) => {
            addStudent(data)
            notify.success(t('toast.studentAdded', { name: data.name }))
            setAdding(false)
          }}
          onClose={() => setAdding(false)}
        />
      )}
    </div>
  )
}

function AddStudentModal({ groups, teachers, onSave, onClose }) {
  const [form, setForm] = useState({ name: '', age: '', phone: '', parentPhone: '' })
  const [groupIds, setGroupIds] = useState([])
  const toggle = (id) => setGroupIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  const valid = form.name.trim().length > 2 && groupIds.length > 0

  return (
    <Modal
      title={t('admin.newStudent')}
      sub={t('admin.newStudentSub')}
      onClose={onClose}
      wide
      footer={
        <>
          <button className="btn" onClick={onClose}>{t('common.cancel')}</button>
          <button className="btn primary" disabled={!valid} onClick={() => onSave({ ...form, groupIds })}>{t('common.add')}</button>
        </>
      }
    >
      <div className="stack">
        <div className="grid g2">
          <Field label={t('admin.fio')}>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Karimov Aziz" />
          </Field>
          <Field label={t('admin.age')}>
            <input className="input" type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} placeholder="15" />
          </Field>
          <Field label={t('admin.phone')}>
            <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+998 90 000-00-00" />
          </Field>
          <Field label={t('admin.parentPhone')}>
            <input className="input" value={form.parentPhone} onChange={(e) => setForm({ ...form, parentPhone: e.target.value })} placeholder={t('common.optional')} />
          </Field>
        </div>
        <div className="field">
          <label>{t('admin.enrollGroups', { n: groupIds.length })}</label>
          <div className="card" style={{ maxHeight: 240, overflowY: 'auto' }}>
            {COURSES.map((c) => (
              <div key={c.id}>
                <div className="list-item" style={{ background: 'var(--surface-2)', padding: '7px 14px' }}>
                  <b className="small"><span className="ic"><CourseIcon id={c.id} /></span> {c.name}</b>
                </div>
                {groups.filter((g) => g.courseId === c.id).map((g) => (
                  <label className="list-item" key={g.id} style={{ cursor: 'pointer' }}>
                    <input type="checkbox" checked={groupIds.includes(g.id)} onChange={() => toggle(g.id)} />
                    <div style={{ flex: 1 }}>
                      <b className="small">{g.name} · {levelLabel(g.level)}</b>
                      <div className="small muted">{scheduleLabel(g)} · {teachers.find((x) => x.id === g.teacherId)?.name}</div>
                    </div>
                    <span className="small mono muted">{money(c.price)}</span>
                  </label>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  )
}

/* ─── Оплаты ───────────────────────────────────────────────── */
function PaymentsPage({ go }) {
  const { db } = useStore()
  const [tab, setTab] = useState('due')
  const [q, setQ] = useState('')
  const [payFor, setPayFor] = useState(null)

  const rows = db.enrollments
    .map((e) => ({
      e,
      student: db.students.find((s) => s.id === e.studentId),
      course: courseById(e.courseId),
      group: db.groups.find((g) => g.id === e.groupId),
      status: enrollmentStatus(e),
      left: daysLeft(e.paidUntil),
    }))
    .filter((r) => r.student)
    .filter((r) => {
      if (tab === 'due') return r.status === 'unpaid' || r.status === 'expiring'
      if (tab === 'active') return r.status === 'active'
      if (tab === 'frozen') return r.status === 'frozen'
      return true
    })
    .filter((r) => !q || r.student.name.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => a.left - b.left)

  const history = [...db.payments].sort((a, b) => b.paidAt.localeCompare(a.paidAt)).slice(0, 60)
  const monthRevenue = db.payments
    .filter((p) => p.paidAt.slice(0, 7) === new Date().toISOString().slice(0, 7))
    .reduce((a, p) => a + p.amount, 0)
  const unpaidEnrollments = db.enrollments.filter((e) => enrollmentStatus(e) === 'unpaid')
  const debt = unpaidEnrollments.reduce((a, e) => a + e.pricePerMonth, 0)

  return (
    <div className="stack">
      <div className="banner info">
        <IconInfo />
        <div>
          <b>{t('admin.howItWorks')}</b>
          {t('admin.howItWorksText')}
        </div>
      </div>

      <div className="grid g4">
        <Kpi label={t('admin.kpiMonth')} value={money(monthRevenue)} foot={t('admin.kpiMonthFoot')} icon={IconMoney} tone="ok" />
        <Kpi label={t('admin.kpiDebt')} value={money(debt)} foot={t('admin.kpiDebtFoot', { n: unpaidEnrollments.length })} icon={IconWarning} tone="bad" />
        <Kpi
          label={t('admin.kpiExpSoon')}
          value={db.enrollments.filter((e) => enrollmentStatus(e) === 'expiring').length}
          foot={t('admin.kpiExpSoonFoot')}
          icon={IconClock}
          tone="warn"
        />
        <Kpi
          label={t('admin.kpiEnrollments')}
          value={db.enrollments.filter((e) => enrollmentStatus(e) === 'active').length}
          foot={t('admin.kpiEnrollmentsFoot', { n: db.enrollments.length })}
          icon={IconOk}
          tone="brand"
        />
      </div>

      <div className="row wrap" style={{ gap: 10 }}>
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: 'due', label: t('admin.segDue') },
            { value: 'active', label: t('admin.segPaid') },
            { value: 'frozen', label: t('admin.segFrozen') },
            { value: 'all', label: t('admin.segAllEnr') },
            { value: 'history', label: t('admin.segHistory') },
          ]}
        />
        {tab !== 'history' && (
          <div className="search" style={{ minWidth: 220 }}>
            <IconSearch className="search-ico" />
            <input className="input" placeholder={t('common.searchStudent')} value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        )}
      </div>

      {tab !== 'history' ? (
        <Card tight>
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>{t('common.student')}</th>
                  <th>{t('admin.colCourseGroup')}</th>
                  <th>{t('common.status')}</th>
                  <th>{t('common.paidUntil')}</th>
                  <th>{t('admin.colPerMonth')}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const m = STATUS_META[r.status]
                  return (
                    <tr key={r.e.id}>
                      <td>
                        <div className="cell-user" style={{ cursor: 'pointer' }} onClick={() => go('student', { id: r.student.id })}>
                          <Avatar name={r.student.name} size="sm" />
                          <div><b>{r.student.name}</b><span>{r.student.phone}</span></div>
                        </div>
                      </td>
                      <td className="small">
                        <span className="ic"><CourseIcon id={r.course.id} /></span> {r.course.name}
                        <div className="muted">{r.group?.name} · {levelLabel(r.group?.level)}</div>
                      </td>
                      <td><Badge tone={m.tone} dot>{m.label}</Badge></td>
                      <td className="mono small" style={{ color: r.left < 0 ? 'var(--bad)' : r.left <= 5 ? 'var(--warn)' : undefined }}>
                        {fmtDate(r.e.paidUntil)}
                        <div className="muted">
                          {r.left < 0 ? t('common.overdueDays', { n: -r.left }) : t('common.leftDays', { n: r.left })}
                        </div>
                      </td>
                      <td className="mono">{money(r.e.pricePerMonth)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button className={'btn sm ' + (r.status === 'active' ? '' : 'success')} onClick={() => setPayFor(r.e)}>
                          {r.status === 'active' ? t('admin.extend') : t('admin.accept')}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {!rows.length && <Empty icon={IconSmile} title={t('common.empty')} text={t('admin.noRows')} />}
        </Card>
      ) : (
        <Card tight>
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>{t('common.date')}</th>
                  <th>{t('common.student')}</th>
                  <th>{t('common.course')}</th>
                  <th>{t('common.amount')}</th>
                  <th>{t('common.period')}</th>
                  <th>{t('common.method')}</th>
                  <th>{t('common.acceptedBy')}</th>
                </tr>
              </thead>
              <tbody>
                {history.map((p) => {
                  const s = db.students.find((x) => x.id === p.studentId)
                  const c = courseById(p.courseId)
                  return (
                    <tr key={p.id}>
                      <td className="mono small">{fmtDate(p.paidAt)}</td>
                      <td><b className="small">{s?.name}</b></td>
                      <td className="small"><span className="ic"><CourseIcon id={c.id} /></span> {c.name}</td>
                      <td className="mono"><b>{money(p.amount)}</b></td>
                      <td className="small">{t('unit.months', { n: p.months })}</td>
                      <td className="small muted">{payMethod(p.method)}</td>
                      <td className="small muted">{db.admins.find((a) => a.id === p.acceptedBy)?.name || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {payFor && <PaymentModal enrollment={payFor} onClose={() => setPayFor(null)} />}
    </div>
  )
}

/* ─── Курсы ────────────────────────────────────────────────── */
function CoursesPage({ stats }) {
  const { db } = useStore()
  return (
    <div className="grid g3">
      {stats.map((s) => (
        <div className="card" key={s.course.id}>
          <div className="card-head" style={{ borderBottomColor: s.course.color + '33' }}>
            <div className="avatar" style={{ background: s.course.color + '22', color: s.course.color, fontSize: 18 }}><CourseIcon id={s.course.id} /></div>
            <div>
              <h2>{s.course.name}</h2>
              <div className="sub">{t('unit.lessons', { n: s.course.totalLessons })} · {t('detail.perMonth', { sum: money(s.course.price) })}</div>
            </div>
          </div>
          <div className="card-body stack" style={{ gap: 12 }}>
            <p className="small muted">{s.course.description}</p>
            <div className="row wrap" style={{ gap: 5 }}>
              {s.course.levels.map((l) => (<Badge key={l} tone="muted">{levelLabel(l)}</Badge>))}
            </div>
            <div className="divider" />
            <div className="grid g3" style={{ gap: 8, textAlign: 'center' }}>
              <div><b style={{ fontSize: 18 }}>{s.students}</b><div className="small muted">{t('admin.colStudents')}</div></div>
              <div><b style={{ fontSize: 18, color: 'var(--ok)' }}>{s.active}</b><div className="small muted">{t('admin.colActive')}</div></div>
              <div><b style={{ fontSize: 18 }}>{s.groups.length}</b><div className="small muted">{t('admin.colGroups')}</div></div>
            </div>
            <div>
              <div className="row small muted" style={{ marginBottom: 5 }}><span>{t('admin.avgProgram')}</span></div>
              <Progress value={s.avgProgress} tone="info" />
            </div>
            <div className="row wrap" style={{ gap: 6 }}>
              <Badge tone="warn"><IconStar /> {t('detail.avgBadge', { v: s.avgScore ?? '—' })}</Badge>
              <Badge tone="brand"><IconTeacher /> {t('admin.teachersCount', { n: s.teachers.length })}</Badge>
              {s.unpaid > 0 && <Badge tone="bad">{t('admin.unpaidCount', { n: s.unpaid })}</Badge>}
            </div>
            <div className="small muted">
              {t('admin.teachersList', { names: s.teachers.map((id) => db.teachers.find((x) => x.id === id)?.name).join(', ') })}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ─── Группы ───────────────────────────────────────────────── */
function GroupsPage() {
  const { db } = useStore()
  const [course, setCourse] = useState('all')

  const rows = db.groups
    .filter((g) => course === 'all' || g.courseId === course)
    .map((g) => {
      const enr = db.enrollments.filter((e) => e.groupId === g.id)
      const c = courseById(g.courseId)
      return {
        g,
        c,
        teacher: db.teachers.find((x) => x.id === g.teacherId),
        total: enr.length,
        active: enr.filter((e) => enrollmentStatus(e) === 'active').length,
        unpaid: enr.filter((e) => enrollmentStatus(e) === 'unpaid').length,
        progress: Math.round((g.lessonsDone / c.totalLessons) * 100),
      }
    })

  return (
    <div className="stack">
      <div className="row wrap">
        <Select
          width={230}
          value={course}
          onChange={setCourse}
          options={[
            { value: 'all', label: t('common.allCourses') },
            ...COURSES.map((c) => ({ value: c.id, label: c.name, icon: <CourseIcon id={c.id} /> })),
          ]}
        />
      </div>
      <div className="grid g3">
        {rows.map((r) => (
          <div className="tile" key={r.g.id}>
            <div className="row">
              <div className="avatar sm" style={{ background: r.c.color + '22', color: r.c.color }}><CourseIcon id={r.c.id} /></div>
              <div style={{ flex: 1 }}>
                <b>{r.g.name}</b>
                <div className="small muted">{r.c.name} · {levelLabel(r.g.level)}</div>
              </div>
              <Badge tone="brand">{t('unit.people', { n: r.total })}</Badge>
            </div>
            <div className="small muted"><IconTeacher /> {r.teacher?.name}</div>
            <div className="small muted"><IconSchedule /> {scheduleLabel(r.g)} · {roomLabel(r.g.room)}</div>
            <div>
              <div className="row small muted" style={{ marginBottom: 4 }}>
                <span>{t('admin.lessonsDone')}</span>
                <span className="spacer mono">{r.g.lessonsDone} / {r.c.totalLessons}</span>
              </div>
              <Progress value={r.progress} tone="info" />
            </div>
            <div className="row wrap" style={{ gap: 6 }}>
              <Badge tone="ok">{t('admin.activeCount', { n: r.active })}</Badge>
              {r.unpaid > 0 && <Badge tone="bad">{t('admin.debtCount', { n: r.unpaid })}</Badge>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Преподаватели ────────────────────────────────────────── */
function TeachersPage() {
  const { db } = useStore()
  const rows = db.teachers.map((teacher) => {
    const groups = db.groups.filter((g) => g.teacherId === teacher.id)
    const enr = db.enrollments.filter((e) => groups.some((g) => g.id === e.groupId))
    const subs = db.submissions.filter((s) => groups.some((g) => g.id === s.groupId))
    const graded = subs.filter((s) => s.status === 'graded')
    const pending = subs.filter((s) => s.status === 'submitted').length
    const avg = graded.length ? Math.round(graded.reduce((a, s) => a + s.score, 0) / graded.length) : null
    return { teacher, course: courseById(teacher.courseId), groups, students: enr.length, pending, avg, checked: graded.length }
  })

  return (
    <Card tight>
      <div className="table-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>{t('common.teacher')}</th>
              <th>{t('admin.colSubject')}</th>
              <th>{t('admin.colExperience')}</th>
              <th>{t('nav.groups')}</th>
              <th>{t('admin.colStudents')}</th>
              <th>{t('admin.colChecked')}</th>
              <th>{t('admin.colWaiting')}</th>
              <th>{t('admin.colGroupAvg')}</th>
              <th>{t('admin.colContacts')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.teacher.id}>
                <td>
                  <div className="cell-user">
                    <Avatar name={r.teacher.name} size="sm" color={r.course.color} />
                    <div><b>{r.teacher.name}</b><span>{r.teacher.title || t('role.teacher')}</span></div>
                  </div>
                </td>
                <td className="small"><span className="ic"><CourseIcon id={r.course.id} /></span> {r.course.name}</td>
                <td className="mono small">{t('unit.years', { n: r.teacher.experience })}</td>
                <td className="small">{r.groups.map((g) => g.name).join(', ')}</td>
                <td className="mono">{r.students}</td>
                <td className="mono">{r.checked}</td>
                <td>{r.pending ? <Badge tone="warn">{r.pending}</Badge> : <span className="muted">0</span>}</td>
                <td className="mono"><b>{r.avg ?? '—'}</b></td>
                <td className="small muted">{r.teacher.phone}<div>{r.teacher.email}</div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

/* ─── Домашние задания (контроль) ──────────────────────────── */
function HomeworkPage() {
  const { db } = useStore()
  const [course, setCourse] = useState('all')

  const rows = db.assignments
    .filter((a) => course === 'all' || a.courseId === course)
    .map((a) => {
      const subs = db.submissions.filter((s) => s.assignmentId === a.id)
      const graded = subs.filter((s) => s.status === 'graded')
      return {
        a,
        c: courseById(a.courseId),
        group: db.groups.find((g) => g.id === a.groupId),
        teacher: db.teachers.find((x) => x.id === a.teacherId),
        total: subs.length,
        graded: graded.length,
        pending: subs.filter((s) => s.status === 'submitted').length,
        missing: subs.filter((s) => s.status === 'missing').length,
        avg: graded.length ? Math.round(graded.reduce((x, s) => x + s.score, 0) / graded.length) : null,
      }
    })
    .sort((x, y) => y.a.dueDate.localeCompare(x.a.dueDate))
    .slice(0, 80)

  return (
    <div className="stack">
      <div className="row wrap">
        <Select
          width={230}
          value={course}
          onChange={setCourse}
          options={[
            { value: 'all', label: t('common.allCourses') },
            ...COURSES.map((c) => ({ value: c.id, label: c.name, icon: <CourseIcon id={c.id} /> })),
          ]}
        />
        <span className="small muted spacer">{t('admin.lastTasks', { n: rows.length })}</span>
      </div>
      <Card tight>
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>{t('common.task')}</th>
                <th>{t('common.group')}</th>
                <th>{t('common.teacher')}</th>
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
                  <td><b>{r.a.title}</b><div className="small muted"><span className="ic"><CourseIcon id={r.c.id} /></span> {r.c.name}</div></td>
                  <td className="small">{r.group?.name}</td>
                  <td className="small muted">{r.teacher?.name}</td>
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
      </Card>
    </div>
  )
}

/* ─── Настройки ────────────────────────────────────────────── */
function SettingsPage() {
  const { db, resetDatabase } = useStore()
  const [confirm, setConfirm] = useState(false)

  return (
    <div className="grid g2">
      <Card title={t('admin.centerCard')}>
        <div className="stack" style={{ gap: 0 }}>
          <div className="kv"><span>{t('admin.fieldName')}</span><b>{CENTER.name}</b></div>
          <div className="kv"><span>{t('admin.fieldSubjects')}</span><b>{t('center.tagline')}</b></div>
          <div className="kv"><span>{t('admin.fieldAudience')}</span><b>{t('center.subtitle')}</b></div>
          <div className="kv"><span>{t('admin.fieldExperience')}</span><b>{t('admin.experienceValue', { n: CENTER.experienceYears })}</b></div>
          <div className="kv"><span>{t('admin.fieldAddress')}</span><b>{CENTER.address}</b></div>
          <div className="kv"><span>{t('admin.phone')}</span><b>{CENTER.phone}</b></div>
        </div>
      </Card>

      <Card title={t('admin.accounts')}>
        <div className="stack" style={{ gap: 0 }}>
          <div className="kv"><span>{t('admin.admins')}</span><b>{db.admins.length}</b></div>
          <div className="kv"><span>{t('nav.teachers')}</span><b>{db.teachers.length}</b></div>
          <div className="kv"><span>{t('nav.students')}</span><b>{db.students.length}</b></div>
          <div className="kv"><span>{t('admin.enrollmentsCount')}</span><b>{db.enrollments.length}</b></div>
          <div className="kv"><span>{t('admin.assignmentsCount')}</span><b>{db.assignments.length}</b></div>
          <div className="kv"><span>{t('admin.paymentsCount')}</span><b>{db.payments.length}</b></div>
        </div>
        <div className="divider" style={{ margin: '14px 0' }} />
        <p className="small muted" style={{ marginBottom: 10 }}>{t('admin.passwordsNote')}</p>
        <button className="btn danger" onClick={() => setConfirm(true)}>{t('admin.resetDb')}</button>
      </Card>

      {confirm && (
        <Modal
          title={t('admin.resetTitle')}
          onClose={() => setConfirm(false)}
          footer={
            <>
              <button className="btn" onClick={() => setConfirm(false)}>{t('common.cancel')}</button>
              <button
                className="btn danger"
                onClick={() => {
                  resetDatabase()
                  notify.info(t('toast.dbReset'))
                  setConfirm(false)
                }}
              >
                {t('admin.resetConfirm')}
              </button>
            </>
          }
        >
          <p>{t('admin.resetText')}</p>
        </Modal>
      )}
    </div>
  )
}
