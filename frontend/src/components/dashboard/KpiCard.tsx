import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type KpiCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: string;
  accent?: 'purple' | 'blue' | 'amber' | 'emerald' | 'rose';
  index?: number;
};

const accents = {
  purple: 'from-purple-500/20 to-violet-600/5 text-purple-400',
  blue: 'from-blue-500/20 to-cyan-600/5 text-blue-400',
  amber: 'from-amber-500/20 to-orange-600/5 text-amber-400',
  emerald: 'from-emerald-500/20 to-green-600/5 text-emerald-400',
  rose: 'from-rose-500/20 to-pink-600/5 text-rose-400',
};

export function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  accent = 'purple',
  index = 0,
}: KpiCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
    >
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-zinc-400">{title}</p>
              <motion.p
                className="mt-2 text-3xl font-bold tracking-tight text-white"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
              >
                {value}
              </motion.p>
              {subtitle && <p className="mt-1 text-xs text-zinc-500">{subtitle}</p>}
              {trend && <p className="mt-2 text-xs text-emerald-400">{trend}</p>}
            </div>
            <div
              className={cn(
                'rounded-xl bg-gradient-to-br p-3',
                accents[accent]
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
