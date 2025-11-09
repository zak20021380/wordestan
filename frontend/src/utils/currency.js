export const formatToman = (value) => {
  if (value == null || value === '') {
    return '—';
  }

  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return '—';
  }

  const rounded = Math.round(numericValue);
  return `${rounded.toLocaleString('en-US')} تومان`;
};
