import { useEffect, useRef, useState } from 'react'
import logoUrl from '../assets/logo.png'
import { CENTER } from '../data/seed.js'
import { LANGS, t, useLang } from '../data/i18n.js'
import { useStore } from '../data/store.js'
import { useTheme } from '../data/theme.js'
import { IconChevron, IconDark, IconLight, IconLogout, IconMenu, IconSystem } from './icons.jsx'
import { notify } from './toast.js'
import { Avatar } from './ui.jsx'

/** Переключатель языка интерфейса: RU / UZ / EN */
export function LangSwitch({ className = '' }) {
  const { lang, setLang } = useLang()
  return (
    <div className={'seg lang-switch ' + className}>
      {LANGS.map((l) => (
        <button
          key={l.id}
          className={lang === l.id ? 'on' : ''}
          title={l.name}
          onClick={() => {
            if (l.id === lang) return
            setLang(l.id)
            notify.info(t('toast.langChanged', { lang: l.name }))
          }}
        >
          {l.label}
        </button>
      ))}
    </div>
  )
}

const THEME_OPTIONS = [
  { id: 'light', Icon: IconLight },
  { id: 'dark', Icon: IconDark },
  { id: 'system', Icon: IconSystem },
]

/** Переключатель темы: светлая / тёмная / как в системе */
export function ThemeSwitch({ className = '' }) {
  const { theme, setTheme } = useTheme()
  return (
    <div className={'seg theme-switch ' + className}>
      {THEME_OPTIONS.map(({ id, Icon }) => (
        <button
          key={id}
          className={theme === id ? 'on' : ''}
          title={t('theme.' + id)}
          aria-label={t('theme.' + id)}
          aria-pressed={theme === id}
          onClick={() => setTheme(id)}
        >
          <Icon />
        </button>
      ))}
    </div>
  )
}

/** Меню пользователя в шапке: имя, роль, тема, язык (на телефоне) и выход. */
function UserMenu() {
  const { currentUser, logout } = useStore()
  const [open, setOpen] = useState(false)
  const box = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e) => !box.current?.contains(e.target) && setOpen(false)
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="user-menu" ref={box}>
      <button className="user-trigger" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-haspopup="menu">
        <Avatar name={currentUser.name} size="sm" />
        <span className="user-name">{currentUser.name}</span>
        <IconChevron />
      </button>

      {open && (
        <div className="user-pop" role="menu">
          <div className="user-pop-head">
            <Avatar name={currentUser.name} />
            <div style={{ minWidth: 0 }}>
              <b>{currentUser.name}</b>
              <span>{t('role.' + currentUser.role)}</span>
            </div>
          </div>

          <div className="user-pop-lang">
            <span className="small muted">{t('theme.theme')}</span>
            <ThemeSwitch />
          </div>

          <div className="user-pop-lang">
            <span className="small muted">{t('side.language')}</span>
            <LangSwitch />
          </div>

          <button className="user-pop-item danger" onClick={logout}>
            <IconLogout /> {t('side.logout')}
          </button>
        </div>
      )}
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

        <div className="sidebar-foot">
          <div className="sidebar-user">
            <Avatar name={currentUser.name} size="sm" />
            <div className="who">
              <b>{currentUser.name}</b>
              <span>{t('role.' + currentUser.role)}</span>
            </div>
          </div>
          <button className="logout-btn" onClick={logout}>
            <IconLogout /> {t('side.logout')}
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
          <div className="topbar-title">
            <h1>{title}</h1>
            {sub && <div className="sub">{sub}</div>}
          </div>
          <div className="topbar-right">
            <div className="topbar-actions">{actions}</div>
            <ThemeSwitch className="topbar-lang" />
            <LangSwitch className="topbar-lang" />
            <UserMenu />
          </div>
        </header>
        <div className="content">{children}</div>
      </div>
    </div>
  )
}
