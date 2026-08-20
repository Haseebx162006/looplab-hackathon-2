export interface NavItem {
  id: string;
  label: string;
  href: string;
  isActive?: boolean;
}

export interface StudentDataPoint {
  month: string;
  value: number;
}

export interface CourseOffering {
  id: string;
  title: string;
  active?: boolean;
}

export interface TopicTag {
  id: string;
  label: string;
  angle?: number;
}
