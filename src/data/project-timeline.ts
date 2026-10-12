const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

// Calendar dates stay strings so formatting cannot shift the commit's day by timezone.
export function formatProjectDate(date: string) {
  const [year, month] = date.split('-').map(Number);
  return `${monthLabels[month - 1]} ${year}`;
}
