import { NavLink, Link } from 'react-router-dom';
import { 
  LogOut, 
  Settings, 
  LayoutDashboard, 
  BookOpen, 
  GraduationCap, 
  CalendarDays, 
  BookText, 
  Library, 
  Calendar, 
  Wallet, 
  Trophy, 
  Briefcase, 
  Users, 
  MessageSquare 
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';

const navGroups = [
  {
    label: 'Academics',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { label: 'Subjects', path: '/subjects', icon: BookOpen },
      { label: 'Academics', path: '/academics', icon: GraduationCap },
      { label: 'Planner', path: '/planner', icon: CalendarDays },
      { label: 'Notebook', path: '/notebook', icon: BookText },
      { label: 'Resources', path: '/resources', icon: Library },
      { label: 'Calendar', path: '/calendar', icon: Calendar },
    ]
  },
  {
    label: 'Life',
    items: [
      { label: 'Finance', path: '/finance', icon: Wallet },
      { label: 'Habits', path: '/habits', icon: Trophy },
    ]
  },
  {
    label: 'Career & Social',
    items: [
      { label: 'Career Vault', path: '/career', icon: Briefcase },
      { label: 'Groups', path: '/groups', icon: Users },
      { label: 'Messages', path: '/messages', icon: MessageSquare },
    ]
  }
];

function ProtectedPage({ title, description, headerAction, children }) {
  const { user, logout } = useAuth();

  return (
    <main className="min-h-screen bg-[#FDFDFD] text-[#111111] font-sans selection:bg-black/10 transition-colors">
      <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col md:flex-row">
        
        {/* Arc/Linear-inspired Sidebar */}
        <aside className="border-b border-black/[0.06] dark:border-white/10 bg-[#F7F7F7] dark:bg-[#1A1A1A] p-4 md:w-[260px] md:border-b-0 md:border-r flex flex-col shrink-0 transition-colors">
          <Link to="/settings" className="mb-7 px-2 py-2 flex items-center gap-3 group hover:bg-black/[0.04] dark:hover:bg-white/5 rounded-xl transition-colors cursor-pointer">
            {user?.avatar ? (
              <img src={user.avatar} alt="Avatar" className="w-9 h-9 rounded-lg object-cover shadow-sm border border-black/10 dark:border-white/10 shrink-0" />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-[#111111] dark:bg-[#ECECEC] flex items-center justify-center shadow-sm border border-black/10 dark:border-white/10 shrink-0">
                <span className="text-white dark:text-[#111111] font-bold text-[15px] uppercase">
                  {(user?.name || user?.email || 'S')[0]}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[14.5px] font-bold tracking-tight text-[#111111] dark:text-[#ECECEC] leading-none truncate group-hover:opacity-80 transition-opacity">
                {user?.name || 'Synapse User'}
              </p>
              <p className="text-[12px] font-medium text-[#666666] dark:text-[#A3A3A3] mt-1.5 truncate">
                {user?.email || 'Student'}
              </p>
            </div>
          </Link>

          <nav className="flex-1 flex gap-6 overflow-x-auto md:flex-col md:overflow-visible pb-4 [&::-webkit-scrollbar]:hidden">
            {navGroups.map((group) => (
              <div key={group.label} className="flex flex-col min-w-max md:min-w-0">
                <h4 className="text-[11px] uppercase text-[#888888] dark:text-[#777] font-bold tracking-[0.08em] mb-2.5 px-3">
                  {group.label}
                </h4>
                <div className="flex flex-col gap-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                          [
                            'group flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] font-medium transition-all duration-200',
                            isActive
                              ? 'bg-white dark:bg-[#2A2A2A] text-[#111111] dark:text-[#ECECEC] shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-black/[0.04] dark:border-white/5'
                              : 'text-[#555555] dark:text-[#A3A3A3] hover:bg-black/[0.04] dark:hover:bg-white/5 hover:text-[#111111] dark:hover:text-[#ECECEC] border border-transparent',
                          ].join(' ')
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-[#111111] dark:text-[#ECECEC]' : 'text-[#888888] dark:text-[#777] group-hover:text-[#111111] dark:group-hover:text-[#ECECEC]'}`} />
                            {item.label}
                          </>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="mt-auto pt-4 flex flex-col gap-1 border-t border-black/[0.06] dark:border-white/10">
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                [
                  'group flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] font-medium transition-all duration-200',
                  isActive
                    ? 'bg-white dark:bg-[#2A2A2A] text-[#111111] dark:text-[#ECECEC] shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-black/[0.04] dark:border-white/5'
                    : 'text-[#555555] dark:text-[#A3A3A3] hover:bg-black/[0.04] dark:hover:bg-white/5 hover:text-[#111111] dark:hover:text-[#ECECEC] border border-transparent',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  <Settings className={`w-4 h-4 transition-colors ${isActive ? 'text-[#111111] dark:text-[#ECECEC]' : 'text-[#888888] dark:text-[#777] group-hover:text-[#111111] dark:group-hover:text-[#ECECEC]'}`} />
                  Settings
                </>
              )}
            </NavLink>
            <button
              type="button"
              onClick={logout}
              className="group flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] font-medium text-[#555555] dark:text-[#A3A3A3] transition-all duration-200 hover:bg-black/[0.04] dark:hover:bg-white/5 hover:text-red-600 dark:hover:text-red-400 border border-transparent"
            >
              <LogOut className="w-4 h-4 text-[#888888] dark:text-[#777] group-hover:text-red-500 dark:group-hover:text-red-400 transition-colors" aria-hidden="true" />
              Logout
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <section className="flex-1 p-6 sm:p-10 max-w-[100vw] md:max-w-[calc(100vw-260px)] overflow-x-hidden bg-[#FDFDFD] dark:bg-[#111111] transition-colors">
          {(title || description) && (
            <div className="relative mb-8 pb-6 border-b border-black/[0.06] dark:border-white/10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                {title && <h1 className="text-[28px] font-bold text-[#111111] dark:text-[#ECECEC] tracking-[-0.02em] leading-tight">{title}</h1>}
                {description && (
                  <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-[#666666] dark:text-[#A3A3A3]">
                    {description}
                  </p>
                )}
              </div>
              {headerAction && (
                <div className="shrink-0 mb-1">
                  {headerAction}
                </div>
              )}
            </div>
          )}
          
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}

export default ProtectedPage;
