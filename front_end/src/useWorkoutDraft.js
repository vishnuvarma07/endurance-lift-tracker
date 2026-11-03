import { useRef, useState } from "react";
import { emptyWorkoutDraft, readWorkoutDraft } from "./workoutDraft";

export default function useWorkoutDraft(key) {
    const [draft, setDraft] = useState(() => {
        try { return key ? readWorkoutDraft(localStorage, key) : emptyWorkoutDraft(); }
        catch { return emptyWorkoutDraft(); }
    });
    const current = useRef(draft);
    const [storageError, setStorageError] = useState("");
    const updateDraft = (field, value) => {
        const next = { ...current.current, [field]: typeof value === "function" ? value(current.current[field]) : value };
        current.current = next;
        setDraft(next);
        try {
            if (!key) throw new Error("No account key");
            localStorage.setItem(key, JSON.stringify(next));
            setStorageError("");
        } catch {
            setStorageError("Your browser could not save this draft. Keep this page open to avoid losing entries.");
        }
    };
    return { draft, updateDraft, storageError };
}
