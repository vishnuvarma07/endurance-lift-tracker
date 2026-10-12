import { useEffect, useRef, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

export default function ExerciseNotes({ splitId, dayId, exercise }) {
    const [content, setContent] = useState("");
    const [savedContent, setSavedContent] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [loaded, setLoaded] = useState(false);
    const [retry, setRetry] = useState(0);
    const savingRef = useRef(false);
    const endpoint = `${API_URL}/splits/${splitId}/days/${dayId}/exercises/${exercise.id}/notes`;

    useEffect(() => {
        const controller = new AbortController();
        const load = async () => {
            try {
                const response = await fetch(endpoint, {
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                    signal: controller.signal
                });
                if (!response.ok) throw new Error("Could not load notes.");
                const data = await response.json();
                if (controller.signal.aborted) return;
                setContent(data.content);
                setSavedContent(data.content);
                setLoaded(true);
            } catch (failure) {
                if (failure.name !== "AbortError") setError("Could not load notes. Please try again.");
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        };
        load();
        return () => controller.abort();
    }, [endpoint, retry]);

    const save = async event => {
        event.preventDefault();
        if (savingRef.current || !loaded) return;
        savingRef.current = true;
        setSaving(true);
        setError("");
        try {
            const response = await fetch(endpoint, {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
                body: JSON.stringify({ content })
            });
            if (!response.ok) throw new Error("Could not save notes.");
            const data = await response.json();
            setSavedContent(data.content);
        } catch {
            setError("Could not save notes. Your edits are still here; please try again.");
        } finally {
            savingRef.current = false;
            setSaving(false);
        }
    };
    const dirty = content !== savedContent;
    return <details className="exercise-notes">
        <summary>Exercise notes{dirty ? " · Unsaved changes" : savedContent ? " · Saved" : ""}</summary>
        {loading ? <p className="muted" role="status">Loading notes…</p> : !loaded ? <div><p role="alert" className="card-rename-error">{error}</p><button type="button" className="secondary-button" onClick={() => { setLoading(true); setError(""); setRetry(value => value + 1); }}>Retry</button></div> :
            <form onSubmit={save} aria-busy={saving}>
                <label>Notes for {exercise.name}<textarea rows="4" value={content} disabled={saving} placeholder="Setup, technique cues, or reminders for next time…" onChange={event => setContent(event.target.value)} /></label>
                <div className="exercise-note-actions"><button type="submit" disabled={saving || !dirty}>{saving ? "Saving…" : "Save notes"}</button><span className="muted" role="status">{dirty ? "Unsaved changes" : "Saved for future sessions"}</span></div>
                {error && <p className="card-rename-error" role="alert">{error}</p>}
            </form>}
    </details>;
}
