import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Check, X } from 'lucide-react';
import { api, type Recommendation } from '@/lib/api';
import { useSocket } from '@/contexts/SocketContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function Recommendations() {
  const { lastUpdate } = useSocket();
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRecs = useCallback(async () => {
    const { data } = await api.get('/recommendations', { params: { status: 'pending' } });
    setRecs(data.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRecs();
  }, [fetchRecs, lastUpdate]);

  const handleRefresh = async () => {
    setRefreshing(true);
    const { data } = await api.post('/recommendations/refresh');
    setRecs(data.data);
    setRefreshing(false);
  };

  const updateStatus = async (id: string, status: 'accepted' | 'dismissed') => {
    await api.patch(`/recommendations/${id}`, { status });
    fetchRecs();
  };

  const priorityVariant = (p: string) => {
    if (p === 'high') return 'destructive' as const;
    if (p === 'medium') return 'warning' as const;
    return 'secondary' as const;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Transfer Recommendations</h1>
          <p className="text-zinc-400">Move stock from slow stores to high-demand locations</p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : recs.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/10 py-16 text-center text-zinc-500">
          No pending recommendations. Add inventory and sales data, then refresh.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {recs.map((rec, i) => (
            <motion.div
              key={rec._id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{rec.product?.name}</CardTitle>
                    <p className="mt-1 text-sm text-zinc-400">
                      {rec.fromStore?.name} → {rec.toStore?.name}
                    </p>
                  </div>
                  <Badge variant={priorityVariant(rec.priority)}>{rec.priority}</Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-zinc-300">{rec.reason}</p>
                  <p className="text-sm font-medium text-purple-300">
                    Suggested qty: {rec.suggestedQuantity} units
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => updateStatus(rec._id, 'accepted')}>
                      <Check className="h-4 w-4" />
                      Accept Transfer
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => updateStatus(rec._id, 'dismissed')}>
                      <X className="h-4 w-4" />
                      Dismiss
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
