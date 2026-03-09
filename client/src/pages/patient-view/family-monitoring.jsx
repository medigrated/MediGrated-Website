import React, { useEffect, useState } from "react";
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

function InlineConfirm({ message, onConfirm, onCancel, confirmLabel = "Confirm", confirmClass = "bg-gray-900 hover:bg-gray-700 text-white" }) {
  return (
    <div className="mt-3 p-4 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col gap-3">
      <p className="text-sm text-gray-700 font-medium leading-snug">{message}</p>
      <div className="flex gap-2">
        <Button size="sm" onClick={onCancel} variant="outline" className="h-9 px-4 text-sm border-gray-200 text-gray-500 rounded-xl">No, Cancel</Button>
        <Button size="sm" onClick={onConfirm} className={`h-9 px-4 text-sm rounded-xl font-semibold ${confirmClass}`}>{confirmLabel}</Button>
      </div>
    </div>
  );
}

// ─── Skeleton Loaders ─────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="p-5 border rounded-2xl border-gray-100 bg-white animate-pulse">
      <div className="h-5 bg-gray-100 rounded w-36 mb-2" />
      <div className="h-3.5 bg-gray-100 rounded w-24 mb-4" />
      <div className="flex gap-2 mb-4"><div className="h-7 w-16 bg-gray-100 rounded-lg" /><div className="h-7 w-16 bg-gray-100 rounded-lg" /></div>
      <div className="h-2 bg-gray-100 rounded-full" />
    </div>
  );
}

// ─── Add Medicine Modal ───────────────────────────────────────────────────────

function AddMedicineModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ name: "", totalAmount: "", timesPerDay: 1, schedule: [""], notes: "" });
  const [err, setErr] = useState("");

  function handleAdd() {
    if (!form.name.trim() || !form.totalAmount) { setErr("Name and tablet count are required"); return; }
    onAdd(form);
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl p-7 w-96 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
            <Plus className="w-5 h-5 text-emerald-600" /> Add New Medicine
          </h3>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-600 transition-colors"><X className="w-5 h-5" /></button>
        </div>
        {err && <p className="text-red-500 text-xs mb-3 bg-red-50 px-3 py-2 rounded-xl">{err}</p>}
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-semibold text-gray-600">Medicine Name</Label>
            <Input autoFocus placeholder="e.g. Paracetamol" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1.5 h-11 text-base rounded-xl border-gray-200" />
          </div>
          <div>
            <Label className="text-sm font-semibold text-gray-600">Total Tablets (pack size)</Label>
            <Input type="number" placeholder="e.g. 30" value={form.totalAmount} onChange={e => setForm({ ...form, totalAmount: e.target.value })} className="mt-1.5 h-11 text-base rounded-xl border-gray-200" />
          </div>
          <div>
            <Label className="text-sm font-semibold text-gray-600">Instructions (optional)</Label>
            <Input placeholder="e.g. Take with food" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="mt-1.5 h-11 text-base rounded-xl border-gray-200" />
          </div>
          <div className="flex items-center gap-3">
            <Label className="text-sm font-semibold text-gray-600 shrink-0">Doses Per Day</Label>
            <Input type="number" min="1" value={form.timesPerDay} className="h-10 w-16 text-base rounded-xl border-gray-200 text-center"
              onChange={e => { const v = Math.max(1, parseInt(e.target.value) || 1); setForm({ ...form, timesPerDay: v, schedule: Array(v).fill("") }); }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {form.schedule.map((t, i) => (
              <div key={i}>
                <Label className="text-sm text-gray-500">Dose {i + 1} Time</Label>
                <Input type="time" value={t} onChange={e => { const s = [...form.schedule]; s[i] = e.target.value; setForm({ ...form, schedule: s }); }} className="mt-1 h-10 text-base rounded-xl border-gray-200" />
              </div>
            ))}
          </div>
          <Button onClick={handleAdd} className="w-full bg-gray-900 hover:bg-gray-700 text-white rounded-xl font-semibold h-11 text-base mt-1">
            <Plus className="w-4 h-4 mr-1.5" /> Add Medicine
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FamilyMonitoring() {
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
      if (res.data.success) setGroupData(res.data);
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
    if (log.status === 'missed') return "bg-red-50 border-red-100";
    if (log.status === 'skipped') return "bg-violet-50 border-violet-100";
    return "bg-white border-gray-100";
  };

  const logIcon = (log) => {
    if (log.status === 'missed') return <AlertCircle className="w-3 h-3 shrink-0 mt-0.5 text-red-400" />;
    if (log.status === 'skipped') return <SkipForward className="w-3 h-3 shrink-0 mt-0.5 text-violet-400" />;
    return <CheckCircle className="w-3 h-3 shrink-0 mt-0.5 text-emerald-400 opacity-60" />;
  };

  const logTextColor = (log) => {
    if (log.status === 'missed') return "text-red-700";
    if (log.status === 'skipped') return "text-violet-700";
    return "text-gray-600";
  };

  return (
    <div className="flex h-[calc(100vh-120px)] w-full max-w-6xl mx-auto overflow-hidden border border-gray-100 rounded-2xl shadow-sm bg-gray-50 text-gray-900">

      {/* ── Add Medicine Modal ── */}
      {showAddMed && <AddMedicineModal onClose={() => setShowAddMed(false)} onAdd={handleAddMedicine} />}

      {/* ── Members Modal ── */}
      {showMembers && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setShowMembers(false)}>
          <div className="bg-white rounded-3xl shadow-2xl p-6 w-80 max-h-[65vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2"><Users className="w-4 h-4 text-blue-500" /> Group Members</h3>
              <button onClick={() => setShowMembers(false)} className="text-gray-300 hover:text-gray-600"><X className="w-4 h-4" /></button>
            </div>
            {isCreator && <div className="text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-1.5 mb-3">You are the group creator</div>}
            <div className="flex-1 overflow-y-auto space-y-2">
              {members.map((m) => (
                <div key={m._id}>
                  <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">{m.name?.[0]?.toUpperCase() || "?"}</div>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">{m.name || "Preview User"}</p>
                        <p className="text-gray-400 text-xs">{m.email || ""}</p>
                      </div>
                    </div>
                    {isCreator && m._id?.toString() !== PREVIEW_USER_ID && (
                      <button onClick={() => toggleConfirm(`rem-${m._id}`, 'remove')} className="text-xs font-semibold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2 py-1 rounded-lg transition-colors">Remove</button>
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
          <div className="bg-white rounded-3xl shadow-2xl p-7 w-[26rem] max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2"><Pencil className="w-5 h-5 text-gray-600" /> Edit Schedule &amp; Details</h3>
              <button onClick={() => setEditingMed(null)} className="text-gray-300 hover:text-gray-600 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div><Label className="text-sm font-semibold text-gray-600">Name</Label>
                <Input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="mt-1.5 h-11 text-base rounded-xl border-gray-200" /></div>
              <div><Label className="text-sm font-semibold text-gray-600">Total Tablets</Label>
                <Input type="number" value={editForm.totalAmount} onChange={e => setEditForm({ ...editForm, totalAmount: parseInt(e.target.value) })} className="mt-1.5 h-11 text-base rounded-xl border-gray-200" /></div>
              <div><Label className="text-sm font-semibold text-gray-600">Times Per Day</Label>
                <Input type="number" min="1" value={editForm.timesPerDay} onChange={e => {
                  const val = Math.max(1, parseInt(e.target.value) || 1);
                  setEditForm({ ...editForm, timesPerDay: val, schedule: Array(val).fill("").map((_, i) => editForm.schedule[i] || "") });
                }} className="mt-1.5 h-11 text-base rounded-xl border-gray-200" /></div>
              <div className="grid grid-cols-2 gap-3">
                {editForm.schedule?.map((t, i) => (
                  <div key={i}><Label className="text-sm text-gray-500">Dose {i + 1}</Label>
                    <Input type="time" value={t} onChange={e => { const s = [...editForm.schedule]; s[i] = e.target.value; setEditForm({ ...editForm, schedule: s }); }} className="mt-1 h-10 text-base rounded-xl border-gray-200" /></div>
                ))}
              </div>
              <div><Label className="text-sm font-semibold text-gray-600">Instructions</Label>
                <Input placeholder="e.g. Take with food" value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} className="mt-1.5 h-11 text-base rounded-xl border-gray-200" /></div>
              <Button onClick={() => handleSaveEdit(editingMed)} className="w-full bg-gray-900 hover:bg-gray-700 text-white rounded-xl flex items-center gap-2 justify-center h-11 font-semibold text-base">
                <Save className="w-4 h-4" /> Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════ SIDEBAR ══════════════════ */}
      <div className="w-48 border-r border-gray-200 bg-stone-50 flex flex-col shrink-0 rounded-l-2xl overflow-hidden">

        {/* Header with create / join buttons */}
        <div className="px-3 pt-4 pb-2 border-b border-gray-200">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">My Groups</p>
          <div className="flex gap-1.5">
            <button onClick={() => setSidebarMode(sidebarMode === 'create' ? null : 'create')}
              className={`flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg text-xs font-semibold transition-colors border
                ${sidebarMode === 'create' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white hover:bg-gray-100 text-gray-700 border-gray-300'}`}>
              <Plus className="w-3.5 h-3.5" /> Create
            </button>
            <button onClick={() => setSidebarMode(sidebarMode === 'join' ? null : 'join')}
              className={`flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg text-xs font-semibold transition-colors border
                ${sidebarMode === 'join' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white hover:bg-gray-100 text-gray-700 border-gray-300'}`}>
              <UserPlus className="w-3.5 h-3.5" /> Join
            </button>
          </div>

          {/* Inline create form */}
          {sidebarMode === 'create' && (
            <div className="mt-2 flex gap-1">
              <Input autoFocus placeholder="Group name..." value={createName} onChange={e => setCreateName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreateGroup()}
                className="h-8 text-sm flex-1 rounded-lg border-gray-200 bg-white text-gray-900 placeholder:text-gray-400" />
              <button onClick={handleCreateGroup} className="h-8 px-3 bg-gray-900 hover:bg-gray-700 text-white text-xs font-semibold rounded-lg">Go</button>
            </div>
          )}

          {/* Inline join form */}
          {sidebarMode === 'join' && (
            <div className="mt-2 flex gap-1">
              <Input autoFocus placeholder="Invite code..." value={joinCode} onChange={e => setJoinCode(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleJoinGroup()}
                className="h-8 text-sm flex-1 rounded-lg border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 font-mono" />
              <button onClick={handleJoinGroup} className="h-8 px-3 bg-gray-900 hover:bg-gray-700 text-white text-xs font-semibold rounded-lg">Go</button>
            </div>
          )}
        </div>

        {/* Group list */}
        <div className="flex-1 overflow-y-auto">
          {loadingGroups ? (
            <div className="space-y-px pt-1">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="px-4 py-3.5 animate-pulse"><div className="h-3.5 bg-gray-200 rounded w-28 mb-2" /><div className="h-2.5 bg-gray-100 rounded w-14" /></div>
              ))}
            </div>
          ) : groups.length === 0 ? (
            <p className="p-6 text-center text-xs text-gray-400 italic">No groups yet.<br />Create or join one above.</p>
          ) : groups.map(g => (
            <div key={g._id} onClick={() => setActiveGroup(g._id)}
              className={`px-4 py-3.5 cursor-pointer transition-all border-b border-gray-100
                ${activeGroup === g._id ? "bg-amber-50" : "hover:bg-gray-100"}`}>
              <p className="font-semibold text-sm leading-tight text-gray-900">{g.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xs font-mono tracking-widest text-gray-400">{g.code}</span>
                <button title="Copy invite code" onClick={e => { e.stopPropagation(); handleCopyCode(g.code, g._id); }}
                  className={`transition-colors ${activeGroup === g._id ? 'text-gray-400 hover:text-white' : 'text-gray-300 hover:text-gray-600'}`}>
                  {copiedCode === g._id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════ DASHBOARD ══════════════════ */}
      <div className="flex-1 flex flex-col bg-white overflow-hidden rounded-r-2xl">

        {error && (
          <div className="mx-5 mt-4 text-red-700 text-sm bg-red-50 px-4 py-3 rounded-2xl border border-red-100 flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError("")} className="ml-3 text-red-300 hover:text-red-500"><X className="w-4 h-4" /></button>
          </div>
        )}

        {groupData && !loadingDetails ? (
          <>
            {/* Header */}
            <div className="px-6 py-4 bg-white border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-gray-900 text-lg leading-tight">{groupData.group.name}</h3>
                <p className="text-sm text-gray-400 mt-0.5">Family Medicine Dashboard</p>
              </div>
              <div className="flex gap-2">
                <button title="View group members" onClick={() => { setShowMembers(true); fetchMembers(activeGroup); }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-colors">
                  <Users className="w-4 h-4" /> Members
                </button>
                <button title="Leave this group" onClick={() => toggleConfirm('leave', 'leave')}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-orange-500 bg-orange-50 hover:bg-orange-100 border border-orange-100 transition-colors">
                  <LogOut className="w-4 h-4" /> Leave
                </button>
                {isCreator && (
                  <button title="Permanently delete this group" onClick={() => toggleConfirm('del-group', 'delete-group')}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-red-500 bg-red-50 hover:bg-red-100 border border-red-100 transition-colors">
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
              <div className="flex-1 p-5 flex flex-col gap-4 border-r border-gray-100 overflow-y-auto">

                {/* Supply card + Add Medicine button side by side */}
                {groupData.medicines.length > 0 && (() => {
                  // Find the medicine with the MINIMUM daysLeft (the one running out soonest)
                  const lowestMed = groupData.medicines.reduce((min, m) =>
                    (m.daysLeft ?? Infinity) < (min.daysLeft ?? Infinity) ? m : min
                  );
                  const lowestDays = lowestMed.daysLeft ?? 0;
                  return (
                    <div className="flex items-stretch gap-3">
                      <div className={`flex-1 rounded-xl text-white p-3 bg-gradient-to-br ${lowestDays <= 3 ? 'from-red-500 to-red-400' : 'from-emerald-600 to-emerald-500'}`}>
                        <p className="text-xs uppercase font-semibold opacity-70 tracking-widest">Lowest Supply</p>
                        <p className="text-xs font-semibold opacity-80 mt-0.5">{lowestMed.name}</p>
                        <p className="text-xl font-black mt-0.5 tracking-tight">{lowestDays} <span className="text-sm font-semibold opacity-70">days</span></p>
                        {lowestDays <= 3 && <p className="text-xs font-bold bg-white/20 rounded-lg px-2 py-0.5 mt-1 inline-block">⚠ Refill Soon</p>}
                      </div>
                      <button onClick={() => setShowAddMed(true)} title="Add a new medicine to this group"
                        className="flex flex-col items-center justify-center gap-1 px-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-emerald-400 hover:bg-emerald-50/40 text-gray-300 hover:text-emerald-500 transition-all font-semibold text-xs group">
                        <div className="w-6 h-6 rounded-lg bg-gray-100 group-hover:bg-emerald-100 flex items-center justify-center transition-colors">
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
                    className="border-2 border-dashed border-gray-100 hover:border-blue-300 hover:bg-blue-50/30 rounded-2xl p-10 text-center transition-all group">
                    <div className="w-10 h-10 rounded-2xl bg-gray-50 group-hover:bg-blue-100 flex items-center justify-center mx-auto mb-2 transition-colors">
                      <Plus className="w-5 h-5 text-gray-300 group-hover:text-blue-500" />
                    </div>
                    <p className="text-xs text-gray-400 font-semibold">Add your first medicine</p>
                    <p className="text-[10px] text-gray-300 mt-0.5">Click to open the form</p>
                  </button>
                )}

                {/* Medicine cards */}
                <div className="space-y-4">
                  {groupData.medicines.map(m => {
                    const isLow = m.daysLeft <= 3;
                    const delKey = `del-${m._id}`;
                    const skipKey = `skip-${m._id}`;
                    const pct = Math.max(0, (m.remainingAmount / m.totalAmount) * 100);
                    return (
                      <div key={m._id} className={`p-5 border-2 rounded-2xl bg-white shadow-sm ${isLow ? 'border-red-200 bg-red-50/20' : 'border-gray-100'} transition-all`}>
                        {/* Info */}
                        <div className="mb-3">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <p className="font-bold text-gray-900 text-base">{m.name}</p>
                            {isLow && <span className="text-xs font-bold text-red-600 bg-red-100 border border-red-200 px-2.5 py-1 rounded-full">⚠ Refill Soon</span>}
                          </div>
                          <p className="text-sm text-gray-500">
                            Next dose: <span className="font-semibold text-gray-700">{m.nextDose || "—"}</span>
                            <span className="mx-2 text-gray-300">·</span>
                            <span className={`font-semibold ${isLow ? 'text-red-500' : 'text-emerald-600'}`}>{m.daysLeft ?? 0} days remaining</span>
                          </p>
                          {m.notes && <p className="text-sm text-gray-500 mt-1 italic">📝 {m.notes}</p>}
                        </div>

                        {/* Schedule tags */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {m.schedule.filter(t => t && t.trim()).map((t, i) => (
                            <span key={i} className={`text-sm px-3 py-1.5 rounded-xl font-bold border
                              ${t === m.nextDose ? "bg-gray-900 text-white border-gray-900" : "bg-gray-100 text-gray-600 border-gray-200"}`}>
                              {t}
                            </span>
                          ))}
                        </div>

                        {/* Supply bar */}
                        <div className={`w-full h-2 rounded-full overflow-hidden mb-1.5 ${isLow ? 'bg-red-100' : 'bg-gray-100'}`}>
                          <div className={`h-full rounded-full transition-all duration-700 ${isLow ? 'bg-red-400' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
                        </div>
                        <p className="text-sm text-gray-500 mb-4 text-right font-medium">{m.remainingAmount} / {m.totalAmount} tablets</p>

                        {/* Action row: Edit | Skip | Remove | Refill | Mark Taken (rightmost) */}
                        <div className="flex gap-2 flex-wrap">
                          <button title="Edit schedule and details" onClick={() => startEditing(m)}
                            className="flex items-center gap-1.5 px-4 h-10 rounded-xl bg-white hover:bg-gray-100 text-gray-700 text-sm font-semibold border border-gray-200 transition-colors">
                            <Pencil className="w-4 h-4" /> Edit
                          </button>
                          <button title="Skip this dose intentionally" onClick={() => toggleConfirm(skipKey, 'skip')}
                            className={`flex items-center gap-1.5 px-4 h-10 rounded-xl text-sm font-semibold border transition-colors
                              ${confirmState[skipKey] === 'skip' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white hover:bg-gray-100 text-gray-700 border-gray-200'}`}>
                            <SkipForward className="w-4 h-4" /> Skip
                          </button>
                          <button title="Remove this medicine from the group" onClick={() => toggleConfirm(delKey, 'delete')}
                            className={`flex items-center gap-1.5 px-4 h-10 rounded-xl text-sm font-semibold border transition-colors
                              ${confirmState[delKey] === 'delete' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white hover:bg-gray-100 text-gray-700 border-gray-200'}`}>
                            <Trash2 className="w-4 h-4" /> Remove
                          </button>
                          <button title="Refill tablet supply" onClick={() => toggleConfirm(`refill-${m._id}`, 'refill')}
                            className={`flex items-center gap-1.5 px-4 h-10 rounded-xl text-sm font-semibold border transition-colors
                              ${confirmState[`refill-${m._id}`] === 'refill' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white hover:bg-gray-100 text-gray-700 border-gray-200'}`}>
                            <RefreshCw className="w-4 h-4" /> Refill
                          </button>
                          {/* Mark Taken — no confirmation, direct action */}
                          <button title="Mark this dose as taken — reduces remaining count by 1" onClick={() => handleMarkTaken(m._id)}
                            disabled={m.remainingAmount <= 0}
                            className="flex items-center gap-2 px-5 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold border border-emerald-700 disabled:opacity-30 disabled:cursor-not-allowed ml-auto transition-colors">
                            <CheckCircle className="w-4 h-4" /> Mark Taken
                          </button>
                        </div>

                        {/* Skip inline panel */}
                        {confirmState[skipKey] === 'skip' && (
                          <div className="mt-2 p-3 rounded-xl bg-gray-50 border border-gray-200 flex flex-col gap-2">
                            <p className="text-xs text-gray-700 font-semibold">Skip this dose — add a reason (optional)</p>
                            <Input placeholder="e.g. Doctor advised, not feeling well..." value={skipReason[m._id] || ""}
                              onChange={e => setSkipReason(prev => ({ ...prev, [m._id]: e.target.value }))}
                              className="h-7 text-xs bg-white border-gray-200 rounded-xl" />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => clearConfirm(skipKey)} variant="outline" className="h-7 px-3 text-xs rounded-xl border-gray-200 text-gray-500">No, Cancel</Button>
                              <Button size="sm" onClick={() => handleSkipDose(m._id)} className="h-7 px-3 text-xs bg-gray-900 hover:bg-gray-700 text-white rounded-xl font-semibold">
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
                          <div className="mt-2 p-3 rounded-xl bg-gray-50 border border-gray-200 flex flex-col gap-2">
                            <p className="text-xs text-gray-700 font-semibold">How many tablets to add?</p>
                            <div className="flex gap-2 items-center">
                              <Input type="number" placeholder="e.g. 30" min="1"
                                value={refillAmount[m._id] || ""} onChange={e => setRefillAmount(prev => ({ ...prev, [m._id]: e.target.value }))}
                                className="h-8 text-sm bg-white border-gray-200 flex-1 rounded-xl" />
                              <Button size="sm" onClick={() => clearConfirm(`refill-${m._id}`)} variant="outline" className="h-8 px-3 text-xs rounded-xl border-gray-200 text-gray-500">Cancel</Button>
                              <Button size="sm" onClick={() => { handleRefill(m._id); clearConfirm(`refill-${m._id}`); }}
                                className="h-8 px-3 text-xs bg-gray-900 hover:bg-gray-700 text-white rounded-xl font-semibold flex items-center gap-1">
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
              <div className="w-80 min-w-[18rem] bg-white border-l border-gray-100 flex flex-col overflow-hidden shrink-0">
                <div className="px-5 py-4 border-b border-gray-100">
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Activity Log</p>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-1">
                  {(() => {
                    const grouped = groupByDate(groupData.activities);
                    return Object.entries(grouped).map(([dateStr, logs]) => (
                      <div key={dateStr}>
                        <div className="flex items-center gap-2 my-3">
                          <div className="flex-1 h-px bg-gray-100" />
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest px-3 bg-gray-50 rounded-full py-1">{dateLabelFor(dateStr)}</span>
                          <div className="flex-1 h-px bg-gray-100" />
                        </div>
                        {logs.map(log => (
                          <div key={log._id} className={`px-4 py-3 rounded-2xl border mb-2 flex items-start gap-2.5 ${logCardStyle(log)}`}>
                            <div className="mt-0.5 shrink-0">{logIcon(log)}</div>
                            <p className={`text-sm leading-relaxed font-medium ${logTextColor(log)}`}>{buildLogSentence(log)}</p>
                          </div>
                        ))}
                      </div>
                    ));
                  })()}
                  {groupData.activities.length === 0 && (
                    <p className="text-center text-sm text-gray-300 italic py-12">No activity yet</p>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : loadingDetails ? (
          <div className="flex-1 p-5 flex flex-col gap-4">
            <div className="flex gap-3"><div className="flex-1 h-20 rounded-2xl bg-gray-100 animate-pulse" /><div className="w-24 h-20 rounded-2xl bg-gray-100 animate-pulse" /></div>
            <SkeletonCard /><SkeletonCard />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center flex-col gap-3">
            <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center border border-gray-100">
              <Send className="w-6 h-6 text-gray-200" />
            </div>
            <p className="text-sm font-semibold uppercase tracking-widest text-gray-300">Select a group to view</p>
          </div>
        )}
      </div>
    </div>
  );
}
