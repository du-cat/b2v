import { ReactNode } from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { cn } from '../../utils/cn';

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  change?: number;
  changeLabel?: string;
  trendUp?: boolean;
  inverseTrend?: boolean;
  loading?: boolean;
}

export function KpiCard({
  title,
  value,
  icon,
  change,
  changeLabel = 'from last period',
  trendUp,
  inverseTrend = false,
  loading = false,
}: KpiCardProps) {
  const renderTrend = () => {
    if (change === undefined) return null;
    
    const isPositive = change > 0;
    const isNegative = change < 0;
    const isNeutral = change === 0;
    
    // For inverse trends (e.g., for errors where down is good)
    const showPositiveStyle = inverseTrend ? !isPositive : isPositive;
    const showNegativeStyle = inverseTrend ? !isNegative : isNegative;
    
    let trendIcon;
    let trendColorClass;
    
    if (isNeutral) {
      trendIcon = <Minus className="h-3 w-3" />;
      trendColorClass = 'text-slate-500';
    } else if (isPositive) {
      trendIcon = <ArrowUp className="h-3 w-3" />;
      trendColorClass = showPositiveStyle ? 'text-green-600' : 'text-red-600';
    } else {
      trendIcon = <ArrowDown className="h-3 w-3" />;
      trendColorClass = showNegativeStyle ? 'text-red-600' : 'text-green-600';
    }
    
    return (
      <div className={cn('flex items-center text-xs font-medium', trendColorClass)}>
        <span className="mr-1">{trendIcon}</span>
        <span>{Math.abs(change)}%</span>
        <span className="ml-1 text-slate-500">{changeLabel}</span>
      </div>
    );
  };
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-slate-500">{title}</h3>
          <div className="text-slate-400">{icon}</div>
        </div>
        
        {loading ? (
          <div className="animate-pulse h-9 bg-slate-200 rounded mb-2"></div>
        ) : (
          <div className="text-3xl font-bold text-slate-900 mb-2">{value}</div>
        )}
        
        {loading ? (
          <div className="animate-pulse h-4 bg-slate-200 rounded w-24"></div>
        ) : (
          renderTrend()
        )}
      </CardContent>
    </Card>
  );
}