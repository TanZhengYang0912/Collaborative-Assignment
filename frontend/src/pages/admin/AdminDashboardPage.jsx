import { ArrowRight, ArrowUpRight, BadgeCheck, BrainCircuit, CircleAlert, Store } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getAdminDashboard } from "../../api/admin";

const statIcons = {
  neutral: Store,
  success: BadgeCheck,
  warning: CircleAlert,
  accent: BrainCircuit,
};

function DashboardSkeleton() {
  return (
    <div className="admin-page-grid">
      <section className="admin-stats-grid">
        {Array.from({ length: 4 }).map((_, index) => (
          <article key={index} className="admin-stat-card admin-skeleton-card" />
        ))}
      </section>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    getAdminDashboard()
      .then((payload) => {
        if (active) setData(payload);
      })
      .catch((err) => {
        if (active) setError(err.message);
      });

    return () => {
      active = false;
    };
  }, []);

  if (error) {
    return <div className="admin-feedback error">{error}</div>;
  }

  if (!data) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="admin-page-grid">
      <section className="admin-stats-grid">
        {data.stats.map((stat) => {
          const Icon = statIcons[stat.tone] || Store;
          return (
            <article key={stat.label} className="admin-stat-card">
              <div className={`admin-stat-icon ${stat.tone}`}>
                <Icon size={20} />
              </div>
              <ArrowUpRight size={20} className="admin-stat-trend" />
              <div className="admin-stat-value">{stat.value}</div>
              <div className="admin-stat-label">{stat.label}</div>
              <div className="admin-stat-note">{stat.note}</div>
            </article>
          );
        })}
      </section>

      <div className="admin-two-column">
        <section className="admin-panel">
          <div className="admin-panel-header">
            <h2>Recent Vendors</h2>
            <Link to="/admin/vendors2" className="admin-inline-link">
              <span>Show All</span>
              <ArrowRight size={16} />
            </Link>
          </div>
          <div className="admin-list">
            {data.recentVendors.map((vendor) => (
              <div key={vendor.id} className="admin-list-row">
                <div className="admin-list-identity">
                  <div>
                    <div className="admin-list-title">{vendor.name}</div>
                    <div className="admin-list-meta">
                      {vendor.category} · {vendor.location}
                    </div>
                  </div>
                </div>
                <span className={`admin-status-pill ${vendor.status.toLowerCase()}`}>
                  {vendor.status}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="admin-panel">
          <div className="admin-panel-header">
            <h2>AI Processing Log</h2>
            <Link to="/admin/ai" className="admin-inline-link">
              <span>Open Module</span>
              <ArrowRight size={16} />
            </Link>
          </div>
          <div className="admin-list">
            {data.recentProcessing.map((item) => (
              <div key={item.id} className="admin-list-row">
                <div className="admin-list-identity">
                  <div className="admin-log-avatar">{item.platform[0]}</div>
                  <div>
                    <div className="admin-list-title">{item.title}</div>
                    <div className="admin-list-meta">
                      {item.vendor} · {item.platform}
                    </div>
                  </div>
                </div>
                <div className={`admin-recommendation ${item.recommendation === "Highly Recommended" ? "high" : ""}`}>
                  {item.recommendation}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
