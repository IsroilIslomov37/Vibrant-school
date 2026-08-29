import Login from './components/Login.jsx'
import { useLang } from './data/i18n.js'
import { useStore } from './data/store.js'
import AdminApp from './pages/AdminApp.jsx'
import StudentApp from './pages/StudentApp.jsx'
import TeacherApp from './pages/TeacherApp.jsx'

export default function App() {
  const { currentUser } = useStore()
  // подписка на язык: смена языка перерисовывает всё дерево
  useLang()

  if (!currentUser) return <Login />
  if (currentUser.role === 'admin') return <AdminApp />
  if (currentUser.role === 'teacher') return <TeacherApp />
  return <StudentApp />
}
