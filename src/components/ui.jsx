import { useEffect } from 'react'
import { t } from '../data/i18n.js'
import { initials } from '../data/store.js'
import { CourseIcon, IconClose, IconEmpty } from './icons.jsx'

export function Card({ title, sub, right, children, tight, className = '' }) {
  return (
    <section className={'card ' + className}>
      {(title || right) && (
        <header className="card-head">
          <div>
            {title && <h2>{title}</h2>}
            {sub && <div className="sub">{sub}</div>}
          </div>
          {right && <div className="right">{right}</div>}
        </header>
      )}
      <div className={'card-body' + (tight ? ' tight' : '')}>{children}</div>
    </section>
  )
}

export function Kpi({ label, value, foot, icon: Icon, tone = 'brand' }) {
  return (
    <div className="card kpi">
      <div className="label">
        {label}
        {Icon && (
          <span className="ico" style={toneBg(tone)}>
            <Icon />
          </span>
        )}
      </div>
      <div className="value">{value}</div>
      {foot && <div className="foot">{foot}</div>}
    </div>
  )
}

function toneBg(tone) {
  const map = {
    brand: 'var(--brand-soft)',
    ok: 'var(--ok-soft)',
    warn: 'var(--warn-soft)',
    bad: 'var(--bad-soft)',
    info: 'var(--info-soft)',
    muted: 'var(--muted-soft)',
  }
  return { background: map[tone] || map.brand }
}

export function Badge({ tone = 'muted', children, dot = false, lg = false }) {
  return (
    <span className={`badge ${tone}${lg ? ' lg' : ''}`}>
      {dot && <i className="dot" />}
      {children}
    </span>
  )
}

export function Progress({ value, tone, showPct = true }) {
  const v = Math.max(0, Math.min(100, value || 0))
  const auto = tone || (v >= 75 ? 'ok' : v >= 45 ? 'info' : v >= 25 ? 'warn' : 'bad')
  return (
    <div className="progress-line">
      <div className="bar">
        <i className={auto} style={{ width: v + '%' }} />
      </div>
      {showPct && <span className="pct">{v}%</span>}
    </div>
  )
}

export function Ring({ value, color = 'var(--brand)', label }) {
  const v = Math.max(0, Math.min(100, value || 0))
  return (
    <div className="ring" style={{ '--p': v, '--c': color }} title={label}>
      <span>{v}%</span>
    </div>
  )
}

export function Avatar({ name, size = '', color }) {
  return (
    <div
      className={'avatar ' + size}
      style={color ? { background: `linear-gradient(135deg, ${color}, ${color}bb)` } : undefined}
      aria-hidden
    >
      {initials(name)}
    </div>
  )
}

export function Modal({ title, sub, onClose, children, footer, wide = false }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={'modal' + (wide ? ' wide' : '')} role="dialog" aria-modal="true">
        <header className="modal-head">
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2>{title}</h2>
            {sub && <div className="sub small muted">{sub}</div>}
          </div>
          <button className="btn ghost sm" onClick={onClose} aria-label={t('common.close')}>
            <IconClose />
          </button>
        </header>
        <div className="modal-body">{children}</div>
        {footer && <footer className="modal-foot">{footer}</footer>}
      </div>
    </div>
  )
}

export function Field({ label, children }) {
  return (
    <div className="field">
      {label && <label>{label}</label>}
      {children}
    </div>
  )
}

export function Empty({ icon: Icon = IconEmpty, title, text }) {
  return (
    <div className="empty">
      <div className="big"><Icon /></div>
      <b>{title}</b>
      {text && <div className="small" style={{ marginTop: 4 }}>{text}</div>}
    </div>
  )
}

export function Segmented({ value, onChange, options }) {
  return (
    <div className="seg">
      {options.map((o) => (
        <button key={o.value} className={value === o.value ? 'on' : ''} onClick={() => onChange(o.value)}>
          {o.label}
          {o.count != null && <span className="muted"> · {o.count}</span>}
        </button>
      ))}
    </div>
  )
}

export function CourseChip({ course, status }) {
  const tone = { active: 'ok', expiring: 'warn', unpaid: 'bad', frozen: 'muted', inactive: 'muted' }[status]
  return (
    <span className="chip" title={course.name}>
      <span className="swatch" style={{ background: course.color + '22' }}><CourseIcon id={course.id} /></span>
      {course.name}
      {status && <i className={'dot badge ' + tone} style={{ width: 6, height: 6, padding: 0, borderRadius: '50%' }} />}
    </span>
  )
}
