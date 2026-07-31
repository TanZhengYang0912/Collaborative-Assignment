import { useState, useEffect } from "react";
import { NavLink, Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  BrainCircuit,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareWarning,
  Settings,
  SquareArrowOutUpRight,
  Store,
  X,
} from "lucide-react";
import { supabase } from "../../supabaseClient";

const navItems = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/admin/vendors2", label: "Vendors", icon: Store },
  { to: "/admin/ai", label: "AI Content Queue", icon: BrainCircuit },
  { to: "/admin/reviews", label: "Review Moderation", icon: MessageSquareWarning },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [topbarAction, setTopbarAction] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAdminEmail(data.session?.user?.email || ""));
  }, []);

  // Navigating from the drawer should close it, or the new page opens hidden
  // behind the overlay on a phone.
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate("/wsdasabi123&admin-login", { replace: true });
  }
  const pageName = navItems.find((item) =>
    item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)
  )?.label || "Overview";

  const subtitleMap = {
    Overview: "Operational view of the TrueBites platform",
    Vendors: "Manage food vendor listings and approval",
    "AI Content Queue": "Review AI-extracted vendor content before it goes live",
    "Review Moderation": "Moderate user reviews and keep vendor content trustworthy",
    Settings: "Platform configuration and preferences",
  };

  return (
    <div className="admin-shell">
      {sidebarOpen && (
        <button
          className="admin-drawer-backdrop"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={sidebarOpen ? "admin-sidebar is-open" : "admin-sidebar"}>
        <button
          className="admin-drawer-close"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        >
          <X size={18} />
        </button>
        <div className="admin-brand">
          <Link to="/admin" className="admin-brand-link">
            <div className="admin-brand-wordmark">TRUEBITES</div>
            <div className="admin-brand-sub">ADMIN CONSOLE</div>
          </Link>
        </div>

        <nav className="admin-nav">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `admin-nav-item${isActive ? " active" : ""}`
              }
            >
              <Icon size={16} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user-card">
            <div className="admin-avatar">{(adminEmail[0] || "A").toUpperCase()}</div>
            <div>
              <div className="admin-user-name">Admin</div>
              <div className="admin-user-email">{adminEmail || "—"}</div>
            </div>
          </div>
          <button className="admin-signout" onClick={handleSignOut}>
            <LogOut size={15} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <button
            className="admin-drawer-toggle"
            aria-label="Open navigation"
            aria-expanded={sidebarOpen}
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={18} />
          </button>
          <div>
            <h1>{pageName}</h1>
            <p>{subtitleMap[pageName]}</p>
          </div>
          <div className="admin-topbar-actions">
            {topbarAction}
            <button className="admin-icon-btn" aria-label="Notifications">
              <Bell size={16} />
              <span className="admin-notification-dot" />
            </button>
            <Link className="admin-view-site" to="/">
              <SquareArrowOutUpRight size={15} />
              <span>View Site</span>
            </Link>
          </div>
        </header>

        <main className="admin-content">
          <Outlet context={{ setTopbarAction }} />
        </main>
      </div>
    </div>
  );
}
