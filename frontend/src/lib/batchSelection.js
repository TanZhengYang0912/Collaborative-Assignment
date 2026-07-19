export function toggleSelection(selectedIds, id, checked) {
  const next = new Set(selectedIds);
  if (checked) next.add(id);
  else next.delete(id);
  return next;
}

export function togglePageSelection(selectedIds, pageIds, checked) {
  const next = new Set(selectedIds);
  pageIds.forEach((id) => {
    if (checked) next.add(id);
    else next.delete(id);
  });
  return next;
}

export function getSelectionSummary(selectedIds, pageIds) {
  const selectedOnPage = pageIds.reduce((count, id) => count + (selectedIds.has(id) ? 1 : 0), 0);
  return {
    selectedCount: selectedIds.size,
    selectedOnPage,
    pageCount: pageIds.length,
    allOnPageSelected: pageIds.length > 0 && selectedOnPage === pageIds.length,
    someOnPageSelected: selectedOnPage > 0 && selectedOnPage < pageIds.length,
  };
}
