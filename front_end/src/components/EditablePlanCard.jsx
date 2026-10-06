import { useRef, useState } from "react";
import { Link } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

export default function EditablePlanCard({ item, number, kind, href, endpoint, onUpdated }) {
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState(item.name);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const savingRef = useRef(false);

    const cancel = () => {
        if (savingRef.current) return;
        setEditing(false);
        setError("");
    };
    const save = async (event) => {
        event.preventDefault();
        if (savingRef.current) return;
        const trimmedName = name.trim();
        if (!trimmedName) {
            setError("Enter a name.");
            return;
        }
        if (trimmedName === item.name) {
            cancel();
            return;
        }
        savingRef.current = true;
        setSaving(true);
        setError("");
        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify({ name: trimmedName })
            });
            if (!response.ok) throw new Error("Could not save the name. Please try again.");
            onUpdated(await response.json());
            setEditing(false);
        } catch (failure) {
            setError(failure.message || "Could not save the name. Please try again.");
        } finally {
            savingRef.current = false;
            setSaving(false);
        }
    };

    return <article className="plan-card editable-plan-card">
        <div className="plan-card-top"><span className="plan-number">{kind === "split" ? "PLAN" : "DAY"} {String(number).padStart(2, "0")}</span>
            {!editing && <button className="card-edit-button" aria-label={`Rename ${item.name}`} onClick={() => { setName(item.name); setError(""); setEditing(true); }}>Edit name</button>}
        </div>
        {editing ? <form className="card-rename-form" onSubmit={save} onKeyDown={event => { if (event.key === "Escape") { event.preventDefault(); cancel(); } }} aria-busy={saving}>
            <label>{kind === "split" ? "Split name" : "Day name"}<input autoFocus required value={name} disabled={saving} onChange={event => setName(event.target.value)} /></label>
            {error && <p className="card-rename-error" role="alert">{error}</p>}
            <div className="card-rename-actions"><button disabled={saving} type="submit">{saving ? "Saving…" : "Save"}</button><button disabled={saving} type="button" className="secondary-button" onClick={cancel}>Cancel</button></div>
        </form> : <Link className="plan-card-link" to={href}><h3>{item.name}</h3><span className="card-bottom">{kind === "split" ? "Explore training days" : "Start your session"}<span aria-hidden="true">↗</span></span></Link>}
    </article>;
}
