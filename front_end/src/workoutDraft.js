export const emptyWorkoutDraft = () => ({ setData: {}, setCounts: {}, newExerciseName: "", targetSets: "" });

export function workoutDraftKey(token, splitId, dayId) {
    try {
        const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        const { sub } = JSON.parse(atob(payload));
        if (sub == null) return null;
        return `endurance:workout-draft:${encodeURIComponent(sub)}:${splitId}:${dayId}`;
    } catch {
        return null;
    }
}

export function readWorkoutDraft(storage, key) {
    try {
        const value = JSON.parse(storage.getItem(key));
        if (!value || typeof value !== 'object') return emptyWorkoutDraft();
        return {
            setData: value.setData && typeof value.setData === 'object' && !Array.isArray(value.setData) ? value.setData : {},
            setCounts: Object.fromEntries(Object.entries(value.setCounts ?? {}).filter(([, count]) => Number.isInteger(count) && count > 0)),
            newExerciseName: typeof value.newExerciseName === 'string' ? value.newExerciseName : '',
            targetSets: typeof value.targetSets === 'number' || typeof value.targetSets === 'string' ? value.targetSets : ''
        };
    } catch {
        return emptyWorkoutDraft();
    }
}
