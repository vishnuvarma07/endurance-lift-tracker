export function selectVolumePoints(sessions, dayId, exerciseId) {
    return sessions.filter(session => String(session.day_id) === String(dayId) &&
        (!exerciseId || Object.hasOwn(session.exercise_volumes, String(exerciseId))))
        .map(session => ({ id: session.id, date: session.date,
            volume: exerciseId ? session.exercise_volumes[String(exerciseId)] : session.volume }));
}


// Brzycki estimate; an actual single rep uses the lifted weight directly.
export function estimateOneRepMax(weight, reps) {
    if (!Number.isFinite(weight) || weight < 0 || !Number.isInteger(reps) || reps < 1 || reps >= 37) return null;
    return reps === 1 ? weight : weight * 36 / (37 - reps);
}

export function selectExerciseMaxPoints(sessions, dayId, exerciseId) {
    return sessions.filter(session => String(session.day_id) === String(dayId))
        .flatMap(session => {
            const sets = [...(session.exercise_sets?.[String(exerciseId)] ?? [])]
                .sort((a, b) => a.set_number - b.set_number);
            let best = null;
            for (const set of sets) {
                const value = estimateOneRepMax(Number(set.weight), Number(set.reps));
                if (value !== null && (!best || value > best.volume)) {
                    best = { id: `${session.id}:${set.id ?? set.set_number}`,
                        date: session.date, volume: value, setNumber: set.set_number,
                        weight: set.weight, reps: set.reps };
                }
            }
            return best ? [best] : [];
        });
}

export function selectExerciseHistory(sessions, dayId, exerciseId, period = "all", now = new Date()) {
    const cutoff = new Date(now);
    if (period === "month") {
        const day = cutoff.getDate();
        cutoff.setDate(1);
        cutoff.setMonth(cutoff.getMonth() - 1);
        const lastDay = new Date(cutoff.getFullYear(), cutoff.getMonth() + 1, 0).getDate();
        cutoff.setDate(Math.min(day, lastDay));
    } else if (period === "year") {
        const month = cutoff.getMonth();
        cutoff.setFullYear(cutoff.getFullYear() - 1);
        if (cutoff.getMonth() !== month) cutoff.setDate(0);
    }
    cutoff.setHours(0, 0, 0, 0);
    return sessions.filter(session => String(session.day_id) === String(dayId) &&
        (session.exercise_sets?.[String(exerciseId)]?.length ?? 0) > 0 &&
        (period === "all" || new Date(session.date) >= cutoff))
        .map(session => ({ ...session, sets: [...session.exercise_sets[String(exerciseId)]]
            .sort((a, b) => a.set_number - b.set_number) }))
        .sort((a, b) => new Date(b.date) - new Date(a.date) || b.id - a.id);
}
