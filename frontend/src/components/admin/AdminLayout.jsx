import { useState } from "react";
import { NavLink, Outlet, Link, useLocation } from "react-router-dom";
import {
  Bell,
  BrainCircuit,
  LayoutDashboard,
  LogOut,
  MessageSquareWarning,
  Settings,
  SquareArrowOutUpRight,
  Store,
} from "lucide-react";
import "../../admin-console.css";

const navItems = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/admin/vendors2", label: "Vendors", icon: Store },
  { to: "/admin/ai", label: "AI Content Queue", icon: BrainCircuit },
  { to: "/admin/reviews", label: "Review Moderation", icon: MessageSquareWarning },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout() {
  const location = useLocation();
  const [topbarAction, setTopbarAction] = useState(null);
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
      <aside className="admin-sidebar">
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
            <div className="admin-avatar">A</div>
            <div>
              <div className="admin-user-name">Admin</div>
              <div className="admin-user-email">admin@truebites.my</div>
            </div>
          </div>
          <button className="admin-signout">
            <LogOut size={15} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
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
