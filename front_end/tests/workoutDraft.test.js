import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyWorkoutDraft, readWorkoutDraft, workoutDraftKey } from '../src/workoutDraft.js';
const token = sub => `header.${btoa(JSON.stringify({ sub }))}.signature`;
test('drafts are isolated by user and training day, without storing tokens in keys', () => {
    const key = workoutDraftKey(token('1'), 2, 3);
    assert.notEqual(key, workoutDraftKey(token('2'), 2, 3));
    assert.notEqual(key, workoutDraftKey(token('1'), 2, 4));
    assert.equal(key, workoutDraftKey(token('1'), 2, 3));
    assert.equal(workoutDraftKey('invalid', 2, 3), null);
    assert.ok(!key.includes('signature'));
});
test('reload restores partial entries, zero weight, extra set rows and exercise fields', () => {
    const draft = { setData: { 9: { 1: { weight: '0', reps: '' }, 3: { weight: '150', reps: '8' } } },
        setCounts: { 9: 3 }, newExerciseName: 'Bench', targetSets: 2 };
    const storage = { getItem: () => JSON.stringify(draft) };
    assert.deepEqual(readWorkoutDraft(storage, 'key'), draft);
});
test('missing, malformed and unavailable storage fall back to a blank workout', () => {
    for (const value of [null, 'broken json', 'null']) {
        assert.deepEqual(readWorkoutDraft({ getItem: () => value }, 'key'), emptyWorkoutDraft());
    }
    assert.deepEqual(readWorkoutDraft({ getItem: () => { throw new Error('blocked'); } }, 'key'), emptyWorkoutDraft());
});
