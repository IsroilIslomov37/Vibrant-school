import { useMemo, useState } from 'react'
import PaymentModal from '../components/PaymentModal.jsx'
import {
  CourseIcon,
  IconAge,
  IconBack,
  IconCourses,
  IconDate,
  IconHomework,
  IconId,
  IconLogin,
  IconPause,
  IconPayments,
  IconPhone,
  IconPlay,
  IconPlus,
  IconSearch,
  IconStar,
  IconTarget,
  IconWarning,
  IconParents,
  IconClock,
} from '../components/icons.jsx'
import { Avatar, Badge, Card, Empty, Kpi, Modal, Progress, Ring } from '../components/ui.jsx'
import { feedbackText, levelLabel, payMethod, scheduleLabel, t } from '../data/i18n.js'
import { fmtDate, HW_META, money, selectStudentProfile, STATUS_META, useStore } from '../data/store.js'

/**
 * Карточка ученика: статус активности по каждому курсу,
 * прогресс по курсу и прогресс по домашним заданиям.
 * role: 'admin' — может принимать оплату и менять статус; 'teacher' — только просмотр.
 */
export default function StudentDetail({ studentId, role, onBack, backLabel }) {
  const { db, setEnrollmentFrozen, deactivateEnrollment, enrollStudent } = useStore()
  const [payFor, setPayFor] = useState(null)
  const [addCourse, setAddCourse] = useState(false)
  const [tab, setTab] = useState('courses')

  const profile = useMemo(() => selectStudentProfile(db, studentId), [db, studentId])
  if (!profile) return <Empty icon={IconSearch} title={t('common.notFound')} />

  const { student, courses, status } = profile
  const meta = STATUS_META[status]
  const payments = db.payments.filter((p) => p.studentId === studentId).sort((a, b) => b.paidAt.localeCompare(a.paidAt))
  const submissions = db.submissions
    .filter((s) => s.studentId === studentId)
    .map((s) => ({ ...s, assignment: db.assignments.find((a) => a.id === s.assignmentId) }))
    .filter((s) => s.assignment)
    .sort((a, b) => b.assignment.dueDate.localeCompare(a.assignment.dueDate))

  return (
    <div className="stack">
      <div className="crumb">
        <button onClick={onBack}><IconBack /> {backLabel || t('detail.back')}</button>
        <span>/</span>
        <span>{student.name}</span>
      </div>

      {/* Шапка */}
      <div className="card" style={{ padding: 20 }}>
        <div className="row wrap" style={{ gap: 18, alignItems: 'flex-start' }}>
          <Avatar name={student.name} size="xl" />
          <div style={{ flex: 1, minWidth: 220 }}>
            <div className="row wrap" style={{ gap: 10 }}>
              <h1 style={{ fontSize: 22 }}>{student.name}</h1>
              <Badge tone={meta.tone} dot lg>{meta.label}</Badge>
              <Badge tone={profile.performance.tone}>{profile.performance.label}</Badge>
            </div>
            <div className="row wrap small muted" style={{ gap: 14, marginTop: 7 }}>
              <span><IconId /> {student.id}</span>
              <span><IconAge /> {t('unit.years', { n: student.age })}</span>
              <span><IconPhone /> {student.phone}</span>
              {student.parentPhone && <span><IconParents /> {student.parentPhone}</span>}
              <span><IconDate /> {t('detail.joined', { date: fmtDate(student.joinedAt) })}</span>
              <span><IconLogin /> {t('detail.loginLabel', { login: student.login })}</span>
            </div>
            <div className="row wrap" style={{ gap: 7, marginTop: 12 }}>
              {courses.map((c) => (
                <span className="chip" key={c.enrollment.id}>
                  <span className="swatch" style={{ background: c.course.color + '26' }}><CourseIcon id={c.course.id} /></span>
                  {c.course.name}
                  <Badge tone={STATUS_META[c.status].tone}>{STATUS_META[c.status].label}</Badge>
                </span>
              ))}
              {role === 'admin' && (
                <button className="btn sm" onClick={() => setAddCourse(true)}><IconPlus /> {t('detail.addCourse')}</button>
              )}
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

      {status === 'unpaid' && (
        <div className="banner bad">
          <IconWarning />
          <div>
            <b>{t('detail.unpaidTitle')}</b>
            {role === 'admin'
              ? t('detail.unpaidAdmin', { sum: money(profile.debt) })
              : t('detail.unpaidTeacher', { sum: money(profile.debt) })}
          </div>
        </div>
      )}

      <div className="grid g4">
        <Kpi label={t('admin.kpiAvg')} value={profile.avgScore ?? '—'} foot={t('common.ofGraded')} icon={IconStar} tone="warn" />
        <Kpi
          label={t('common.homework')}
          value={`${profile.hwDone} / ${profile.hwTotal}`}
          foot={t('detail.kpiHwFoot', { pct: profile.hwProgress })}
          icon={IconHomework}
          tone="ok"
        />
        <Kpi
          label={t('detail.kpiMissing')}
          value={profile.hwMissing}
          foot={t('detail.kpiMissingFoot', { n: profile.hwPending })}
          icon={IconClock}
          tone={profile.hwMissing > 3 ? 'bad' : 'muted'}
        />
        <Kpi
          label={t('detail.kpiCourses')}
          value={courses.length}
          foot={t('detail.kpiCoursesFoot', { n: courses.filter((c) => c.status === 'active').length })}
          icon={IconCourses}
          tone="brand"
        />
      </div>

      <div className="seg">
        {[
          { v: 'courses', l: t('detail.tabCourses') },
          { v: 'hw', l: t('detail.tabHw') },
          { v: 'pay', l: t('detail.tabPay') },
        ].map((x) => (
          <button key={x.v} className={tab === x.v ? 'on' : ''} onClick={() => setTab(x.v)}>{x.l}</button>
        ))}
      </div>

      {tab === 'courses' && (
        <div className="grid g2">
          {courses.map((c) => {
            const st = STATUS_META[c.status]
            return (
              <div className="card" key={c.enrollment.id}>
                <div className="card-head">
                  <span style={{ fontSize: 20, display: 'grid' }}><CourseIcon id={c.course.id} /></span>
                  <div>
                    <h2>{c.course.name}</h2>
                    <div className="sub">{c.group?.name} · {levelLabel(c.group?.level)} · {c.teacher?.name}</div>
                  </div>
                  <div className="right">
                    <Badge tone={st.tone} dot>{st.label}</Badge>
                  </div>
                </div>
                <div className="card-body stack" style={{ gap: 13 }}>
                  <div>
                    <div className="row small muted" style={{ marginBottom: 5 }}>
                      <span>{t('detail.progressCourse')}</span>
                      <span className="spacer mono">
                        {t('detail.lessonsOf', { a: c.enrollment.lessonsCompleted, b: c.course.totalLessons })}
                      </span>
                    </div>
                    <Progress value={c.courseProgress} tone="info" />
                  </div>
                  <div>
                    <div className="row small muted" style={{ marginBottom: 5 }}>
                      <span>{t('common.homework')}</span>
                      <span className="spacer mono">{t('detail.hwGraded', { a: c.hwDone, b: c.hwTotal })}</span>
                    </div>
                    <Progress value={c.hwProgress} tone="ok" />
                  </div>
                  <div className="row wrap" style={{ gap: 8 }}>
                    <Badge tone="warn"><IconStar /> {t('detail.avgBadge', { v: c.avgScore ?? '—' })}</Badge>
                    <Badge tone="info"><IconTarget /> {t('detail.attendanceBadge', { v: c.attendance })}</Badge>
                    {c.hwMissing > 0 && <Badge tone="bad">{t('detail.missingBadge', { n: c.hwMissing })}</Badge>}
                    {c.hwPending > 0 && <Badge tone="muted">{t('detail.pendingBadge', { n: c.hwPending })}</Badge>}
                  </div>
                  <div className="divider" />
                  <div className="kv" style={{ padding: 0 }}>
                    <span>{t('common.paidUntil')}</span>
                    <b className="mono" style={{ color: c.daysLeft < 0 ? 'var(--bad)' : c.daysLeft <= 5 ? 'var(--warn)' : undefined }}>
                      {fmtDate(c.enrollment.paidUntil)} ·{' '}
                      {c.daysLeft < 0 ? t('common.overdueDays', { n: -c.daysLeft }) : t('common.leftDays', { n: c.daysLeft })}
                    </b>
                  </div>
                  <div className="kv">
                    <span>{t('common.price')}</span>
                    <b className="mono">{t('detail.perMonth', { sum: money(c.enrollment.pricePerMonth) })}</b>
                  </div>
                  {role === 'admin' && (
                    <div className="row wrap" style={{ gap: 8 }}>
                      <button className="btn success sm" onClick={() => setPayFor(c.enrollment)}>
                        <IconPayments /> {t('detail.acceptPayment')}
                      </button>
                      {c.enrollment.frozen ? (
                        <button className="btn sm" onClick={() => setEnrollmentFrozen(c.enrollment.id, false)}>
                          <IconPlay /> {t('detail.unfreeze')}
                        </button>
                      ) : (
                        <button className="btn sm" onClick={() => setEnrollmentFrozen(c.enrollment.id, true)}>
                          <IconPause /> {t('detail.freeze')}
                        </button>
                      )}
                      {c.status !== 'unpaid' && (
                        <button className="btn danger sm" onClick={() => deactivateEnrollment(c.enrollment.id)}>{t('detail.deactivate')}</button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
          {!courses.length && <Empty icon={IconCourses} title={t('detail.noCourses')} />}
        </div>
      )}

      {tab === 'hw' && (
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
                  <th>{t('detail.teacherComment')}</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((s) => {
                  const course = courses.find((c) => c.course.id === s.assignment.courseId)
                  const m = HW_META[s.status]
                  return (
                    <tr key={s.id}>
                      <td><b>{s.assignment.title}</b></td>
                      <td className="small muted"><span className="ic">{course && <CourseIcon id={course.course.id} />}</span> {course?.course.name}</td>
                      <td className="small mono">{fmtDate(s.assignment.dueDate)}</td>
                      <td><Badge tone={m.tone} dot>{m.label}</Badge></td>
                      <td className="mono">
                        <b>{s.score ?? '—'}</b>
                        {s.score != null && <span className="muted small"> / {s.assignment.maxScore}</span>}
                      </td>
                      <td className="small muted">{feedbackText(s.feedback) || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {!submissions.length && <Empty icon={IconHomework} title={t('detail.noHw')} />}
        </Card>
      )}

      {tab === 'pay' && (
        <Card tight>
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
                  <th>{t('common.comment')}</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => {
                  const c = courses.find((x) => x.course.id === p.courseId)
                  const admin = db.admins.find((a) => a.id === p.acceptedBy)
                  return (
                    <tr key={p.id}>
                      <td className="mono small">{fmtDate(p.paidAt)}</td>
                      <td className="small"><span className="ic">{c && <CourseIcon id={c.course.id} />}</span> {c?.course.name || p.courseId}</td>
                      <td className="mono"><b>{money(p.amount)}</b></td>
                      <td className="small">{t('unit.months', { n: p.months })}</td>
                      <td className="small muted">{payMethod(p.method)}</td>
                      <td className="small muted">{admin?.name || '—'}</td>
                      <td className="small muted">{p.comment || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {!payments.length && <Empty icon={IconPayments} title={t('detail.noPayments')} />}
        </Card>
      )}

      {payFor && <PaymentModal enrollment={payFor} onClose={() => setPayFor(null)} />}
      {addCourse && (
        <AddCourseModal
          taken={courses.map((c) => c.group?.id)}
          onEnroll={(gid) => {
            enrollStudent(studentId, gid)
            setAddCourse(false)
          }}
          onClose={() => setAddCourse(false)}
        />
      )}
    </div>
  )
}

function AddCourseModal({ taken, onEnroll, onClose }) {
  const { db } = useStore()
  const [groupId, setGroupId] = useState('')
  const free = db.groups.filter((g) => !taken.includes(g.id))

  return (
    <Modal
      title={t('detail.enrollTitle')}
      sub={t('detail.enrollSub')}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>{t('common.cancel')}</button>
          <button className="btn primary" disabled={!groupId} onClick={() => onEnroll(groupId)}>{t('detail.enroll')}</button>
        </>
      }
    >
      <div className="field">
        <label>{t('common.group')}</label>
        <select className="select" value={groupId} onChange={(e) => setGroupId(e.target.value)}>
          <option value="">{t('detail.choose')}</option>
          {free.map((g) => {
            const teacher = db.teachers.find((x) => x.id === g.teacherId)
            return (
              <option key={g.id} value={g.id}>
                {g.name} · {levelLabel(g.level)} · {scheduleLabel(g)} · {teacher?.name}
              </option>
            )
          })}
        </select>
      </div>
    </Modal>
  )
}
