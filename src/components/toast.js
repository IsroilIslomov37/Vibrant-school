import { toast } from 'react-toastify'

/**
 * Тонкая обёртка над react-toastify: единые настройки для всего приложения.
 * Тексты приходят уже переведёнными (через t()).
 */
const base = {
  position: 'top-right',
  autoClose: 3200,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
}

export const notify = {
  success: (message) => toast.success(message, base),
  error: (message) => toast.error(message, base),
  info: (message) => toast.info(message, base),
  warn: (message) => toast.warn(message, { ...base, autoClose: 4200 }),
}
