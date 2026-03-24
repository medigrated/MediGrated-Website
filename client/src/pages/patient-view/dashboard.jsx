// client/src/pages/patient-view/dashboard.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Patient Dashboard - robust version
 * - defensive against undefined data
 * - uses optional chaining and defaults
 * - waits for `user` before fetching
 * - friendly loading / error UI
 */

// small presentational card
function StatCard({ title, value, note }) {
  return (
    <div className="bg-card text-card-foreground shadow-sm rounded-lg p-4 flex flex-col">
      <div className="text-sm text-muted-foreground">{title}</div>
      <div className="text-2xl font-semibold mt-2">{value ?? "—"}</div>
      {note && <div className="text-xs text-muted-foreground mt-1">{note}</div>}
    </div>
  );
}

export default function PatientDashboard() {
  const { user } = useSelector((state) => state.auth || {});
  const { globalSearchQuery } = useSelector((state) => state.search || {});
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null); // start as null -> guarded
  const [error, setError] = useState(null);

  // base URL helper — allows using VITE_API_BASE_URL later if you add it
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  useEffect(() => {
    // if there's no user (not logged in yet), don't fetch
    if (!user?.id) {
      setLoading(false);
      setDashboard(null);
      return;
    }

    const controller = new AbortController();

    async function fetchDashboard(isBackground = false) {
      if (!isBackground) setLoading(true);
      setError(null);

      try {
        const res = await axios.get(`${API_BASE}/api/patient/dashboard`, {
          params: { userId: user.id },
          withCredentials: true,
          signal: controller.signal,
        });

        // expected contract: { success: true, data: { ... } }
        if (res?.data?.success) {
          setDashboard(res.data.data || {});
        } else {
          setDashboard({});
          setError(res?.data?.message || "Unexpected response from server");
          console.warn("Unexpected dashboard response:", res?.data);
        }
      } catch (err) {
        if (axios.isCancel(err)) {
          // fetch aborted, ignore
          return;
        }
        console.error("Error fetching dashboard:", err);
        setError(err.response?.data?.message || err.message || "Failed to load dashboard");
        setDashboard({});
      } finally {
        if (!isBackground) setLoading(false);
      }
    }

    fetchDashboard();

    const iv = setInterval(() => {
      fetchDashboard(true);
    }, 5000);

    return () => {
      controller.abort();
      clearInterval(iv);
    };
  }, [user]);

  // loading UI
  if (loading) {
    return (
      <div className="w-full">
        <Skeleton className="h-40 w-full mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </div>
    );
  }

  // if user not present
  if (!user?.id) {
    return (
      <div className="p-6 bg-card text-card-foreground rounded shadow-sm">
        <h2 className="text-xl font-semibold">Patient Dashboard</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          You are not signed in. Please <Link to="/auth/login" className="text-primary">log in</Link> to view your dashboard.
        </p>
      </div>
    );
  }

  // default safe accessors
  const healthScore = dashboard?.healthScore ?? "—";
  const rawRecentReports = Array.isArray(dashboard?.recentReports) ? dashboard.recentReports : [];
  const rawFamily = Array.isArray(dashboard?.family) ? dashboard.family : [];
  const rawRecommendations = Array.isArray(dashboard?.recommendations) ? dashboard.recommendations : [];
  const quickSummary = dashboard?.quickSummary ?? "";

  const query = (globalSearchQuery || "").toLowerCase();

  const recentReports = rawRecentReports.filter(r => 
    !query || (r.title && r.title.toLowerCase().includes(query))
  );

  const family = rawFamily.filter(f => 
    !query || (f.name && f.name.toLowerCase().includes(query)) || (f.relation && f.relation.toLowerCase().includes(query))
  );

  const recommendations = rawRecommendations.filter(r => 
    !query || (typeof r === 'string' && r.toLowerCase().includes(query))
  );

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold">Welcome back, {user?.name ?? "Patient"}</h2>
          <p className="text-sm text-muted-foreground mt-1">Here’s a quick summary of your health</p>
        </div>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Health Score" value={healthScore} note="Higher is better (0–100)" />
        <StatCard title="Recent Reports" value={recentReports.length} note="Uploaded / scanned reports" />
        <StatCard title="Family Members" value={family.length} note="Members you monitor" />
      </div>

      {/* Quick summary + recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card text-card-foreground shadow-sm rounded-lg p-4">
          <h3 className="text-lg font-semibold">Quick Summary</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {quickSummary || "No summary available yet."}
          </p>

          <div className="mt-4">
            <h4 className="text-sm font-medium">Top Recommendations</h4>
            <ul className="mt-2 space-y-2">
              {recommendations.length ? (
                recommendations.map((r, idx) => (
                  <li key={idx} className="text-sm">• {r}</li>
                ))
              ) : (
                <li className="text-sm text-muted-foreground">No recommendations right now.</li>
              )}
              <li><Link to="/patient/recommendations" className="text-sm text-primary hover:underline">View all recommendations</Link></li>
            </ul>
          </div>
        </div>

        {/* Right column: Recent reports list */}
        <div className="bg-card text-card-foreground shadow-sm rounded-lg p-4">
          <h3 className="text-lg font-semibold">Recent Reports</h3>
          <div className="mt-3 space-y-3">
            {recentReports.length ? (
              recentReports.map((r) => (
                <div key={r.id ?? r._id ?? Math.random()} className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{r.title || "Report"}</div>
                    <div className="text-xs text-muted-foreground">{r.date ? new Date(r.date).toLocaleDateString() : ""}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link to={`/patient/report-scanner?reportId=${r.id ?? r._id}`} className="text-sm text-primary hover:underline">
                      View
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div>
              <div className="text-sm text-muted-foreground">No recent reports. Upload or scan a report to get insights.</div>
                        <Link to="/patient/report-scanner" className="text-sm text-primary hover:underline">Upload / Scan</Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Family monitoring preview */}
      <div className="bg-card text-card-foreground shadow-sm rounded-lg p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Family Monitoring</h3>
          <Link to="/patient/family-monitoring" className="text-sm text-primary hover:underline">Manage</Link>
        </div>

        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {family.length ? (
            family.map((member) => (
              <div key={member.id ?? member._id ?? Math.random()} className="border rounded-md p-3">
                <div className="text-sm font-medium">{member.name}</div>
                <div className="text-xs text-muted-foreground">{member.relation}</div>
                <div className="mt-2 text-sm">{member.latestStatus || "No recent data"}</div>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground">No family members added.</div>
          )}
        </div>
      </div>

      {error && <div className="text-sm text-destructive">{error}</div>}
    </div>
  );
}
