import { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import TrialBanner from './TrialBanner'

const PAGE_META = {
  '/':          ['Dashboard',         'Overview of trust intelligence across your hiring pipeline'],
  '/candidates':['Candidates',        'Search and manage your candidate pipeline'],
  '/upload':    ['Upload CV',         'Add CVs to start AI-powered verification'],
  '/analysis':  ['Candidate Analysis','AI Trust Score, fraud flags & verification breakdown'],
  '/reports':   ['Reports & Downloads','Generate and share trust reports'],
  '/activity':  ['Activity & History','Full audit log of recruiter actions'],
  '/alerts':    ['Fraud Alerts',      'Active risk indicators across your pipeline'],
  '/settings':  ['Settings',          'Workspace, compliance and security preferences'],
}

export default function Layout() {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileNav, setMobileNav] = useState(false)

  const path = '/' + location.pathname.split('/')[1]
  const [title, subtitle] = PAGE_META[path] || ['', '']

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className={'app' + (mobileNav ? ' nav-open' : '')}>
      <div className="mobile-scrim" onClick={() => setMobileNav(false)} />
      <Sidebar user={user} onSignOut={handleSignOut} />
      <main className="main">
        <TrialBanner />
        <Topbar
          title={title}
          subtitle={subtitle}
          onMobileMenu={() => setMobileNav(true)}
          onSignOut={handleSignOut}
        />
        <div className="scroll" key={location.pathname}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
