import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildDraftPayload,
  normalizeExtracted,
  normalizeTextList,
} from './aiReview.js';

test('normalizeTextList trims, splits, and removes duplicate list values', () => {
  assert.deepEqual(
    normalizeTextList([' Nyonya ', 'Laksa, Cendol', 'Laksa', '']),
    ['Nyonya', 'Laksa', 'Cendol'],
  );
});

test('normalizeExtracted keeps editable vendor fields in the review contract', () => {
  assert.deepEqual(
    normalizeExtracted(
      {
        vendor_name: 'Old Name',
        address: 'Old Address',
        city: 'Melaka',
        state: 'Melaka',
        cuisine_types: ['Nyonya'],
        signature_dishes: ['Laksa'],
      },
      {
        vendor_name: 'Reviewed Name',
        price_range: 'RM10-RM20',
        cuisine_types: 'Nyonya, Peranakan',
      },
    ),
    {
      vendor_name: 'Reviewed Name',
      address: 'Old Address',
      city: 'Melaka',
      state: 'Melaka',
      cuisine_types: ['Nyonya', 'Peranakan'],
      signature_dishes: ['Laksa'],
      price_range: 'RM10-RM20',
    },
  );
});

test('buildDraftPayload includes the reviewed summary and extracted fields', () => {
  assert.deepEqual(
    buildDraftPayload(
      'job-123',
      'Reviewed summary',
      { vendor_name: 'Vendor', city: 'Melaka' },
      { address: 'Jonker Street', signature_dishes: 'Chicken rice, Cendol' },
    ),
    {
      job_id: 'job-123',
      summary: 'Reviewed summary',
      extracted: {
        vendor_name: 'Vendor',
        city: 'Melaka',
        address: 'Jonker Street',
        signature_dishes: ['Chicken rice', 'Cendol'],
      },
    },
  );
});
