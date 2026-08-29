import { useState } from 'react'
import logoUrl from '../assets/logo.png'
import { CENTER, COURSES } from '../data/seed.js'
import { courseName, t } from '../data/i18n.js'
import { useStore } from '../data/store.js'
import { CourseIcon, IconAward, IconStudents, IconTeacher, IconWarning } from './icons.jsx'
import { LangSwitch } from './Layout.jsx'
import { Field } from './ui.jsx'

export default function Login() {
  const { db, login } = useStore()
  const [form, setForm] = useState({ login: '', password: '' })
  const [error, setError] = useState('')

  const demoTeacher = db.teachers[0]
  const demoStudent =
    db.students.find((s) => db.enrollments.filter((e) => e.studentId === s.id).length > 1) || db.students[0]

  const fill = (l, p) => {
    setForm({ login: l, password: p })
    setError('')
  }

  const submit = (e) => {
    e.preventDefault()
    const res = login(form.login, form.password)
    if (!res.ok) setError(res.error)
  }

  const [line1, line2] = t('login.heroTitle').split('\n')

  return (
    <div className="auth">
      <div className="auth-hero">
        <div style={{ position: 'relative' }}>
          <img className="brand-logo" src={logoUrl} alt={CENTER.name} />
        </div>

        <div style={{ position: 'relative' }}>
          <h1>{line1}<br />{line2}</h1>
          <p className="tag">{t('center.tagline')}<br />{t('center.subtitle')}</p>
          <div className="auth-courses" style={{ marginTop: 24 }}>
            {COURSES.map((c) => (
              <span className="pill" key={c.id}><CourseIcon id={c.id} /> {courseName(c.id)}</span>
            ))}
          </div>
        </div>

        <div className="auth-stats">
          <div>
            <b>{t('login.years', { n: CENTER.experienceYears })}</b>
            <span>{t('login.statYears')}</span>
          </div>
          <div>
            <b>{db.teachers.length}</b>
            <span>{t('login.statTeachers')}</span>
          </div>
          <div>
            <b>{db.students.length}+</b>
            <span>{t('login.statStudents')}</span>
          </div>
          <div>
            <b>{COURSES.length}</b>
            <span>{t('login.statCourses')}</span>
          </div>
        </div>
      </div>

      <div className="auth-form">
        <div className="auth-box stack">
          <div className="row">
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: 26 }}>{t('login.title')}</h1>
              <p className="muted" style={{ marginTop: 6 }}>{t('login.subtitle')}</p>
            </div>
            <LangSwitch />
          </div>

          <form onSubmit={submit} className="stack" style={{ gap: 13 }}>
            <Field label={t('login.login')}>
              <input
                className="input"
                value={form.login}
                autoFocus
                placeholder="admin"
                onChange={(e) => setForm({ ...form, login: e.target.value })}
              />
            </Field>
            <Field label={t('login.password')}>
              <input
                className="input"
                type="password"
                value={form.password}
                placeholder="••••••"
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </Field>
            {error && <div className="banner bad"><IconWarning /> {error}</div>}
            <button className="btn primary block" type="submit" style={{ padding: '11px 14px' }}>
              {t('login.submit')}
            </button>
          </form>

          <div className="demo-card stack" style={{ gap: 7 }}>
            <b className="muted">{t('login.demo')}</b>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <span><IconAward /> {t('role.admin')} · <code>admin</code> / <code>admin</code></span>
              <button onClick={() => fill('admin', 'admin')}>{t('login.pick')}</button>
            </div>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <span><IconTeacher /> {t('role.teacher')} · <code>{demoTeacher.login}</code> / <code>teacher</code></span>
              <button onClick={() => fill(demoTeacher.login, 'teacher')}>{t('login.pick')}</button>
            </div>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <span><IconStudents /> {t('role.student')} · <code>{demoStudent.login}</code> / <code>student</code></span>
              <button onClick={() => fill(demoStudent.login, 'student')}>{t('login.pick')}</button>
            </div>
          </div>

          <p className="small muted" style={{ textAlign: 'center' }}>
            {CENTER.address} · {CENTER.phone}
          </p>
        </div>
      </div>
    </div>
  )
}
