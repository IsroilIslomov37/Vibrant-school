import { useState } from 'react'
import { courseById } from '../data/seed.js'
import { levelLabel, payMethod, scheduleLabel, t } from '../data/i18n.js'
import { daysLeft, enrollmentStatus, fmtDate, money, STATUS_META, useStore } from '../data/store.js'
import { IconCheck, IconInfo, IconOk } from './icons.jsx'
import { notify } from './toast.js'
import { Badge, Field, Modal, Select } from './ui.jsx'

const METHODS = ['cash', 'click', 'payme', 'terminal', 'transfer']

/**
 * Приём офлайн-оплаты администратором.
 * Сразу после сохранения статус ученика по этому курсу становится «Активен».
 */
export default function PaymentModal({ enrollment, onClose }) {
  const { db, acceptPayment, currentUser } = useStore()
  const [months, setMonths] = useState(1)
  const [method, setMethod] = useState('cash')
  const [comment, setComment] = useState('')

  const student = db.students.find((s) => s.id === enrollment.studentId)
  const course = courseById(enrollment.courseId)
  const group = db.groups.find((g) => g.id === enrollment.groupId)
  const status = enrollmentStatus(enrollment)
  const left = daysLeft(enrollment.paidUntil)
  const amount = enrollment.pricePerMonth * months

  const from = left > 0 ? new Date(enrollment.paidUntil) : new Date(new Date().toISOString().slice(0, 10))
  const newUntil = new Date(from.getTime() + months * 30 * 86400000).toISOString().slice(0, 10)

  const save = () => {
    acceptPayment(enrollment.id, { months, amount, method, comment, by: currentUser.id })
    notify.success(
      t('toast.paymentAccepted', { name: student.name, course: course.name, date: fmtDate(newUntil) }),
    )
    onClose()
  }

  return (
    <Modal
      title={t('pay.title')}
      sub={`${student.name} · ${course.name}`}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>{t('common.cancel')}</button>
          <button className="btn success" onClick={save}>
            <IconCheck /> {t('pay.confirm', { sum: money(amount) })}
          </button>
        </>
      }
    >
      <div className="stack" style={{ gap: 16 }}>
        <div className="banner info">
          <IconInfo />
          <div>
            <b>{t('pay.offline')}</b>
            {t('pay.offlineText', { course: course.name })}
          </div>
        </div>

        <div className="card" style={{ padding: '4px 14px' }}>
          <div className="kv">
            <span>{t('common.group')}</span>
            <b>{group?.name} · {levelLabel(group?.level)} · {group && scheduleLabel(group)}</b>
          </div>
          <div className="kv">
            <span>{t('pay.currentStatus')}</span>
            <b><Badge tone={STATUS_META[status].tone} dot>{STATUS_META[status].label}</Badge></b>
          </div>
          <div className="kv">
            <span>{t('common.paidUntil')}</span>
            <b className="mono" style={{ color: left < 0 ? 'var(--bad)' : undefined }}>
              {fmtDate(enrollment.paidUntil)}{' '}
              {left < 0 ? t('pay.overdueSuffix', { n: Math.abs(left) }) : t('pay.leftSuffix', { n: left })}
            </b>
          </div>
          <div className="kv">
            <span>{t('pay.monthPrice')}</span>
            <b className="mono">{money(enrollment.pricePerMonth)}</b>
          </div>
        </div>

        <div className="grid g2">
          <Field label={t('pay.months')}>
            <Select
              value={months}
              onChange={setMonths}
              options={[1, 2, 3, 6, 12].map((m) => ({ value: m, label: t('unit.months', { n: m }) }))}
            />
          </Field>
          <Field label={t('pay.method')}>
            <Select value={method} onChange={setMethod} options={METHODS.map((m) => ({ value: m, label: payMethod(m) }))} />
          </Field>
        </div>

        <Field label={t('pay.commentLabel')}>
          <input
            className="input"
            value={comment}
            placeholder={t('pay.commentPlaceholder')}
            onChange={(e) => setComment(e.target.value)}
          />
        </Field>

        <div className="banner ok">
          <IconOk />
          <div>
            <b>{t('pay.total', { sum: money(amount) })}</b>
            {t('pay.extendedTo', { date: fmtDate(newUntil), name: currentUser.name })}
          </div>
        </div>
      </div>
    </Modal>
  )
}
