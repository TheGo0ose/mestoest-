export type DailyStats = {
  date: string; // ISO '2026-10-26'
  label: string; // '26 окт'
  fullLabel: string; // 'Понедельник, 26 октября'
  confirmed: number;
  cancelled: number;
  total: number;
  covers: number;
};

export type SourceStats = {
  source: 'WEB' | 'TELEGRAM';
  percent: number;
  total: number;
  confirmed: number;
  cancelled: number;
  covers: number;
};

export type PlatformStats = {
  periodLabel: string;
  totalBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  covers: number;
  cancellationRate: string;
  days: DailyStats[];
  sources: SourceStats[];
};

export function getPlatformStats(restaurantId?: string): PlatformStats {
  void restaurantId; // В моке для демонстрации возвращаем эталонные данные периода S1

  const days: DailyStats[] = [
    {
      date: '2026-10-26',
      label: '26 окт',
      fullLabel: 'Понедельник, 26 октября',
      confirmed: 10,
      cancelled: 2,
      total: 12,
      covers: 20,
    },
    {
      date: '2026-10-27',
      label: '27 окт',
      fullLabel: 'Вторник, 27 октября',
      confirmed: 14,
      cancelled: 2,
      total: 16,
      covers: 28,
    },
    {
      date: '2026-10-28',
      label: '28 окт',
      fullLabel: 'Среда, 28 октября',
      confirmed: 12,
      cancelled: 2,
      total: 14,
      covers: 24,
    },
    {
      date: '2026-10-29',
      label: '29 окт',
      fullLabel: 'Четверг, 29 октября',
      confirmed: 15,
      cancelled: 3,
      total: 18,
      covers: 30,
    },
    {
      date: '2026-10-30',
      label: '30 окт',
      fullLabel: 'Пятница, 30 октября',
      confirmed: 17,
      cancelled: 3,
      total: 20,
      covers: 34,
    },
    {
      date: '2026-10-31',
      label: '31 окт',
      fullLabel: 'Суббота, 31 октября',
      confirmed: 20,
      cancelled: 4,
      total: 24,
      covers: 40,
    },
    {
      date: '2026-11-01',
      label: '1 ноя',
      fullLabel: 'Воскресенье, 1 ноября',
      confirmed: 14,
      cancelled: 2,
      total: 16,
      covers: 28,
    },
  ];

  const sources: SourceStats[] = [
    {
      source: 'WEB',
      percent: 60,
      total: 72,
      confirmed: 60,
      cancelled: 12,
      covers: 120,
    },
    {
      source: 'TELEGRAM',
      percent: 40,
      total: 48,
      confirmed: 42,
      cancelled: 6,
      covers: 84,
    },
  ];

  return {
    periodLabel: '26 окт — 1 ноя 2026',
    totalBookings: 120,
    confirmedBookings: 102,
    cancelledBookings: 18,
    covers: 204,
    cancellationRate: '15,0',
    days,
    sources,
  };
}
