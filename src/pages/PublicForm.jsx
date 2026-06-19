import React, { useEffect, useState } from "react";

const HUB = "https://base44.app/api/apps/69841af9c747b033a60780f2/functions";
const PINK = "#d6336c";

export default function PublicForm() {
  const token = new URLSearchParams(window.location.search).get("token");
  const [state, setState] = useState({ loading: true, error: "", form: null, done: false });
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) { setState({ loading: false, error: "Missing link token.", form: null, done: false }); return; }
    (async () => {
      try {
        const res = await fetch(`${HUB}/getPublicForm`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (!res.ok) {
          setState({ loading: false, error: data.error === "invalid_token" ? "This link is invalid or expired." : (data.error || "Could not load form."), form: null, done: false });
          return;
        }
        setState({ loading: false, error: "", form: data.form, done: !!data.already_submitted });
      } catch (e) {
        setState({ loading: false, error: "Network error. Please try again.", form: null, done: false });
      }
    })();
  }, [token]);

  const setVal = (id, v) => setAnswers((a) => ({ ...a, [id]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`${HUB}/submitPublicForm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, answers }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "already_submitted") { setState((s) => ({ ...s, done: true })); }
        else { alert(data.error || "Submission failed."); }
      } else {
        setState((s) => ({ ...s, done: true }));
      }
    } catch { alert("Network error. Please try again."); }
    setSubmitting(false);
  };

  const Card = ({ children }) => (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(160deg,#fff5f8,#ffe8f0)", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 560, background: "#fff", borderRadius: 20, boxShadow: "0 20px 60px rgba(214,51,108,0.15)", padding: 32 }}>{children}</div>
    </div>
  );

  if (state.loading) return <Card><p style={{ textAlign: "center", color: "#9b6" }}>Loading…</p></Card>;
  if (state.error) return <Card><h2 style={{ color: PINK }}>Hmm…</h2><p style={{ color: "#666" }}>{state.error}</p></Card>;
  if (state.done) return <Card><div style={{ textAlign: "center" }}><div style={{ fontSize: 48 }}>💗</div><h2 style={{ color: PINK }}>Thank you!</h2><p style={{ color: "#666" }}>Your response has been received.</p></div></Card>;

  const f = state.form;
  return (
    <Card>
      <h1 style={{ color: PINK, marginBottom: 4 }}>{f.name}</h1>
      <p style={{ color: "#999", marginBottom: 24, fontSize: 14 }}>Pilates in Pink Studio</p>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {(f.fields || []).map((field) => (
          <Field key={field.id} field={field} value={answers[field.id]} onChange={(v) => setVal(field.id, v)} />
        ))}
        <button type="submit" disabled={submitting} style={{ marginTop: 8, background: PINK, color: "#fff", border: "none", borderRadius: 12, padding: "14px 20px", fontWeight: 600, fontSize: 16, cursor: "pointer", opacity: submitting ? 0.6 : 1 }}>
          {submitting ? "Sending…" : "Submit"}
        </button>
      </form>
    </Card>
  );
}

function Field({ field, value, onChange }) {
  const label = <label style={{ display: "block", marginBottom: 6, fontWeight: 600, color: "#444", fontSize: 14 }}>{field.label}{field.required && <span style={{ color: "#d6336c" }}> *</span>}</label>;
  const base = { width: "100%", border: "1px solid #f3c6d6", borderRadius: 10, padding: "12px 14px", fontSize: 15, outline: "none", boxSizing: "border-box" };

  if (field.type === "textarea") return <div>{label}<textarea required={field.required} value={value || ""} onChange={(e) => onChange(e.target.value)} rows={4} style={base} /></div>;
  if (field.type === "select") return <div>{label}<select required={field.required} value={value || ""} onChange={(e) => onChange(e.target.value)} style={base}><option value="">Select…</option>{(field.options || []).map((o) => <option key={o} value={o}>{o}</option>)}</select></div>;
  if (field.type === "checkbox") return <div style={{ display: "flex", alignItems: "center", gap: 10 }}><input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} style={{ width: 18, height: 18, accentColor: "#d6336c" }} /><span style={{ color: "#444", fontSize: 14 }}>{field.label}</span></div>;

  const typeMap = { email: "email", phone: "tel", number: "number", date: "date", time: "time", text: "text" };
  return <div>{label}<input type={typeMap[field.type] || "text"} required={field.required} value={value || ""} onChange={(e) => onChange(e.target.value)} style={base} /></div>;
}