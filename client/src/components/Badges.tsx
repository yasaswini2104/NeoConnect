import { Badge } from '@/components/ui/badge';

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'> = {
  'New':         'secondary',
  'Assigned':    'default',
  'In Progress': 'default',
  'Pending':     'warning',
  'Resolved':    'success',
  'Escalated':   'destructive',
};

const SEVERITY_VARIANT: Record<string, 'success' | 'warning' | 'destructive'> = {
  'Low':    'success',
  'Medium': 'warning',
  'High':   'destructive',
};

export function StatusBadge({ status }: { status: string }) {
  return <Badge variant={STATUS_VARIANT[status] || 'secondary'}>{status}</Badge>;
}

export function SeverityBadge({ severity }: { severity: string }) {
  return <Badge variant={SEVERITY_VARIANT[severity] || 'secondary'}>{severity}</Badge>;
}
