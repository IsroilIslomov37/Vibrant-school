import { useState } from 'react'
import logoUrl from '../assets/logo.png'
import { CENTER } from '../data/seed.js'
import { LANGS, t, useLang } from '../data/i18n.js'
import { useStore } from '../data/store.js'
import { IconLogout, IconMenu } from './icons.jsx'
import { Avatar } from './ui.jsx'

/** Переключатель языка интерфейса: RU / UZ / EN */
export function LangSwitch() {
  const { lang, setLang } = useLang()
  return (
    <div className="seg lang-switch">
      {LANGS.map((l) => (
        <button key={l.id} className={lang === l.id ? 'on' : ''} title={l.name} onClick={() => setLang(l.id)}>
          {l.label}
        </button>
      ))}
    </div>
  )
}

export function Sidebar({ nav, route, go, open, onClose }) {
  const { currentUser, logout } = useStore()

  return (
    <>
      {open && <div className="scrim" onClick={onClose} />}
      <aside className={'sidebar' + (open ? ' open' : '')}>
        <div className="sidebar-brand">
          <div className="sidebar-logo" style={{ '--logo': `url(${logoUrl})` }} role="img" aria-label={CENTER.name} />
          <div style={{ minWidth: 0 }}>
            <b>{CENTER.name}</b>
            <span>{t('center.kind', { n: CENTER.experienceYears })}</span>
          </div>
        </div>

        <div className="sidebar-scroll">
          {nav.map((group) => (
            <div className="nav-group" key={group.title}>
              <div className="nav-title">{group.title}</div>
              {group.items.map((item) => (
                <button
                  key={item.id}
                  className={'nav-item' + (route.page === item.id ? ' active' : '')}
                  onClick={() => {
                    go(item.id)
                    onClose()
                  }}
                >
                  <span className="ico"><item.icon /></span>
                  <span>{item.label}</span>
                  {item.count > 0 && <span className={'count' + (item.alert ? ' alert' : '')}>{item.count}</span>}
                </button>
              ))}
            </div>
          ))}
        </div>

        <div className="sidebar-user">
          <Avatar name={currentUser.name} size="sm" />
          <div className="who">
            <b>{currentUser.name}</b>
            <span>{t('role.' + currentUser.role)}</span>
          </div>
          <button className="icon-btn" title={t('side.logout')} onClick={logout}>
            <IconLogout />
          </button>
        </div>
      </aside>
    </>
  )
}

export function Layout({ nav, route, go, title, sub, actions, children }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="app">
      <Sidebar nav={nav} route={route} go={go} open={open} onClose={() => setOpen(false)} />
      <div className="main">
        <header className="topbar">
          <button className="icon-btn burger" onClick={() => setOpen(true)} aria-label={t('side.menu')}>
            <IconMenu />
          </button>
          <div>
            <h1>{title}</h1>
            {sub && <div className="sub">{sub}</div>}
          </div>
          <div className="topbar-right">
            <LangSwitch />
            {actions}
          </div>
        </header>
        <div className="content">{children}</div>
      </div>
    </div>
  )
}
