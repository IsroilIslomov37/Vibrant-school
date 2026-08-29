import { useMemo, useState } from 'react'
import { Layout } from '../components/Layout.jsx'
import {
  CourseIcon,
  IconAward,
  IconClock,
  IconCourses,
  IconEmpty,
  IconHomework,
  IconInfo,
  IconLock,
  IconMoney,
  IconOk,
  IconPayments,
  IconProgress,
  IconSchedule,
  IconSmile,
  IconStar,
  IconTarget,
  IconTeacher,
  IconWarning,
} from '../components/icons.jsx'
import { notify } from '../components/toast.js'
import { Avatar, Badge, Card, Empty, Kpi, Modal, Progress, Ring, Segmented, Select } from '../components/ui.jsx'
import { CENTER } from '../data/seed.js'
import { feedbackText, levelLabel, payMethod, roomLabel, scheduleLabel, t, taskDesc } from '../data/i18n.js'
import { fmtDate, HW_META, money, selectStudentProfile, STATUS_META, useStore } from '../data/store.js'

export default function StudentApp() {
  const { db, currentUser } = useStore()
  const [route, setRoute] = useState({ page: 'dashboard', params: {} })
  const go = (page, params = {}) => setRoute({ page, params })

  const profile = useMemo(() => selectStudentProfile(db, currentUser.id), [db, currentUser.id])
  const meta = STATUS_META[profile.status]

  const mySubs = db.submissions.filter((s) => s.studentId === currentUser.id)
  const todo = mySubs.filter((s) => s.status === 'assigned' || s.status === 'missing').length

  const nav = [
    {
      title: t('group.learning'),
      items: [
        { id: 'dashboard', icon: IconProgress, label: t('nav.myProgress') },
        { id: 'courses', icon: IconCourses, label: t('nav.myCourses'), count: profile.courses.length },
        { id: 'homework', icon: IconHomework, label: t('nav.homework'), count: todo, alert: todo > 0 },
      ],
    },
    { title: t('group.finance'), items: [{ id: 'payments', icon: IconPayments, label: t('nav.payment') }] },
  ]

  const TITLES = {
    dashboard: [t('student.titleDashboard'), t('student.subDashboard')],
    courses: [t('student.titleCourses'), t('student.subCourses')],
    homework: [t('student.titleHomework'), t('student.subHomework')],
    payments: [t('student.titlePayments'), t('student.subPayments')],
  }
  const [title, sub] = TITLES[route.page]

  return (
    <Layout nav={nav} route={route} go={go} title={title} sub={sub} actions={<Badge tone={meta.tone} dot lg>{meta.label}</Badge>}>
      {route.page === 'dashboard' && <Dashboard profile={profile} go={go} />}
      {route.page === 'courses' && <CoursesPage profile={profile} />}
      {route.page === 'homework' && <HomeworkPage profile={profile} />}
      {route.page === 'payments' && <PaymentsPage profile={profile} />}
    </Layout>
  )
}

/* ─── Мой прогресс ─────────────────────────────────────────── */
function Dashboard({ profile, go }) {
  const { db } = useStore()
  const meta = STATUS_META[profile.status]

  const upcoming = db.submissions
    .filter((s) => s.studentId === profile.student.id && s.status !== 'graded')
    .map((s) => ({ s, a: db.assignments.find((x) => x.id === s.assignmentId) }))
    .filter((r) => r.a)
    .sort((a, b) => a.a.dueDate.localeCompare(b.a.dueDate))
    .slice(0, 6)

  const lastGrades = db.submissions
    .filter((s) => s.studentId === profile.student.id && s.status === 'graded')
    .map((s) => ({ s, a: db.assignments.find((x) => x.id === s.assignmentId) }))
    .filter((r) => r.a)
    .sort((a, b) => (b.s.gradedAt || '').localeCompare(a.s.gradedAt || ''))
    .slice(0, 6)

  return (
    <div className="stack">
      <div className="card" style={{ padding: 20 }}>
        <div className="row wrap" style={{ gap: 18 }}>
          <Avatar name={profile.student.name} size="xl" />
          <div style={{ flex: 1, minWidth: 220 }}>
            <div className="row wrap" style={{ gap: 10 }}>
              <h1 style={{ fontSize: 22 }}>{profile.student.name}</h1>
              <Badge tone={meta.tone} dot lg>{meta.label}</Badge>
              <Badge tone={profile.performance.tone}>{profile.performance.label}</Badge>
            </div>
            <p className="small muted" style={{ marginTop: 6 }}>
              {t('student.headerSub', {
                center: CENTER.name,
                date: fmtDate(profile.student.joinedAt),
                n: profile.courses.length,
              })}
            </p>
            <div className="row wrap" style={{ gap: 7, marginTop: 12 }}>
              {profile.courses.map((c) => (
                <span className="chip" key={c.enrollment.id}>
                  <span className="swatch" style={{ background: c.course.color + '26' }}><CourseIcon id={c.course.id} /></span>
                  {c.course.name}
                  <Badge tone={STATUS_META[c.status].tone}>{STATUS_META[c.status].label}</Badge>
                </span>
              ))}
            </div>
          </div>
          <div className="row" style={{ gap: 22 }}>
            <div style={{ textAlign: 'center' }}>
              <Ring value={profile.courseProgress} color="var(--brand)" />
              <div className="small muted" style={{ marginTop: 6 }}>{t('detail.ringCourse')}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <Ring value={profile.hwProgress} color="var(--ok)" />
              <div className="small muted" style={{ marginTop: 6 }}>{t('detail.ringHw')}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <Ring value={profile.attendance} color="var(--info)" />
              <div className="small muted" style={{ marginTop: 6 }}>{t('detail.ringAttendance')}</div>
            </div>
          </div>
        </div>
      </div>

      {profile.status === 'unpaid' && (
        <div className="banner bad">
          <IconWarning />
          <div>
            <b>{t('student.unpaidTitle')}</b>
            {t('student.unpaidText', { sum: money(profile.debt) })}{' '}
            <button className="btn sm" style={{ marginLeft: 8 }} onClick={() => go('payments')}>{t('student.more')}</button>
          </div>
        </div>
      )}
      {profile.status === 'expiring' && (
        <div className="banner warn">
          <IconClock />
          <div>
            <b>{t('student.expiringTitle')}</b>
            {t('student.expiringText')}
          </div>
        </div>
      )}

      <div className="grid g4">
        <Kpi label={t('admin.kpiAvg')} value={profile.avgScore ?? '—'} foot={t('student.kpiAvgFoot')} icon={IconStar} tone="warn" />
        <Kpi
          label={t('student.kpiDone')}
          value={`${profile.hwDone} / ${profile.hwTotal}`}
          foot={`${profile.hwProgress}%`}
          icon={IconHomework}
          tone="ok"
        />
        <Kpi
          label={t('student.kpiWaiting')}
          value={profile.hwTotal - profile.hwDone - profile.hwPending}
          foot={t('student.kpiWaitingFoot', { n: profile.hwPending })}
          icon={IconClock}
          tone="info"
        />
        <Kpi
          label={t('student.kpiLate')}
          value={profile.hwMissing}
          foot={t('student.kpiLateFoot')}
          icon={IconWarning}
          tone={profile.hwMissing ? 'bad' : 'muted'}
        />
      </div>

      <div className="grid g2">
        <Card title={t('student.upcoming')} sub={t('student.upcomingSub')} tight>
          {upcoming.map(({ s, a }) => {
            const c = profile.courses.find((x) => x.course.id === a.courseId)
            const m = HW_META[s.status]
            return (
              <div className="list-item" key={s.id}>
                <span className="ic lg">{c && <CourseIcon id={c.course.id} />}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <b style={{ fontSize: 13 }}>{a.title}</b>
                  <div className="small muted">{c?.course.name} · {t('student.dueAt', { date: fmtDate(a.dueDate) })}</div>
                </div>
                <Badge tone={m.tone}>{m.label}</Badge>
              </div>
            )
          })}
          {!upcoming.length && <Empty icon={IconSmile} title={t('student.allDone')} text={t('student.allDoneSub')} />}
        </Card>

        <Card title={t('student.lastGrades')} tight>
          {lastGrades.map(({ s, a }) => {
            const c = profile.courses.find((x) => x.course.id === a.courseId)
            return (
              <div className="list-item" key={s.id}>
                <span className="ic lg">{c && <CourseIcon id={c.course.id} />}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <b style={{ fontSize: 13 }}>{a.title}</b>
                  <div className="small muted">{feedbackText(s.feedback) || c?.course.name}</div>
                </div>
                <Badge tone={s.score >= 90 ? 'ok' : s.score >= 75 ? 'info' : s.score >= 60 ? 'warn' : 'bad'} lg>{s.score}</Badge>
              </div>
            )
          })}
          {!lastGrades.length && <Empty icon={IconEmpty} title={t('student.noGrades')} />}
        </Card>
      </div>
    </div>
  )
}

/* ─── Мои курсы ────────────────────────────────────────────── */
function CoursesPage({ profile }) {
  return (
    <div className="grid g2">
      {profile.courses.map((c) => {
        const st = STATUS_META[c.status]
        const locked = c.status === 'unpaid' || c.status === 'frozen'
        return (
          <div className="card" key={c.enrollment.id}>
            <div className="card-head">
              <div className="avatar" style={{ background: c.course.color + '22', color: c.course.color, fontSize: 17 }}><CourseIcon id={c.course.id} /></div>
              <div>
                <h2>{c.course.name}</h2>
                <div className="sub">{levelLabel(c.group?.level)} · {c.group?.name}</div>
              </div>
              <div className="right"><Badge tone={st.tone} dot>{st.label}</Badge></div>
            </div>
            <div className="card-body stack" style={{ gap: 13 }}>
              {locked && (
                <div className="banner bad">
                  <IconLock />
                  <div>
                    <b>{t('student.locked')}</b>
                    {c.status === 'unpaid' ? t('student.lockedUnpaid') : t('student.lockedFrozen')}
                  </div>
                </div>
              )}
              <p className="small muted">{c.course.description}</p>
              <div className="small muted"><IconTeacher /> {c.teacher?.name} · {c.teacher?.title || t('role.teacher')}</div>
              <div className="small muted"><IconSchedule /> {c.group && scheduleLabel(c.group)} · {roomLabel(c.group?.room)}</div>
              <div>
                <div className="row small muted" style={{ marginBottom: 5 }}>
                  <span>{t('student.programProgress')}</span>
                  <span className="spacer mono">
                    {t('detail.lessonsOf', { a: c.enrollment.lessonsCompleted, b: c.course.totalLessons })}
                  </span>
                </div>
                <Progress value={c.courseProgress} tone="info" />
              </div>
              <div>
                <div className="row small muted" style={{ marginBottom: 5 }}>
                  <span>{t('common.homework')}</span>
                  <span className="spacer mono">{c.hwDone} / {c.hwTotal}</span>
                </div>
                <Progress value={c.hwProgress} tone="ok" />
              </div>
              <div className="row wrap" style={{ gap: 6 }}>
                <Badge tone="warn"><IconStar /> {t('detail.avgBadge', { v: c.avgScore ?? '—' })}</Badge>
                <Badge tone="info"><IconTarget /> {t('detail.attendanceBadge', { v: c.attendance })}</Badge>
                {c.hwMissing > 0 && <Badge tone="bad">{t('detail.missingBadge', { n: c.hwMissing })}</Badge>}
              </div>
              <div className="divider" />
              <div className="kv" style={{ padding: 0 }}>
                <span>{t('common.paidUntil')}</span>
                <b className="mono" style={{ color: c.daysLeft < 0 ? 'var(--bad)' : c.daysLeft <= 5 ? 'var(--warn)' : undefined }}>
                  {fmtDate(c.enrollment.paidUntil)}
                </b>
              </div>
            </div>
          </div>
        )
      })}
      {!profile.courses.length && <Empty icon={IconCourses} title={t('detail.noCourses')} />}
    </div>
  )
}

/* ─── Домашние задания ─────────────────────────────────────── */
function HomeworkPage({ profile }) {
  const { db, submitHomework } = useStore()
  const [filter, setFilter] = useState('todo')
  const [course, setCourse] = useState('all')
  const [open, setOpen] = useState(null)

  const all = db.submissions
    .filter((s) => s.studentId === profile.student.id)
    .map((s) => ({
      s,
      a: db.assignments.find((x) => x.id === s.assignmentId),
      c: profile.courses.find((x) => x.enrollment.id === s.enrollmentId),
    }))
    .filter((r) => r.a && r.c)

  const rows = all
    .filter((r) => {
      if (filter === 'todo') return r.s.status === 'assigned' || r.s.status === 'missing'
      if (filter === 'pending') return r.s.status === 'submitted'
      if (filter === 'graded') return r.s.status === 'graded'
      return true
    })
    .filter((r) => course === 'all' || r.a.courseId === course)
    .sort((a, b) => b.a.dueDate.localeCompare(a.a.dueDate))

  const counts = {
    todo: all.filter((r) => r.s.status === 'assigned' || r.s.status === 'missing').length,
    pending: all.filter((r) => r.s.status === 'submitted').length,
    graded: all.filter((r) => r.s.status === 'graded').length,
  }

  return (
    <div className="stack">
      <div className="row wrap" style={{ gap: 10 }}>
        <Segmented
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'todo', label: t('student.segTodo'), count: counts.todo },
            { value: 'pending', label: t('student.segPending'), count: counts.pending },
            { value: 'graded', label: t('student.segGraded'), count: counts.graded },
            { value: 'all', label: t('common.all') },
          ]}
        />
        <Select
          width={215}
          value={course}
          onChange={setCourse}
          options={[
            { value: 'all', label: t('common.allCourses') },
            ...profile.courses.map((c) => ({
              value: c.course.id,
              label: c.course.name,
              icon: <CourseIcon id={c.course.id} />,
            })),
          ]}
        />
      </div>

      <Card tight>
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>{t('common.task')}</th>
                <th>{t('common.course')}</th>
                <th>{t('common.deadline')}</th>
                <th>{t('common.status')}</th>
                <th>{t('common.grade')}</th>
                <th>{t('common.comment')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const m = HW_META[r.s.status]
                const locked = r.c.status === 'unpaid' || r.c.status === 'frozen'
                return (
                  <tr key={r.s.id}>
                    <td><b>{r.a.title}</b><div className="small muted hide-sm">{taskDesc(r.a.description)}</div></td>
                    <td className="small"><span className="ic"><CourseIcon id={r.c.course.id} /></span> {r.c.course.name}</td>
                    <td className="mono small">{fmtDate(r.a.dueDate)}</td>
                    <td><Badge tone={m.tone} dot>{m.label}</Badge></td>
                    <td className="mono"><b>{r.s.score ?? '—'}</b></td>
                    <td className="small muted">{feedbackText(r.s.feedback) || '—'}</td>
                    <td style={{ textAlign: 'right' }}>
                      {r.s.status === 'assigned' || r.s.status === 'missing' ? (
                        <button
                          className="btn primary sm"
                          disabled={locked}
                          title={locked ? t('student.lockedHint') : ''}
                          onClick={() => setOpen(r)}
                        >
                          {locked ? <><IconLock /> {t('student.lockedBtn')}</> : t('student.submit')}
                        </button>
                      ) : (
                        <span className="small muted">{r.s.submittedAt ? fmtDate(r.s.submittedAt) : ''}</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {!rows.length && <Empty icon={IconSmile} title={t('common.empty')} text={t('student.allDoneSub')} />}
      </Card>

      {open && (
        <SubmitModal
          row={open}
          onSubmit={(text) => {
            submitHomework(open.s.id, text)
            notify.success(t('toast.homeworkSubmitted'))
            setOpen(null)
          }}
          onClose={() => setOpen(null)}
        />
      )}
    </div>
  )
}

function SubmitModal({ row, onSubmit, onClose }) {
  const [text, setText] = useState('')
  return (
    <Modal
      title={t('student.submitTitle')}
      sub={row.a.title}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>{t('common.cancel')}</button>
          <button className="btn primary" disabled={text.trim().length < 3} onClick={() => onSubmit(text)}>
            {t('student.sendToReview')}
          </button>
        </>
      }
    >
      <div className="stack">
        <div className="card" style={{ padding: '4px 14px' }}>
          <div className="kv"><span>{t('common.course')}</span><b>{row.c.course.name}</b></div>
          <div className="kv"><span>{t('common.teacher')}</span><b>{row.c.teacher?.name}</b></div>
          <div className="kv"><span>{t('teacher.dueDate')}</span><b>{fmtDate(row.a.dueDate)}</b></div>
          <div className="kv"><span>{t('common.maxScore')}</span><b>{row.a.maxScore}</b></div>
        </div>
        <p className="small muted">{taskDesc(row.a.description)}</p>
        <div className="field">
          <label>{t('student.yourAnswer')}</label>
          <textarea
            className="textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t('student.answerPlaceholder')}
          />
        </div>
      </div>
    </Modal>
  )
}

/* ─── Оплата и статус ──────────────────────────────────────── */
function PaymentsPage({ profile }) {
  const { db } = useStore()
  const payments = db.payments
    .filter((p) => p.studentId === profile.student.id)
    .sort((a, b) => b.paidAt.localeCompare(a.paidAt))

  const monthly = profile.courses.reduce((a, c) => a + c.enrollment.pricePerMonth, 0)

  return (
    <div className="stack">
      <div className="banner info">
        <IconInfo />
        <div>
          <b>{t('student.howActivate')}</b>
          {t('student.howActivateText', { address: CENTER.address, phone: CENTER.phone })}
        </div>
      </div>

      <div className="grid g3">
        <Kpi
          label={t('student.kpiStatus')}
          value={STATUS_META[profile.status].label}
          foot={STATUS_META[profile.status].hint}
          icon={IconAward}
          tone={STATUS_META[profile.status].tone}
        />
        <Kpi
          label={t('student.kpiMonthly')}
          value={money(monthly)}
          foot={t('student.kpiMonthlyFoot', { n: profile.courses.length })}
          icon={IconMoney}
          tone="brand"
        />
        <Kpi
          label={t('admin.kpiDebt')}
          value={money(profile.debt)}
          foot={profile.debt ? t('student.kpiDebtNeed') : t('student.kpiDebtNone')}
          icon={profile.debt ? IconWarning : IconOk}
          tone={profile.debt ? 'bad' : 'ok'}
        />
      </div>

      <Card title={t('student.statusByCourse')} tight>
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>{t('common.course')}</th>
                <th>{t('common.group')}</th>
                <th>{t('common.status')}</th>
                <th>{t('common.paidUntil')}</th>
                <th>{t('student.colLeft')}</th>
                <th>{t('common.price')}</th>
              </tr>
            </thead>
            <tbody>
              {profile.courses.map((c) => {
                const m = STATUS_META[c.status]
                return (
                  <tr key={c.enrollment.id}>
                    <td><b><span className="ic"><CourseIcon id={c.course.id} /></span> {c.course.name}</b></td>
                    <td className="small muted">{c.group?.name} · {levelLabel(c.group?.level)}</td>
                    <td><Badge tone={m.tone} dot>{m.label}</Badge></td>
                    <td className="mono small">{fmtDate(c.enrollment.paidUntil)}</td>
                    <td className="mono small" style={{ color: c.daysLeft < 0 ? 'var(--bad)' : c.daysLeft <= 5 ? 'var(--warn)' : undefined }}>
                      {c.daysLeft < 0 ? t('common.overdueDays', { n: -c.daysLeft }) : t('common.leftDays', { n: c.daysLeft })}
                    </td>
                    <td className="mono">{money(c.enrollment.pricePerMonth)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title={t('student.paymentHistory')} tight>
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>{t('common.date')}</th>
                <th>{t('common.course')}</th>
                <th>{t('common.amount')}</th>
                <th>{t('common.period')}</th>
                <th>{t('common.method')}</th>
                <th>{t('common.acceptedBy')}</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => {
                const c = profile.courses.find((x) => x.course.id === p.courseId)
                return (
                  <tr key={p.id}>
                    <td className="mono small">{fmtDate(p.paidAt)}</td>
                    <td className="small">{c?.course.name || p.courseId}</td>
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
        {!payments.length && <Empty icon={IconPayments} title={t('detail.noPayments')} />}
      </Card>
    </div>
  )
}
