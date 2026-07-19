const REVIEW_FIELDS = [
  'vendor_name',
  'address',
  'city',
  'state',
  'country',
  'price_range',
  'operating_hours_raw',
  'special_notes',
  'cuisine_types',
  'signature_dishes',
];

export function normalizeTextList(value) {
  const values = (Array.isArray(value) ? value : [value]).flatMap((item) => String(item ?? '').split(/[\n,]/));
  return [...new Set(values.map((item) => String(item ?? '').trim()).filter(Boolean))];
}

export function normalizeExtracted(extracted = {}, overrides = {}) {
  const source = { ...extracted, ...overrides };
  const normalized = {};

  REVIEW_FIELDS.forEach((field) => {
    if (source[field] === undefined || source[field] === null) return;
    normalized[field] = ['cuisine_types', 'signature_dishes'].includes(field)
      ? normalizeTextList(source[field])
      : String(source[field]).trim();
  });

  return normalized;
}

export function buildDraftPayload(jobId, summary, extracted, overrides = {}) {
  return {
    job_id: jobId,
    summary: String(summary ?? '').trim(),
    extracted: normalizeExtracted(extracted, overrides),
  };
}
