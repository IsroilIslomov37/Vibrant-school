import { ToastContainer } from 'react-toastify'
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

  return (
    <>
      {!currentUser && <Login />}
      {currentUser?.role === 'admin' && <AdminApp />}
      {currentUser?.role === 'teacher' && <TeacherApp />}
      {currentUser?.role === 'student' && <StudentApp />}
      <ToastContainer newestOnTop limit={3} theme="colored" />
    </>
  )
}
