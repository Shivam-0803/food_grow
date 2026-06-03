import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Store, Package, Boxes, AlertTriangle, ArrowLeftRight } from 'lucide-react';
import { api } from '@/lib/api';
import { useSocket } from '@/contexts/SocketContext';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { DashboardCharts } from '@/components/dashboard/Charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';

type Stats = {
  totalStores: number;
  totalProducts: number;
  totalInventory: number;
  nearExpiry: number;
  transferRecommendations: number;
  expiryAlerts: {
    within24h: Array<{ product: { name: string }; store: { name: string }; expiryDate: string }>;
    within48h: Array<{ product: { name: string }; store: { name: string }; expiryDate: string }>;
  };
};

type Analytics = {
  salesTrends: { date: string; revenue: number; units: number }[];
  inventoryDistribution: { category: string; quantity: number }[];
  storePerformance: { store: string; revenue: number; units: number }[];
};

export default function Dashboard() {
  const { lastUpdate } = useSocket();
  const [stats, setStats] = useState<Stats | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, analyticsRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/analytics'),
      ]);
      setStats(statsRes.data.data);
      setAnalytics(analyticsRes.data.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData, lastUpdate]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-72" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
          <p className="mt-1 text-zinc-400">Real-time inventory & transfer intelligence</p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/recommendations">
            <ArrowLeftRight className="h-4 w-4" />
            View recommendations ({stats?.transferRecommendations ?? 0})
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard title="Total Stores" value={stats?.totalStores ?? 0} icon={Store} accent="blue" index={0} />
        <KpiCard title="Products" value={stats?.totalProducts ?? 0} icon={Package} accent="purple" index={1} />
        <KpiCard
          title="Total Inventory"
          value={stats?.totalInventory?.toLocaleString() ?? 0}
          icon={Boxes}
          accent="emerald"
          index={2}
        />
        <KpiCard
          title="Near Expiry"
          value={stats?.nearExpiry ?? 0}
          subtitle="Within 48 hours"
          icon={AlertTriangle}
          accent="amber"
          index={3}
        />
        <KpiCard
          title="Transfers"
          value={stats?.transferRecommendations ?? 0}
          subtitle="Pending recommendations"
          icon={ArrowLeftRight}
          accent="rose"
          index={4}
        />
      </div>

      {(stats?.expiryAlerts?.within24h?.length ?? 0) > 0 && (
        <Card className="border-red-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-300">
              <AlertTriangle className="h-5 w-5" />
              Critical — Expiring within 24 hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {stats?.expiryAlerts.within24h.map((item, i) => (
                <Badge key={i} variant="destructive">
                  {item.product.name} @ {item.store.name} — {formatDate(item.expiryDate)}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {analytics && (
        <DashboardCharts
          salesTrends={analytics.salesTrends}
          inventoryDistribution={analytics.inventoryDistribution}
          storePerformance={analytics.storePerformance}
        />
      )}
    </div>
  );
}
