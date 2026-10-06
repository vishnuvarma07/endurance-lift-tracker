import { useEffect, useRef, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

export default function ExerciseSettings({ exercises, splitId, dayId, onSaved, onClose }) {
    const dialog = useRef(null);
    const savingRef = useRef(false);
    const [draft, setDraft] = useState(() => exercises.map(exercise => ({ ...exercise })));
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    useEffect(() => {
        const element = dialog.current;
        element.showModal();
        return () => element.close();
    }, []);
    const change = (id, field, value) => setDraft(previous => previous.map(exercise => exercise.id === id ? { ...exercise, [field]: value } : exercise));
    const move = (index, direction) => setDraft(previous => {
        const next = [...previous];
        const destination = index + direction;
        if (destination < 0 || destination >= next.length) return previous;
        [next[index], next[destination]] = [next[destination], next[index]];
        return next;
    });
    const save = async event => {
        event.preventDefault();
        if (savingRef.current) return;
        if (draft.some(exercise => !exercise.name.trim() || !Number.isInteger(Number(exercise.target_sets)) || Number(exercise.target_sets) < 1)) {
            setError("Each exercise needs a name and a whole number of sets greater than zero.");
            return;
        }
        savingRef.current = true;
        setSaving(true);
        setError("");
        try {
            const response = await fetch(`${API_URL}/splits/${splitId}/days/${dayId}/exercise-settings`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
                body: JSON.stringify({ exercises: draft.map(exercise => ({ id: exercise.id, name: exercise.name.trim(), target_sets: Number(exercise.target_sets) })) })
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(typeof data.detail === "string" ? data.detail : "Could not save exercise settings.");
            }
            onSaved(await response.json());
        } catch (failure) {
            setError(failure.message || "Could not save exercise settings. Please try again.");
        } finally {
            savingRef.current = false;
            setSaving(false);
        }
    };
    return <dialog className="exercise-settings-dialog" ref={dialog} aria-labelledby="exercise-settings-title" onCancel={event => { event.preventDefault(); if (!savingRef.current) onClose(); }}>
        <form onSubmit={save} aria-busy={saving}>
            <div className="settings-heading"><div><p className="eyebrow">CUSTOMIZE YOUR SESSION</p><h2 id="exercise-settings-title">Exercise settings</h2></div><button type="button" className="quiet-button" disabled={saving} onClick={onClose} aria-label="Close exercise settings">✕</button></div>
            <p className="muted">Edit names and planned sets. Use the arrows to change exercise order.</p>
            <div className="settings-exercise-list">{draft.map((exercise, index) => <fieldset key={exercise.id} className="settings-exercise-row" disabled={saving}>
                <legend>Exercise {index + 1}</legend>
                <label>Name<input required value={exercise.name} onChange={event => change(exercise.id, "name", event.target.value)} /></label>
                <label>Sets<input required type="number" min="1" step="1" value={exercise.target_sets} onChange={event => change(exercise.id, "target_sets", event.target.value)} /></label>
                <div className="settings-order-controls"><button type="button" className="secondary-button" disabled={index === 0} aria-label={`Move ${exercise.name} up`} onClick={() => move(index, -1)}>↑</button><button type="button" className="secondary-button" disabled={index === draft.length - 1} aria-label={`Move ${exercise.name} down`} onClick={() => move(index, 1)}>↓</button></div>
            </fieldset>)}</div>
            {error && <p className="card-rename-error" role="alert">{error}</p>}
            <div className="settings-footer"><button type="button" className="secondary-button" disabled={saving} onClick={onClose}>Cancel</button><button type="submit" disabled={saving}>{saving ? "Saving…" : "Save changes"}</button></div>
        </form>
    </dialog>;
}
