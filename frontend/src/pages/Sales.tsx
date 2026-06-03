import { useCallback, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { api, type Sale, type Product, type Store } from '@/lib/api';
import { useSocket } from '@/contexts/SocketContext';
import { DataTable } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function Sales() {
  const { lastUpdate } = useSocket();
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ product: '', store: '', quantity: '' });
  const [error, setError] = useState('');

  const fetchAll = useCallback(async () => {
    const [s, p, st] = await Promise.all([
      api.get('/sales'),
      api.get('/products'),
      api.get('/stores'),
    ]);
    setSales(s.data.data);
    setProducts(p.data.data);
    setStores(st.data.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll, lastUpdate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/sales', {
        product: form.product,
        store: form.store,
        quantity: parseInt(form.quantity, 10),
      });
      setOpen(false);
      setForm({ product: '', store: '', quantity: '' });
      fetchAll();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Sale failed';
      setError(msg);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Sales</h1>
          <p className="text-zinc-400">Record sales — inventory updates automatically</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" />
              Record Sale
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Sale</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <p className="text-sm text-red-400">{error}</p>}
              <div className="space-y-2">
                <Label>Product</Label>
                <Select value={form.product} onValueChange={(v) => setForm({ ...form, product: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p._id} value={p._id}>
                        {p.name} — {formatCurrency(p.price)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Store</Label>
                <Select value={form.store} onValueChange={(v) => setForm({ ...form, store: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select store" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map((s) => (
                      <SelectItem key={s._id} value={s._id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input type="number" min={1} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required />
              </div>
              <Button type="submit" className="w-full">Record Sale</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <DataTable
        loading={loading}
        data={sales}
        columns={[
          { key: 'product', header: 'Product', render: (r) => r.product?.name },
          { key: 'store', header: 'Store', render: (r) => r.store?.name },
          { key: 'quantity', header: 'Qty' },
          { key: 'totalAmount', header: 'Total', render: (r) => formatCurrency(r.totalAmount) },
          { key: 'createdAt', header: 'Date', render: (r) => formatDate(r.createdAt) },
        ]}
      />
    </div>
  );
}
