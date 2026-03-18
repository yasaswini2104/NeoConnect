import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  return format(new Date(date), 'MMM d, yyyy');
}

export function formatRelative(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export const CATEGORIES = ['Safety', 'Policy', 'Facilities', 'HR', 'Other'];

export const DEPARTMENTS = [
  'Engineering', 'Human Resources', 'Finance', 'Marketing',
  'Operations', 'Legal', 'IT', 'Sales', 'Admin', 'Security', 'Other'
];

export const SEVERITIES = ['Low', 'Medium', 'High'];
export const STATUSES = ['New', 'Assigned', 'In Progress', 'Pending', 'Resolved', 'Escalated'];