import { Routes, Route, NavLink } from 'react-router-dom'
import Upload from './pages/Upload.jsx'
import History from './pages/History.jsx'
import MeetingDetail from './pages/MeetingDetail.jsx'
import Todo from './pages/Todo.jsx'

export default function App() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">meeting<span>.</span>ai</div>
        <NavLink to="/" end className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>New Meeting</NavLink>
        <NavLink to="/history" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>History</NavLink>
        <NavLink to="/todo" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>To-Do List</NavLink>
      </aside>
      <main className="main">
        <Routes>
          <Route path="/" element={<Upload />} />
          <Route path="/history" element={<History />} />
          <Route path="/meetings/:id" element={<MeetingDetail />} />
          <Route path="/todo" element={<Todo />} />
        </Routes>
      </main>
    </div>
  )
}
