// Only visible, fully entered sets belong to the session being saved.
export function collectCompletedSets(exercises, setData, setCounts) {
    return exercises.flatMap(exercise => {
        const count = setCounts[exercise.id] ?? exercise.target_sets;
        return Object.entries(setData[exercise.id] ?? {}).flatMap(([number, values]) => {
            const setNumber = Number(number);
            if (setNumber < 1 || setNumber > count) return [];
            if (values.weight == null || values.reps == null ||
                String(values.weight).trim() === "" || String(values.reps).trim() === "") return [];
            const weight = Number(values.weight);
            const reps = Number(values.reps);
            if (!Number.isFinite(weight) || weight < 0 ||
                !Number.isInteger(reps) || reps < 1) return [];
            return [{ exercise_id: exercise.id, set_number: setNumber, weight, reps }];
        });
    });
}
