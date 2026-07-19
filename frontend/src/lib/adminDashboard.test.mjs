import test from 'node:test';
import assert from 'node:assert/strict';

import { formatMetricDelta, normalizeDashboardPayload } from './adminDashboard.js';

test('normalizeDashboardPayload keeps legacy data and supplies chart sections', () => {
  const result = normalizeDashboardPayload({
    stats: [{ label: 'Total Vendors', value: 12 }],
    recentVendors: [{ id: 'vendor-1' }],
  });

  assert.deepEqual(result.stats, [{ label: 'Total Vendors', value: 12 }]);
  assert.deepEqual(result.recentVendors, [{ id: 'vendor-1' }]);
  assert.deepEqual(result.categoryBreakdown, []);
  assert.deepEqual(result.attentionItems, []);
});

test('formatMetricDelta returns a readable signed change and semantic tone', () => {
  assert.deepEqual(formatMetricDelta(120, 100), { label: '+20%', tone: 'positive' });
  assert.deepEqual(formatMetricDelta(80, 100), { label: '-20%', tone: 'negative' });
  assert.deepEqual(formatMetricDelta(0, 0), { label: '—', tone: 'neutral' });
});
