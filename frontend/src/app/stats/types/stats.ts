export interface StatMetric {
  id: string;
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  change: string;
  description: string;
}
