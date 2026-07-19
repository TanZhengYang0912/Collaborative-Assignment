export function paginate(items, requestedPage, pageSize = 12) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, requestedPage), totalPages);
  const start = (page - 1) * pageSize;

  return {
    page,
    totalPages,
    total,
    items: items.slice(start, start + pageSize),
  };
}

export function pageNumbers(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
  const sortedPages = [...pages]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);

  return sortedPages.reduce((result, page, index) => {
    const previous = sortedPages[index - 1];
    if (index > 0 && page - previous > 1) result.push("ellipsis");
    result.push(page);
    return result;
  }, []);
}
