import { test } from 'node:test';
import assert from 'node:assert/strict';
import { collectCompletedSets } from '../src/workoutSets.js';
const exercises = [{ id: 1, target_sets: 3 }, { id: 2, target_sets: 2 }];
test('only completed visible sets are submitted, including zero weight', () => {
    const data = { 1: {
        1: { weight: '0', reps: '12' },
        2: { weight: '100', reps: '' },
        3: { weight: '100', reps: '8' }
    }, 2: { 1: { weight: '50' } }, 99: { 1: { weight: '40', reps: '4' } } };
    assert.deepEqual(collectCompletedSets(exercises, data, { 1: 2 }), [
        { exercise_id: 1, set_number: 1, weight: 0, reps: 12 }
    ]);
});
test('blank and invalid sets never create a completed session', () => {
    for (const values of [{}, { weight: ' ', reps: '4' }, { weight: '100', reps: '0' },
        { weight: '-1', reps: '4' }, { weight: '100', reps: '1.5' }, { weight: 'NaN', reps: '4' }]) {
        assert.deepEqual(collectCompletedSets(exercises, { 1: { 1: values } }, {}), []);
    }
});
