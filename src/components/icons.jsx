// ─────────────────────────────────────────────────────────────
//  Единый набор иконок (react-icons): Feather + Tabler.
//  Эмодзи в интерфейсе не используются — только эти компоненты.
// ─────────────────────────────────────────────────────────────
import {
  FiActivity,
  FiAlertTriangle,
  FiAward,
  FiBell,
  FiBookOpen,
  FiCalendar,
  FiCheck,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronDown,
  FiChevronRight,
  FiClipboard,
  FiClock,
  FiCreditCard,
  FiDollarSign,
  FiFileText,
  FiHash,
  FiInbox,
  FiInfo,
  FiKey,
  FiLock,
  FiMenu,
  FiPause,
  FiPhone,
  FiPlay,
  FiPlus,
  FiPower,
  FiSearch,
  FiSend,
  FiSettings,
  FiSlash,
  FiSmile,
  FiStar,
  FiTarget,
  FiUser,
  FiUserCheck,
  FiUserPlus,
  FiUsers,
  FiX,
} from 'react-icons/fi'
import { TbAbc, TbHistory, TbLanguage, TbLetterCase, TbMath, TbSchool } from 'react-icons/tb'

/* Навигация */
export const IconDashboard = FiActivity
export const IconStudents = FiUsers
export const IconGroups = TbSchool
export const IconTeachers = FiUserCheck
export const IconPayments = FiCreditCard
export const IconCourses = FiBookOpen
export const IconHomework = FiFileText
export const IconAssignments = FiClipboard
export const IconGrading = FiCheckCircle
export const IconSettings = FiSettings
export const IconProgress = FiActivity

/* Статусы и метрики */
export const IconOk = FiCheckCircle
export const IconClock = FiClock
export const IconWarning = FiAlertTriangle
export const IconMoney = FiDollarSign
export const IconStar = FiStar
export const IconTarget = FiTarget
export const IconAward = FiAward
export const IconInfo = FiInfo
export const IconLock = FiLock
export const IconBell = FiBell
export const IconSmile = FiSmile
export const IconEmpty = FiInbox
export const IconNoData = FiSlash

/* Действия и служебное */
export const IconSearch = FiSearch
export const IconClose = FiX
export const IconCheck = FiCheck
export const IconPause = FiPause
export const IconPlay = FiPlay
export const IconPlus = FiPlus
export const IconLogout = FiPower
export const IconMenu = FiMenu
export const IconBack = FiChevronLeft
export const IconForward = FiChevronRight
export const IconChevron = FiChevronDown
export const IconSend = FiSend
export const IconAddUser = FiUserPlus

/* Карточка ученика */
export const IconId = FiHash
export const IconAge = FiUser
export const IconPhone = FiPhone
export const IconParents = FiUsers
export const IconDate = FiCalendar
export const IconLogin = FiKey
export const IconTeacher = FiUserCheck
export const IconSchedule = FiCalendar

/* Иконки курсов */
const COURSE_ICONS = {
  english: TbLanguage,
  math: TbMath,
  russian: TbAbc,
  native: TbLetterCase,
  history: TbHistory,
}

/** Иконка курса: <CourseIcon id="english" /> */
export function CourseIcon({ id, ...rest }) {
  const Icon = COURSE_ICONS[id] || FiBookOpen
  return <Icon {...rest} />
}
