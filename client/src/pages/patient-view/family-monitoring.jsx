import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Plus, UserPlus, Send, CheckCircle, AlertCircle,
  X, Trash2, Pencil, LogOut, Users, Save, Copy, Check, RefreshCw, SkipForward
} from "lucide-react";

const API = "http://localhost:5000/api/family";
const HEADERS = { 'x-preview-mode': 'true' };
const PREVIEW_USER_ID = '65f1a2b3c4d5e6f7a8b9c0d1';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatLogTimestamp(ts) {
  const d = new Date(ts);
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  const date = d.toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' });
  return { time, date };
}

function dateLabelFor(dateStr) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
}

function groupByDate(activities) {
  const groups = {};
  for (const log of activities) {
    const key = new Date(log.timestamp).toDateString();
    if (!groups[key]) groups[key] = [];
    groups[key].push(log);
  }
  return groups;
}

function buildLogSentence(log) {
  const { time, date } = formatLogTimestamp(log.timestamp);
  const user = log.userName && log.userName !== 'System Alert' ? `"${log.userName}"` : null;
  const action = log.action;
  const missedMatch = action.match(/^(.+?) was missed \(Scheduled for (.+?)\)$/i);
  if (missedMatch) return `${missedMatch[1]} scheduled for ${missedMatch[2]} was missed on ${date}`;
  if (user && (action.startsWith('marked ') || action.startsWith('skipped '))) return `${user} ${action} at ${time} on ${date}`;
  if (user) return `${user} ${action} at ${time} on ${date}`;
  return `${action} — ${time}, ${date}`;
}

// ─── Inline Confirm ───────────────────────────────────────────────────────────

function InlineConfirm({ message, onConfirm, onCancel, confirmLabel = "Confirm", confirmClass = "bg-primary text-primary-foreground shadow-md hover:bg-primary/90 text-white" }) {
  return (
    <div className="mt-3 p-4 rounded-3xl bg-muted/30 border border-border flex flex-col gap-3">
      <p className="text-sm text-foreground/90 font-medium leading-snug">{message}</p>
      <div className="flex gap-2">
        <Button size="sm" onClick={onCancel} variant="outline" className="h-9 px-4 text-sm border-border text-muted-foreground rounded-2xl">No, Cancel</Button>
        <Button size="sm" onClick={onConfirm} className={`h-9 px-4 text-sm rounded-2xl font-semibold ${confirmClass}`}>{confirmLabel}</Button>
      </div>
    </div>
  );
}

// ─── Skeleton Loaders ─────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="p-5 border rounded-3xl border-border bg-card text-card-foreground animate-pulse">
      <div className="h-5 bg-muted rounded w-36 mb-2" />
      <div className="h-3.5 bg-muted rounded w-24 mb-4" />
      <div className="flex gap-2 mb-4"><div className="h-7 w-16 bg-muted rounded-lg" /><div className="h-7 w-16 bg-muted rounded-lg" /></div>
      <div className="h-2 bg-muted rounded-full" />
    </div>
  );
}

// ─── Add Medicine Modal ───────────────────────────────────────────────────────

function AddMedicineModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ name: "", totalAmount: "", timesPerDay: 1, schedule: [""], notes: "", alreadyTakenFirstDose: false });
  const [err, setErr] = useState("");

  function handleAdd() {
    if (!form.name.trim() || !form.totalAmount) { setErr("Name and tablet count are required"); return; }
    onAdd(form);
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-card/90 backdrop-blur-2xl border border-white/10 dark:border-white/5 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.2)] p-7 w-96 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-foreground font-semibold text-lg flex items-center gap-2">
            <Plus className="w-5 h-5 text-emerald-600" /> Add New Medicine
          </h3>
          <button onClick={onClose} className="text-muted-foreground/70 hover:text-muted-foreground transition-colors"><X className="w-5 h-5" /></button>
        </div>
        {err && <p className="text-red-500 text-xs mb-3 bg-red-50 px-3 py-2 rounded-2xl">{err}</p>}
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-semibold text-muted-foreground">Medicine Name</Label>
            <Input autoFocus placeholder="e.g. Paracetamol" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1.5 h-11 text-base rounded-2xl border-border" />
          </div>
          <div>
            <Label className="text-sm font-semibold text-muted-foreground">Total Tablets (pack size)</Label>
            <Input type="number" placeholder="e.g. 30" value={form.totalAmount} onChange={e => setForm({ ...form, totalAmount: e.target.value })} className="mt-1.5 h-11 text-base rounded-2xl border-border" />
          </div>
          <div>
            <Label className="text-sm font-semibold text-muted-foreground">Instructions (optional)</Label>
            <Input placeholder="e.g. Take with food" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="mt-1.5 h-11 text-base rounded-2xl border-border" />
          </div>
          <div className="flex items-center gap-3">
            <Label className="text-sm font-semibold text-muted-foreground shrink-0">Doses Per Day</Label>
            <Input type="number" min="1" value={form.timesPerDay} className="h-10 w-16 text-base rounded-2xl border-border text-center"
              onChange={e => { const v = Math.max(1, parseInt(e.target.value) || 1); setForm({ ...form, timesPerDay: v, schedule: Array(v).fill("") }); }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {form.schedule.map((t, i) => (
              <div key={i}>
                <Label className="text-sm text-muted-foreground">Dose {i + 1} Time</Label>
                <Input type="time" value={t} onChange={e => { const s = [...form.schedule]; s[i] = e.target.value; setForm({ ...form, schedule: s }); }} className="mt-1 h-10 text-base rounded-2xl border-border" />
              </div>
            ))}
          </div>
          
          <label className="flex items-center gap-3 cursor-pointer mt-2 bg-muted/20 p-3 rounded-2xl border border-border transition-colors hover:bg-muted/40">
            <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/50" 
              checked={form.alreadyTakenFirstDose} 
              onChange={e => setForm({ ...form, alreadyTakenFirstDose: e.target.checked })} />
            <span className="text-sm font-semibold text-foreground/90">I have already taken the first dose today</span>
          </label>

          <Button onClick={handleAdd} className="w-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 text-white rounded-2xl font-semibold h-11 text-base mt-1">
            <Plus className="w-4 h-4 mr-1.5" /> Add Medicine
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FamilyMonitoring() {
  const { user } = useSelector((state) => state.auth || {});
  const currentUserId = user?.id || PREVIEW_USER_ID;
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [groupData, setGroupData] = useState(null);
  const [members, setMembers] = useState([]);
  const [showMembers, setShowMembers] = useState(false);
  const [showAddMed, setShowAddMed] = useState(false);

  // Sidebar inline forms
  const [sidebarMode, setSidebarMode] = useState(null); // null | 'create' | 'join'
  const [createName, setCreateName] = useState("");
  const [joinCode, setJoinCode] = useState("");

  const [editingMed, setEditingMed] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [refillAmount, setRefillAmount] = useState({});
  const [skipReason, setSkipReason] = useState({});
  const [error, setError] = useState("");
  const [copiedCode, setCopiedCode] = useState(null);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [confirmState, setConfirmState] = useState({});

  useEffect(() => { fetchGroups(); }, []);

  useEffect(() => {
    let interval;
    if (activeGroup) {
      setLoadingDetails(true);
      fetchGroupDetails(activeGroup).finally(() => setLoadingDetails(false));
      interval = setInterval(() => fetchGroupDetails(activeGroup), 5000);
    }
    return () => clearInterval(interval);
  }, [activeGroup]);

  async function fetchGroups() {
    setLoadingGroups(true);
    try {
      const res = await axios.get(API, { withCredentials: true, headers: HEADERS });
      if (res.data.success) setGroups(res.data.groups);
    } catch { setError("Failed to load groups"); }
    finally { setLoadingGroups(false); }
  }

  async function fetchGroupDetails(id) {
    try {
      const res = await axios.get(`${API}/${id}`, { withCredentials: true, headers: HEADERS });
      if (res.data.success) console.log("[FamilyUI] activities count:", res.data.activities?.length, "| first entry:", JSON.stringify(res.data.activities?.[0])); setGroupData(res.data);
    } catch { }
  }

  async function fetchMembers(id) {
    try {
      const res = await axios.get(`${API}/${id}/members`, { withCredentials: true, headers: HEADERS });
      if (res.data.success) setMembers(res.data.members);
    } catch { setError("Failed to load members"); }
  }

  function clearConfirm(key) { setConfirmState(prev => { const n = { ...prev }; delete n[key]; return n; }); }
  function toggleConfirm(key, type) { setConfirmState(prev => prev[key] === type ? (({ [key]: _, ...rest }) => rest)(prev) : { ...prev, [key]: type }); }

  function handleCopyCode(code, gid) {
    navigator.clipboard.writeText(code).then(() => { setCopiedCode(gid); setTimeout(() => setCopiedCode(null), 2000); });
  }

  async function handleCreateGroup() {
    if (!createName.trim()) return;
    try {
      const res = await axios.post(API, { name: createName }, { withCredentials: true, headers: HEADERS });
      if (res.data.success) { setCreateName(""); setSidebarMode(null); fetchGroups(); }
    } catch { setError("Failed to create group"); }
  }

  async function handleJoinGroup() {
    if (!joinCode.trim()) return;
    try {
      const res = await axios.post(`${API}/join`, { code: joinCode }, { withCredentials: true, headers: HEADERS });
      if (res.data.success) { setJoinCode(""); setSidebarMode(null); fetchGroups(); }
    } catch (err) { setError(err.response?.data?.message || "Group not found"); }
  }

  async function handleAddMedicine(form) {
    try {
      const res = await axios.post(`${API}/${activeGroup}/medicine`, form, { withCredentials: true, headers: HEADERS });
      if (res.data.success) { setShowAddMed(false); fetchGroupDetails(activeGroup); }
    } catch { setError("Failed to add medicine"); }
  }

  async function handleMarkTaken(medId) {
    try {
      await axios.post(`${API}/${activeGroup}/taken/${medId}`, {}, { withCredentials: true, headers: HEADERS });
      fetchGroupDetails(activeGroup);
    } catch (err) { setError(err.response?.data?.message || "Failed to mark as taken"); }
  }

  async function handleSkipDose(medId) {
    try {
      await axios.post(`${API}/${activeGroup}/skip/${medId}`, { reason: skipReason[medId] || "" }, { withCredentials: true, headers: HEADERS });
      clearConfirm(`skip-${medId}`);
      setSkipReason(prev => ({ ...prev, [medId]: "" }));
      fetchGroupDetails(activeGroup);
    } catch { setError("Failed to skip dose"); }
  }

  async function handleDeleteMedicine(medId) {
    try {
      await axios.delete(`${API}/${activeGroup}/medicine/${medId}`, { withCredentials: true, headers: HEADERS });
      clearConfirm(`del-${medId}`);
      fetchGroupDetails(activeGroup);
    } catch { setError("Failed to delete medicine"); }
  }

  async function handleDeleteGroup() {
    try {
      await axios.delete(`${API}/${activeGroup}`, { withCredentials: true, headers: HEADERS });
      clearConfirm('del-group');
      setActiveGroup(null); setGroupData(null); fetchGroups();
    } catch (err) { setError(err.response?.data?.message || "Failed to delete group"); }
  }

  async function handleRemoveMember(memberId) {
    try {
      await axios.delete(`${API}/${activeGroup}/members/${memberId}`, { withCredentials: true, headers: HEADERS });
      clearConfirm(`rem-${memberId}`);
      fetchMembers(activeGroup);
    } catch (err) { setError(err.response?.data?.message || "Failed to remove member"); }
  }

  async function handleLeaveGroup() {
    try {
      await axios.post(`${API}/${activeGroup}/leave`, {}, { withCredentials: true, headers: HEADERS });
      clearConfirm('leave');
      setActiveGroup(null); setGroupData(null); fetchGroups();
    } catch { setError("Failed to leave group"); }
  }

  function startEditing(med) {
    setEditingMed(med._id);
    setEditForm({ name: med.name, totalAmount: med.totalAmount, timesPerDay: med.timesPerDay, schedule: [...med.schedule], notes: med.notes || "" });
  }

  async function handleSaveEdit(medId) {
    try {
      await axios.put(`${API}/${activeGroup}/medicine/${medId}`, editForm, { withCredentials: true, headers: HEADERS });
      setEditingMed(null); fetchGroupDetails(activeGroup);
    } catch { setError("Failed to update medicine"); }
  }

  async function handleRefill(medId) {
    const amt = parseInt(refillAmount[medId]);
    if (!amt || amt <= 0) { setError("Enter a valid refill amount"); return; }
    try {
      await axios.post(`${API}/${activeGroup}/refill/${medId}`, { addAmount: amt }, { withCredentials: true, headers: HEADERS });
      setRefillAmount(prev => ({ ...prev, [medId]: "" }));
      fetchGroupDetails(activeGroup);
    } catch { setError("Failed to refill medicine"); }
  }

  const isCreator = groupData?.group?.creator?.toString() === PREVIEW_USER_ID;

  const logCardStyle = (log) => {
    if (log.status === 'missed') return "bg-red-500/10 dark:bg-red-500/15 border-red-500/20";
    if (log.status === 'skipped') return "bg-violet-500/10 dark:bg-violet-500/15 border-violet-500/20";
    return "bg-card text-card-foreground border-border";
  };

  const logIcon = (log) => {
    if (log.status === 'missed') return <AlertCircle className="w-3 h-3 shrink-0 mt-0.5 text-red-400" />;
    if (log.status === 'skipped') return <SkipForward className="w-3 h-3 shrink-0 mt-0.5 text-violet-400" />;
    return <CheckCircle className="w-3 h-3 shrink-0 mt-0.5 text-emerald-400 opacity-60" />;
  };

  const logTextColor = (log) => {
    if (log.status === 'missed') return "text-red-600 dark:text-red-400";
    if (log.status === 'skipped') return "text-violet-600 dark:text-violet-400";
    return "text-muted-foreground";
  };

  return (
    <div className="flex h-[calc(100vh-120px)] w-full max-w-6xl mx-auto overflow-hidden border border-border rounded-3xl shadow-soft bg-muted/30 text-foreground font-semibold">

      {/* ── Add Medicine Modal ── */}
      {showAddMed && <AddMedicineModal onClose={() => setShowAddMed(false)} onAdd={handleAddMedicine} />}

      {/* ── Members Modal ── */}
      {showMembers && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setShowMembers(false)}>
          <div className="bg-card/90 backdrop-blur-2xl border border-white/10 dark:border-white/5 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.2)] p-6 w-80 max-h-[65vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-foreground font-semibold text-base flex items-center gap-2"><Users className="w-4 h-4 text-blue-500" /> Group Members</h3>
              <button onClick={() => setShowMembers(false)} className="text-muted-foreground/70 hover:text-muted-foreground"><X className="w-4 h-4" /></button>
            </div>
            {isCreator && <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 bg-primary/12 dark:bg-primary/25 border-l-[3px] border-l-primary0/10 border border-amber-500/20 rounded-lg px-3 py-1.5 mb-3">You are the group creator</div>}
            <div className="flex-1 overflow-y-auto space-y-2">
              {members.map((m) => (
                <div key={m._id}>
                  <div className="flex items-center justify-between gap-2 p-3 rounded-2xl bg-muted/30 border border-border">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-2xl bg-blue-500/15 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">{m.name?.[0]?.toUpperCase() || "?"}</div>
                      <div>
                        <p className="font-semibold text-foreground text-sm">{m.name || "Preview User"}</p>
                        <p className="text-muted-foreground text-xs">{m.email || ""}</p>
                      </div>
                    </div>
                    {isCreator && m._id?.toString() !== PREVIEW_USER_ID && (
                      <button onClick={() => toggleConfirm(`rem-${m._id}`, 'remove')} className="text-xs font-semibold text-red-500 hover:text-red-600 dark:text-red-400 bg-red-500/10 hover:bg-red-500/20 px-2 py-1 rounded-lg transition-colors">Remove</button>
                    )}
                  </div>
                  {confirmState[`rem-${m._id}`] === 'remove' && (
                    <InlineConfirm message={`Remove ${m.name || 'this member'} from the group?`} onCancel={() => clearConfirm(`rem-${m._id}`)} onConfirm={() => handleRemoveMember(m._id)} confirmLabel="Yes, Remove" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Medicine Modal ── */}
      {editingMed && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setEditingMed(null)}>
          <div className="bg-card/90 backdrop-blur-2xl border border-white/10 dark:border-white/5 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.2)] p-7 w-[26rem] max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-foreground font-semibold text-lg flex items-center gap-2"><Pencil className="w-5 h-5 text-muted-foreground" /> Edit Schedule &amp; Details</h3>
              <button onClick={() => setEditingMed(null)} className="text-muted-foreground/70 hover:text-muted-foreground transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div><Label className="text-sm font-semibold text-muted-foreground">Name</Label>
                <Input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="mt-1.5 h-11 text-base rounded-2xl border-border" /></div>
              <div><Label className="text-sm font-semibold text-muted-foreground">Total Tablets</Label>
                <Input type="number" value={editForm.totalAmount} onChange={e => setEditForm({ ...editForm, totalAmount: parseInt(e.target.value) })} className="mt-1.5 h-11 text-base rounded-2xl border-border" /></div>
              <div><Label className="text-sm font-semibold text-muted-foreground">Times Per Day</Label>
                <Input type="number" min="1" value={editForm.timesPerDay} onChange={e => {
                  const val = Math.max(1, parseInt(e.target.value) || 1);
                  setEditForm({ ...editForm, timesPerDay: val, schedule: Array(val).fill("").map((_, i) => editForm.schedule[i] || "") });
                }} className="mt-1.5 h-11 text-base rounded-2xl border-border" /></div>
              <div className="grid grid-cols-2 gap-3">
                {editForm.schedule?.map((t, i) => (
                  <div key={i}><Label className="text-sm text-muted-foreground">Dose {i + 1}</Label>
                    <Input type="time" value={t} onChange={e => { const s = [...editForm.schedule]; s[i] = e.target.value; setEditForm({ ...editForm, schedule: s }); }} className="mt-1 h-10 text-base rounded-2xl border-border" /></div>
                ))}
              </div>
              <div><Label className="text-sm font-semibold text-muted-foreground">Instructions</Label>
                <Input placeholder="e.g. Take with food" value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} className="mt-1.5 h-11 text-base rounded-2xl border-border" /></div>
              <Button onClick={() => handleSaveEdit(editingMed)} className="w-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 text-white rounded-2xl flex items-center gap-2 justify-center h-11 font-semibold text-base">
                <Save className="w-4 h-4" /> Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════ SIDEBAR ══════════════════ */}
      <div className="w-56 border-r border-white/15 dark:border-white/5 bg-gradient-to-b from-card/80 to-muted/20 backdrop-blur-xl flex flex-col shrink-0 rounded-l-2xl overflow-hidden">

        {/* Header with create / join buttons */}
        <div className="px-4 pt-5 pb-3 border-b border-border/50">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] mb-3 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">My Groups</p>
          <div className="flex gap-1.5">
            <button onClick={() => setSidebarMode(sidebarMode === 'create' ? null : 'create')}
              className={`flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg text-xs font-semibold transition-colors border
                ${sidebarMode === 'create' ? 'bg-primary text-primary-foreground shadow-md text-white border-gray-900' : 'bg-card text-card-foreground hover:bg-muted text-foreground/90 border-border'}`}>
              <Plus className="w-3.5 h-3.5" /> Create
            </button>
            <button onClick={() => setSidebarMode(sidebarMode === 'join' ? null : 'join')}
              className={`flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg text-xs font-semibold transition-colors border
                ${sidebarMode === 'join' ? 'bg-primary text-primary-foreground shadow-md text-white border-gray-900' : 'bg-card text-card-foreground hover:bg-muted text-foreground/90 border-border'}`}>
              <UserPlus className="w-3.5 h-3.5" /> Join
            </button>
          </div>

          {/* Inline create form */}
          {sidebarMode === 'create' && (
            <div className="mt-3 flex gap-1.5">
              <Input autoFocus placeholder="Group name..." value={createName} onChange={e => setCreateName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreateGroup()}
                className="h-8 text-sm flex-1 rounded-lg border-border bg-card text-card-foreground text-foreground font-semibold placeholder:text-muted-foreground" />
              <button onClick={handleCreateGroup} className="h-8 px-3 bg-primary text-primary-foreground shadow-md hover:bg-primary/90 text-white text-xs font-semibold rounded-lg">Go</button>
            </div>
          )}

          {/* Inline join form */}
          {sidebarMode === 'join' && (
            <div className="mt-2 flex gap-1">
              <Input autoFocus placeholder="Invite code..." value={joinCode} onChange={e => setJoinCode(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleJoinGroup()}
                className="h-8 text-sm flex-1 rounded-lg border-border bg-card text-card-foreground text-foreground font-semibold placeholder:text-muted-foreground font-mono" />
              <button onClick={handleJoinGroup} className="h-8 px-3 bg-primary text-primary-foreground shadow-md hover:bg-primary/90 text-white text-xs font-semibold rounded-lg">Go</button>
            </div>
          )}
        </div>

        {/* Group list */}
        <div className="flex-1 overflow-y-auto">
          {loadingGroups ? (
            <div className="space-y-px pt-1">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="px-4 py-3.5 animate-pulse"><div className="h-3.5 bg-muted/60 rounded-lg w-28 mb-2" /><div className="h-2.5 bg-muted rounded w-14" /></div>
              ))}
            </div>
          ) : groups.length === 0 ? (
            <p className="p-8 text-center text-xs text-muted-foreground/60 italic leading-relaxed">No groups yet.<br />Create or join one above.</p>
          ) : groups.map(g => (
            <div key={g._id} onClick={() => setActiveGroup(g._id)}
              className={`px-4 py-3.5 cursor-pointer transition-all border-b border-border
                ${activeGroup === g._id ? "bg-primary/12 dark:bg-primary/25 border-l-[3px] border-l-primary" : "hover:bg-muted"}`}>
              <p className="font-bold text-sm leading-tight text-foreground truncate">{g.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] font-mono tracking-[0.15em] text-muted-foreground bg-muted/40 dark:bg-white/10 px-1.5 py-0.5 rounded-md">{g.code}</span>
                <button title="Copy invite code" onClick={e => { e.stopPropagation(); handleCopyCode(g.code, g._id); }}
                  className={`transition-colors ${activeGroup === g._id ? 'text-muted-foreground hover:text-foreground' : 'text-muted-foreground/70 hover:text-muted-foreground'}`}>
                  {copiedCode === g._id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════ DASHBOARD ══════════════════ */}
      <div className="flex-1 flex flex-col bg-card text-card-foreground overflow-hidden rounded-r-2xl">

        {error && (
          <div className="mx-5 mt-4 text-red-600 dark:text-red-400 text-sm bg-red-500/10 px-4 py-3 rounded-3xl border border-red-500/20 flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError("")} className="ml-3 text-red-300 hover:text-red-500"><X className="w-4 h-4" /></button>
          </div>
        )}

        {groupData && !loadingDetails ? (
          <>
            {/* Header */}
            <div className="px-6 py-4 bg-card text-card-foreground border-b border-border flex justify-between items-center">
              <div>
                <h3 className="font-bold text-foreground font-semibold text-lg leading-tight">{groupData.group.name}</h3>
                <p className="text-sm text-muted-foreground mt-0.5">Family Medicine Dashboard</p>
              </div>
              <div className="flex gap-2">
                <button title="View group members" onClick={() => { setShowMembers(true); fetchMembers(activeGroup); }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-semibold text-muted-foreground bg-muted/30 hover:bg-muted border border-border transition-colors">
                  <Users className="w-4 h-4" /> Members
                </button>
                <button title="Leave this group" onClick={() => toggleConfirm('leave', 'leave')}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-semibold text-orange-500 dark:text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 transition-colors">
                  <LogOut className="w-4 h-4" /> Leave
                </button>
                {isCreator && (
                  <button title="Permanently delete this group" onClick={() => toggleConfirm('del-group', 'delete-group')}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-semibold text-red-500 bg-red-50 hover:bg-red-500/15 border border-red-100 transition-colors">
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                )}
              </div>
            </div>

            {confirmState['leave'] === 'leave' && (
              <div className="px-5 pt-3">
                <InlineConfirm message="Leave this group? If you are the creator, ownership transfers to a random member."
                  onCancel={() => clearConfirm('leave')} onConfirm={handleLeaveGroup}
                  confirmLabel="Yes, Leave" confirmClass="bg-orange-500 hover:bg-orange-600 text-white" />
              </div>
            )}
            {confirmState['del-group'] === 'delete-group' && (
              <div className="px-5 pt-3">
                <InlineConfirm message="Permanently delete this group? All medicines and history will be lost forever."
                  onCancel={() => clearConfirm('del-group')} onConfirm={handleDeleteGroup} confirmLabel="Yes, Delete Forever" />
              </div>
            )}

            <div className="flex-1 flex overflow-hidden">
              {/* Medicine Panel */}
              <div className="flex-1 p-5 flex flex-col gap-4 border-r border-border overflow-y-auto">

                {/* Supply card + Add Medicine button side by side */}
                {groupData.medicines.length > 0 && (() => {
                  // Find the medicine with the MINIMUM daysLeft (the one running out soonest)
                  const lowestMed = groupData.medicines.reduce((min, m) =>
                    (m.daysLeft ?? Infinity) < (min.daysLeft ?? Infinity) ? m : min
                  );
                  const lowestDays = lowestMed.daysLeft ?? 0;
                  return (
                    <div className="flex items-stretch gap-3">
                      <div className={`flex-1 rounded-2xl text-white p-3 bg-gradient-to-br ${lowestDays <= 3 ? 'from-red-500 to-red-400' : 'from-emerald-600 to-emerald-500'}`}>
                        <p className="text-xs uppercase font-semibold opacity-70 tracking-widest">Lowest Supply</p>
                        <p className="text-xs font-semibold opacity-80 mt-0.5">{lowestMed.name}</p>
                        <p className="text-xl font-black mt-0.5 tracking-tight">{lowestDays} <span className="text-sm font-semibold opacity-70">days</span></p>
                        {lowestDays <= 3 && <p className="text-xs font-bold bg-card text-card-foreground/20 rounded-lg px-2 py-0.5 mt-1 inline-block">⚠ Refill Soon</p>}
                      </div>
                      <button onClick={() => setShowAddMed(true)} title="Add a new medicine to this group"
                        className="flex flex-col items-center justify-center gap-1 px-4 rounded-2xl border-2 border-dashed border-border hover:border-emerald-400/50 hover:bg-emerald-500/10 text-muted-foreground/70 hover:text-emerald-500 transition-all font-semibold text-xs group">
                        <div className="w-6 h-6 rounded-lg bg-muted group-hover:bg-emerald-500/20 flex items-center justify-center transition-colors">
                          <Plus className="w-3.5 h-3.5" />
                        </div>
                        Add Medicine
                      </button>
                    </div>
                  );
                })()}

                {/* If no medicines yet, show a centered prompt */}
                {groupData.medicines.length === 0 && (
                  <button onClick={() => setShowAddMed(true)}
                    className="border-2 border-dashed border-border hover:border-blue-400/50 hover:bg-blue-500/10 rounded-3xl p-10 text-center transition-all group">
                    <div className="w-10 h-10 rounded-3xl bg-muted/30 group-hover:bg-blue-500/20 flex items-center justify-center mx-auto mb-2 transition-colors">
                      <Plus className="w-5 h-5 text-muted-foreground/70 group-hover:text-blue-400" />
                    </div>
                    <p className="text-xs text-muted-foreground font-semibold">Add your first medicine</p>
                    <p className="text-[10px] text-muted-foreground/70 mt-0.5">Click to open the form</p>
                  </button>
                )}

                {/* Medicine cards */}
                <div className="space-y-4">
                  {groupData.medicines.map(m => {
                    const isLow = m.daysLeft <= 3;
                    const delKey = `del-${m._id}`;
                    const skipKey = `skip-${m._id}`;
                    const pct = Math.max(0, (m.remainingAmount / m.totalAmount) * 100);
                    const isMedCreator = m.addedBy?._id?.toString() === currentUserId || m.addedBy?.toString() === currentUserId || !m.addedBy;
                    return (
                      <div key={m._id} className={`p-5 border-2 rounded-3xl bg-card text-card-foreground shadow-soft ${isLow ? 'border-destructive/30 bg-destructive/10 shadow-[0_0_15px_rgba(239,68,68,0.15)] hover:shadow-[0_0_20px_rgba(239,68,68,0.25)]' : 'border-border'} transition-all`}>
                        {/* Info */}
                        <div className="mb-3">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <div className="flex flex-col"><p className="font-bold text-foreground font-semibold text-base">{m.name}</p><p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">Added by: {m.addedBy?.name || "Unknown"}</p></div>
                            {isLow && <span className="text-xs font-bold text-red-600 dark:text-red-400 bg-red-500/15 border border-red-500/20 px-2.5 py-1 rounded-full">⚠ Refill Soon</span>}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Next dose: <span className="font-semibold text-foreground/90">{m.nextDose || "—"}</span>
                            <span className="mx-2 text-muted-foreground/70">·</span>
                            <span className={`font-semibold ${isLow ? 'text-red-500' : 'text-emerald-600'}`}>{m.daysLeft ?? 0} days remaining</span>
                          </p>
                          {m.notes && <p className="text-sm text-muted-foreground mt-1 italic">📝 {m.notes}</p>}
                        </div>

                        {/* Schedule tags */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {m.schedule.filter(t => t && t.trim()).map((t, i) => (
                            <span key={i} className={`text-sm px-3 py-1.5 rounded-2xl font-bold border
                              ${t === m.nextDose ? "bg-primary text-primary-foreground shadow-md text-white border-gray-900" : "bg-muted text-muted-foreground border-border"}`}>
                              {t}
                            </span>
                          ))}
                        </div>

                        {/* Supply bar */}
                        <div className={`w-full h-2 rounded-full overflow-hidden mb-1.5 ${isLow ? 'bg-red-100' : 'bg-muted'}`}>
                          <div className={`h-full rounded-full transition-all duration-700 ${isLow ? 'bg-red-400' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
                        </div>
                        <p className="text-sm text-muted-foreground mb-4 text-right font-medium">{m.remainingAmount} / {m.totalAmount} tablets</p>

                        {/* Action row: Edit | Skip | Remove | Refill | Mark Taken (rightmost) */}
                        <div className="flex gap-2 flex-wrap">
                          <button title={isMedCreator ? "Edit schedule" : "Only the creator can edit"} disabled={!isMedCreator} onClick={() => startEditing(m)}
                            style={{ opacity: isMedCreator ? 1 : 0.5, pointerEvents: isMedCreator ? "auto" : "none" }}
                            className="flex items-center gap-1.5 px-4 h-10 rounded-2xl bg-card text-card-foreground hover:bg-muted text-foreground/90 text-sm font-semibold border border-border transition-colors">
                            <Pencil className="w-4 h-4" /> Edit
                          </button>
                          <button title={isMedCreator ? "Skip dose" : "Only the creator can skip"} disabled={!isMedCreator} onClick={() => toggleConfirm(skipKey, "skip")}
                            style={{ opacity: isMedCreator ? 1 : 0.5, pointerEvents: isMedCreator ? "auto" : "none" }}
                            className={`flex items-center gap-1.5 px-4 h-10 rounded-2xl text-sm font-semibold border transition-colors
                              ${confirmState[skipKey] === 'skip' ? 'bg-primary text-primary-foreground shadow-md text-white border-gray-900' : 'bg-card text-card-foreground hover:bg-muted text-foreground/90 border-border'}`}>
                            <SkipForward className="w-4 h-4" /> Skip
                          </button>
                          <button title={isMedCreator ? "Remove medicine" : "Only the creator can remove"} disabled={!isMedCreator} onClick={() => toggleConfirm(delKey, "delete")}
                            style={{ opacity: isMedCreator ? 1 : 0.5, pointerEvents: isMedCreator ? "auto" : "none" }}
                            className={`flex items-center gap-1.5 px-4 h-10 rounded-2xl text-sm font-semibold border transition-colors
                              ${confirmState[delKey] === 'delete' ? 'bg-primary text-primary-foreground shadow-md text-white border-gray-900' : 'bg-card text-card-foreground hover:bg-muted text-foreground/90 border-border'}`}>
                            <Trash2 className="w-4 h-4" /> Remove
                          </button>
                          <button title={isMedCreator ? "Refill supply" : "Only the creator can refill"} disabled={!isMedCreator} onClick={() => toggleConfirm(`refill-${m._id}`, "refill")}
                            style={{ opacity: isMedCreator ? 1 : 0.5, pointerEvents: isMedCreator ? "auto" : "none" }}
                            className={`flex items-center gap-1.5 px-4 h-10 rounded-2xl text-sm font-semibold border transition-colors
                              ${confirmState[`refill-${m._id}`] === 'refill' ? 'bg-primary text-primary-foreground shadow-md text-white border-gray-900' : 'bg-card text-card-foreground hover:bg-muted text-foreground/90 border-border'}`}>
                            <RefreshCw className="w-4 h-4" /> Refill
                          </button>
                          {/* Mark Taken — no confirmation, direct action */}
                          <button title="Mark this dose as taken — reduces remaining count by 1" onClick={() => handleMarkTaken(m._id)}
                            disabled={!isMedCreator || m.remainingAmount <= 0} title={isMedCreator ? "Mark taking dose" : "Only the creator can update taken dose"}
                            className="flex items-center gap-2 px-5 h-10 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold border border-emerald-700 disabled:opacity-30 disabled:cursor-not-allowed ml-auto transition-colors">
                            <CheckCircle className="w-4 h-4" /> Mark Taken
                          </button>
                        </div>

                        {/* Skip inline panel */}
                        {confirmState[skipKey] === 'skip' && (
                          <div className="mt-2 p-3 rounded-2xl bg-muted/30 border border-border flex flex-col gap-2">
                            <p className="text-xs text-foreground/90 font-semibold">Skip this dose — add a reason (optional)</p>
                            <Input placeholder="e.g. Doctor advised, not feeling well..." value={skipReason[m._id] || ""}
                              onChange={e => setSkipReason(prev => ({ ...prev, [m._id]: e.target.value }))}
                              className="h-7 text-xs bg-card text-card-foreground border-border rounded-2xl" />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => clearConfirm(skipKey)} variant="outline" className="h-7 px-3 text-xs rounded-2xl border-border text-muted-foreground">No, Cancel</Button>
                              <Button size="sm" onClick={() => handleSkipDose(m._id)} className="h-7 px-3 text-xs bg-primary text-primary-foreground shadow-md hover:bg-primary/90 text-white rounded-2xl font-semibold">
                                <SkipForward className="w-3 h-3 mr-1" /> Yes, Skip
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Delete inline confirm */}
                        {confirmState[delKey] === 'delete' && (
                          <InlineConfirm message={`Remove "${m.name}" permanently? This cannot be undone.`}
                            onCancel={() => clearConfirm(delKey)} onConfirm={() => handleDeleteMedicine(m._id)} confirmLabel="Yes, Remove" />
                        )}

                        {/* Refill inline panel */}
                        {confirmState[`refill-${m._id}`] === 'refill' && (
                          <div className="mt-2 p-3 rounded-2xl bg-muted/30 border border-border flex flex-col gap-2">
                            <p className="text-xs text-foreground/90 font-semibold">How many tablets to add?</p>
                            <div className="flex gap-2 items-center">
                              <Input type="number" placeholder="e.g. 30" min="1"
                                value={refillAmount[m._id] || ""} onChange={e => setRefillAmount(prev => ({ ...prev, [m._id]: e.target.value }))}
                                className="h-8 text-sm bg-card text-card-foreground border-border flex-1 rounded-2xl" />
                              <Button size="sm" onClick={() => clearConfirm(`refill-${m._id}`)} variant="outline" className="h-8 px-3 text-xs rounded-2xl border-border text-muted-foreground">Cancel</Button>
                              <Button size="sm" onClick={() => { handleRefill(m._id); clearConfirm(`refill-${m._id}`); }}
                                className="h-8 px-3 text-xs bg-primary text-primary-foreground shadow-md hover:bg-primary/90 text-white rounded-2xl font-semibold flex items-center gap-1">
                                <RefreshCw className="w-3 h-3" /> Add Tablets
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Activity Log */}
              <div className="w-80 min-w-[18rem] bg-card text-card-foreground border-l border-border flex flex-col overflow-hidden shrink-0">
                <div className="px-5 py-4 border-b border-border">
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Activity Log</p>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-1">
                  {(() => {
                    const grouped = groupByDate(groupData.activities);
                    return Object.entries(grouped).map(([dateStr, logs]) => (
                      <div key={dateStr}>
                        <div className="flex items-center gap-2 my-3">
                          <div className="flex-1 h-px bg-muted" />
                          <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-3 bg-muted/30 rounded-full py-1">{dateLabelFor(dateStr)}</span>
                          <div className="flex-1 h-px bg-muted" />
                        </div>
                        {logs.map(log => (
                          <div key={log._id} className={`px-4 py-3 rounded-3xl border mb-2 flex items-start gap-2.5 ${logCardStyle(log)}`}>
                            <div className="mt-0.5 shrink-0">{logIcon(log)}</div>
                            <p className={`text-sm leading-relaxed font-medium ${logTextColor(log)}`}>{buildLogSentence(log)}</p>
                          </div>
                        ))}
                      </div>
                    ));
                  })()}
                  {groupData.activities.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground/70 italic py-12">No activity yet</p>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : loadingDetails ? (
          <div className="flex-1 p-5 flex flex-col gap-4">
            <div className="flex gap-3"><div className="flex-1 h-20 rounded-3xl bg-muted animate-pulse" /><div className="w-24 h-20 rounded-3xl bg-muted animate-pulse" /></div>
            <SkeletonCard /><SkeletonCard />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center flex-col gap-3">
            <div className="w-16 h-16 bg-muted/30 rounded-3xl flex items-center justify-center border border-border">
              <Send className="w-6 h-6 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground/70">Select a group to view</p>
          </div>
        )}
      </div>
    </div>
  );
}
