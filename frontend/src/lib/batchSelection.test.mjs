import test from 'node:test';
import assert from 'node:assert/strict';
import {
  toggleSelection,
  togglePageSelection,
  getSelectionSummary,
} from './batchSelection.js';

test('toggleSelection adds and removes one record without mutating the set', () => {
  const selected = new Set(['a']);
  const added = toggleSelection(selected, 'b', true);
  const removed = toggleSelection(added, 'a', false);

  assert.deepEqual([...selected], ['a']);
  assert.deepEqual([...added], ['a', 'b']);
  assert.deepEqual([...removed], ['b']);
});

test('togglePageSelection selects only the visible page records', () => {
  const selected = new Set(['outside']);
  const next = togglePageSelection(selected, ['a', 'b', 'c'], true);
  const cleared = togglePageSelection(next, ['a', 'b', 'c'], false);

  assert.deepEqual([...next], ['outside', 'a', 'b', 'c']);
  assert.deepEqual([...cleared], ['outside']);
});

test('getSelectionSummary reports selected count and page checkbox state', () => {
  const summary = getSelectionSummary(new Set(['a', 'b']), ['a', 'b', 'c']);

  assert.deepEqual(summary, {
    selectedCount: 2,
    selectedOnPage: 2,
    pageCount: 3,
    allOnPageSelected: false,
    someOnPageSelected: true,
  });
});
