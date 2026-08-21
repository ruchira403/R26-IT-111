/** Shared formatting helpers for the on-screen and printable assessment reports. */

export const formatDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
};

/** Convert raw enum-like values to readable text */
export const humanize = (val) => {
  if (!val || val === '—') return '—';
  return val
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

/** Convert booleans to Yes/No */
export const yesNo = (val) => (val ? 'Yes' : 'No');
