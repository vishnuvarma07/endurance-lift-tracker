import { test } from 'node:test';
import assert from 'node:assert/strict';
import { selectVolumePoints } from '../src/volumeTrends.js';
const sessions = [
    { id: 1, day_id: 2, date: '2026-10-01', volume: 1200, exercise_volumes: { 3: 800, 4: 400 } },
    { id: 2, day_id: 5, date: '2026-10-02', volume: 3000, exercise_volumes: { 6: 3000 } },
    { id: 3, day_id: 2, date: '2026-10-03', volume: 500, exercise_volumes: { 4: 500 } },
    { id: 4, day_id: 2, date: '2026-10-04', volume: 0, exercise_volumes: { 3: 0 } }
];
test('day trend uses the full session volume and isolates the chosen day', () => {
    assert.deepEqual(selectVolumePoints(sessions, '2', '').map(p => p.volume), [1200, 500, 0]);
});
test('exercise trend excludes skipped sessions but preserves recorded zero volume', () => {
    assert.deepEqual(selectVolumePoints(sessions, '2', '3').map(p => [p.id, p.volume]), [[1, 800], [4, 0]]);
    assert.deepEqual(selectVolumePoints(sessions, '2', '99'), []);
});

test('estimated 1RM uses the updated formula, handles singles, and rejects invalid sets', async () => {
    const { estimateOneRepMax } = await import('../src/volumeTrends.js');
    assert.equal(estimateOneRepMax(100, 6), 100 * 36 / 31);
    assert.equal(estimateOneRepMax(100, 37), null);
    assert.equal(estimateOneRepMax(100, 40), null);
    assert.equal(estimateOneRepMax(150, 1), 150);
    assert.equal(estimateOneRepMax(0, 10), 0);
    assert.equal(estimateOneRepMax(100, 0), null);
    assert.equal(estimateOneRepMax(-5, 10), null);
});
test('exercise 1RM plots only the highest set per workout and skips other exercises', async () => {
    const { selectExerciseMaxPoints } = await import('../src/volumeTrends.js');
    const history = [{ id: 1, day_id: 2, date: '2026-10-01', exercise_sets: {
        3: [{ id: 11, set_number: 2, weight: 150, reps: 1 }, { id: 10, set_number: 1, weight: 100, reps: 6 }]
    } }, { id: 2, day_id: 2, date: '2026-10-02', exercise_sets: { 4: [{ id: 12, set_number: 1, weight: 200, reps: 5 }] } }];
    assert.deepEqual(selectExerciseMaxPoints(history, '2', '3').map(p => [p.id, p.volume, p.setNumber]), [['1:11', 150, 2]]);
});

test('highest estimate wins even when it comes from a lighter set; ties use the first set', async () => {
    const { selectExerciseMaxPoints } = await import('../src/volumeTrends.js');
    const history = [{ id: 1, day_id: 2, date: '2026-10-01', exercise_sets: { 3: [
        { id: 10, set_number: 1, weight: 100, reps: 12 },
        { id: 11, set_number: 2, weight: 120, reps: 2 }
    ] } }, { id: 2, day_id: 2, date: '2026-10-02', exercise_sets: { 3: [
        { id: 12, set_number: 1, weight: 100, reps: 1 },
        { id: 13, set_number: 2, weight: 100, reps: 1 }
    ] } }];
    assert.deepEqual(selectExerciseMaxPoints(history, '2', '3').map(p => p.id), ['1:10', '2:12']);
});

test('set history filters by exercise, day and rolling time range, newest first', async () => {
    const { selectExerciseHistory } = await import('../src/volumeTrends.js');
    const make = (id, date, day_id = 2, exercise = 3) => ({ id, date, day_id, exercise_sets: { [exercise]: [
        { id: id * 10 + 2, set_number: 2, weight: 100, reps: 6 },
        { id: id * 10 + 1, set_number: 1, weight: 110, reps: 5 }
    ] } });
    const history = [make(1, '2024-01-01T12:00:00Z'), make(2, '2026-08-01T12:00:00Z'),
        make(3, '2026-10-01T12:00:00Z'), make(4, '2026-10-02T12:00:00Z', 9), make(5, '2026-10-03T12:00:00Z', 2, 8)];
    const now = new Date('2026-10-14T12:00:00Z');
    assert.deepEqual(selectExerciseHistory(history, '2', '3', 'month', now).map(w => w.id), [3]);
    assert.deepEqual(selectExerciseHistory(history, '2', '3', 'year', now).map(w => w.id), [3, 2]);
    const all = selectExerciseHistory(history, '2', '3', 'all', now);
    assert.deepEqual(all.map(w => w.id), [3, 2, 1]);
    assert.deepEqual(all[0].sets.map(s => s.set_number), [1, 2]);
    assert.deepEqual(history[0].exercise_sets[3].map(s => s.set_number), [2, 1]);
});
test('past month clamps the cutoff at the previous month end', async () => {
    const { selectExerciseHistory } = await import('../src/volumeTrends.js');
    const history = [{ id: 1, day_id: 2, date: '2026-02-28T12:00:00Z', exercise_sets: { 3: [{ set_number: 1 }] } }];
    assert.equal(selectExerciseHistory(history, 2, 3, 'month', new Date('2026-03-31T12:00:00Z')).length, 1);
});
