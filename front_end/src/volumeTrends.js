export function selectVolumePoints(sessions, dayId, exerciseId) {
    return sessions.filter(session => String(session.day_id) === String(dayId) &&
        (!exerciseId || Object.hasOwn(session.exercise_volumes, String(exerciseId))))
        .map(session => ({ id: session.id, date: session.date,
            volume: exerciseId ? session.exercise_volumes[String(exerciseId)] : session.volume }));
}


// Epley estimate; an actual single rep uses the lifted weight directly.
export function estimateOneRepMax(weight, reps) {
    if (!Number.isFinite(weight) || weight < 0 || !Number.isInteger(reps) || reps < 1) return null;
    return reps === 1 ? weight : weight * 36 / (37 - reps);
}

export function selectExerciseMaxPoints(sessions, dayId, exerciseId) {
    return sessions.filter(session => String(session.day_id) === String(dayId))
        .flatMap(session => [...(session.exercise_sets?.[String(exerciseId)] ?? [])]
            .sort((a, b) => a.set_number - b.set_number)
            .flatMap(set => {
                const value = estimateOneRepMax(Number(set.weight), Number(set.reps));
                return value === null ? [] : [{ id: `${session.id}:${set.id ?? set.set_number}`,
                    date: session.date, volume: value, setNumber: set.set_number,
                    weight: set.weight, reps: set.reps }];
            }));
}
