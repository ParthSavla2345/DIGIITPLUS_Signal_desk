import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { path: '/', label: 'Dashboard', icon: 'dashboard' },
  { path: '/incidents', label: 'Incidents', icon: 'h_mobiledata_badge' },
  { path: '/incidents/new', label: 'Create Incident', icon: 'add_circle' },
  { path: '/knowledge', label: 'Knowledge Base', icon: 'menu_book' },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <nav className="bg-surface-container-low h-full w-60 border-r border-outline-variant hidden md:flex flex-col fixed left-0 top-0 h-full z-40">
      {/* Brand Header */}
      <div className="p-6 border-b border-outline-variant flex items-center gap-2">
        <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
          hub
        </span>
        <h2 className="font-headline-md text-headline-md text-primary font-bold">SignalDesk AI</h2>
      </div>

      {/* Navigation Links */}
      <ul className="flex flex-col gap-1 mt-4 flex-1 px-2">
        {navItems.map((item) => {
          const isActive =
            item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path) &&
                !(item.path === '/incidents' && location.pathname === '/incidents/new');

          return (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`mx-1 my-0.5 px-4 py-2.5 rounded-lg flex items-center gap-3 font-label-md text-label-md transition-colors duration-200 ${
                  isActive
                    ? 'bg-primary-container text-on-primary-container font-semibold shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Footer System Status Indicator */}
      <div className="p-4 border-t border-outline-variant bg-surface-container-lowest">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="font-label-sm text-label-sm text-on-surface-variant">AI Triage Active</span>
        </div>
        <p className="font-label-sm text-[10px] text-on-surface-variant/60 mt-0.5">Gemini 2.0 Flash · pgvector RAG</p>
      </div>
    </nav>
  );
}

// ============================================================
// Top App Bar
// ============================================================

export function TopAppBar() {
  return (
    <header className="bg-surface flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop h-16 border-b border-outline-variant md:ml-60 fixed top-0 z-30">
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-primary md:hidden text-2xl">signal_cellular_alt</span>
        <h1 className="text-headline-md font-headline-md font-bold text-primary md:hidden">SignalDesk</h1>
        <span className="font-label-md text-label-md text-on-surface-variant hidden md:block">
          AI-powered incident intelligence
        </span>
      </div>

      <div className="flex items-center gap-3">
        <Link
          to="/incidents/new"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary-container text-white font-label-md text-label-md hover:bg-inverse-primary transition-colors"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          New Incident
        </Link>
        <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-label-md font-bold text-xs">
          UP
        </div>
      </div>
    </header>
  );
}

// ============================================================
// Mobile Bottom Nav Bar
// ============================================================

export function MobileBottomNav() {
  const location = useLocation();

  const tabs = [
    { path: '/', label: 'Dash', icon: 'dashboard' },
    { path: '/incidents', label: 'Incidents', icon: 'h_mobiledata_badge' },
    { path: '/knowledge', label: 'KB', icon: 'menu_book' },
    { path: '/incidents/new', label: 'Create', icon: 'add_circle' },
  ];

  return (
    <nav className="bg-surface-container border-t border-outline-variant md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-2">
      {tabs.map((tab) => {
        const isActive =
          tab.path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(tab.path) &&
              !(tab.path === '/incidents' && location.pathname === '/incidents/new');

        return (
          <Link
            key={tab.path}
            to={tab.path}
            className={`flex flex-col items-center justify-center rounded-xl px-3 py-1 transition-transform active:scale-95 ${
              isActive
                ? 'text-primary bg-primary-container/10 font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">{tab.icon}</span>
            <span className="font-label-sm text-[10px]">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

// ============================================================
// Main Application Layout
// ============================================================

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md flex flex-col md:flex-row">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        <TopAppBar />
        <main className="flex-1 mt-16 mb-20 md:mb-0 md:ml-60 p-margin-mobile md:p-margin-desktop overflow-y-auto">
          {children}
        </main>
        <MobileBottomNav />
      </div>
    </div>
  );
}
