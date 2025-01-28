export interface DateBin {
  label: string;
  items: any[];
}

export function binByDate(items: any[], getDate: (item: any) => Date): DateBin[] {
  if (items.length === 0) return [];

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);
  const lastMonth = new Date(today);
  lastMonth.setMonth(lastMonth.getMonth() - 1);

  const bins: { [key: string]: any[] } = {
    Today: [],
    Yesterday: [],
    'Last 7 Days': [],
    'Last 30 Days': [],
    Older: [],
  };

  items.forEach((item) => {
    const date = getDate(item);
    const startOfDay = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );

    if (startOfDay.getTime() === today.getTime()) {
      bins['Today'].push(item);
    } else if (startOfDay.getTime() === yesterday.getTime()) {
      bins['Yesterday'].push(item);
    } else if (date >= lastWeek) {
      bins['Last 7 Days'].push(item);
    } else if (date >= lastMonth) {
      bins['Last 30 Days'].push(item);
    } else {
      bins['Older'].push(item);
    }
  });

  return Object.entries(bins)
    .filter(([_, items]) => items.length > 0)
    .map(([label, items]) => ({ label, items }));
}
