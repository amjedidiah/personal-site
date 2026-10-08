const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

export function formatProjectMonthStart(month: number) {
  const index = Math.min(12, Math.max(1, month)) - 1;
  return monthLabels[index];
}
