import { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2, Search } from 'lucide-react';
import { api, type InventoryItem, type Product, type Store } from '@/lib/api';
import { useSocket } from '@/contexts/SocketContext';
import { DataTable } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
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

export default function Inventory() {
  const { lastUpdate } = useSocket();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    product: '',
    store: '',
    quantity: '',
    expiryDate: '',
  });

  const fetchAll = useCallback(async () => {
    const [inv, prod, st] = await Promise.all([
      api.get('/inventory', { params: { search: search || undefined } }),
      api.get('/products'),
      api.get('/stores'),
    ]);
    setItems(inv.data.data);
    setProducts(prod.data.data);
    setStores(st.data.data);
    setLoading(false);
  }, [search]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll, lastUpdate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/inventory', {
      product: form.product,
      store: form.store,
      quantity: parseInt(form.quantity, 10),
      expiryDate: form.expiryDate,
    });
    setOpen(false);
    setForm({ product: '', store: '', quantity: '', expiryDate: '' });
    fetchAll();
  };

  const statusBadge = (status?: string) => {
    if (status === 'critical') return <Badge variant="destructive">24h</Badge>;
    if (status === 'warning') return <Badge variant="warning">48h</Badge>;
    return <Badge variant="success">OK</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Inventory</h1>
          <p className="text-zinc-400">Track stock & expiry dates</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" />
              Add Inventory
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Inventory</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Product</Label>
                <Select value={form.product} onValueChange={(v) => setForm({ ...form, product: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p._id} value={p._id}>
                        {p.name}
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
                <Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Expiry Date</Label>
                <Input type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} required />
              </div>
              <Button type="submit" className="w-full">Add</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <Input className="pl-10" placeholder="Search inventory..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <DataTable
        loading={loading}
        data={items}
        columns={[
          { key: 'product', header: 'Product', render: (r) => r.product?.name },
          { key: 'store', header: 'Store', render: (r) => r.store?.name },
          { key: 'quantity', header: 'Qty' },
          { key: 'expiryDate', header: 'Expiry', render: (r) => formatDate(r.expiryDate) },
          { key: 'status', header: 'Status', render: (r) => statusBadge(r.expiryStatus) },
          {
            key: 'actions',
            header: '',
            render: (r) => (
              <Button
                variant="ghost"
                size="icon"
                onClick={async () => {
                  if (confirm('Remove this inventory record?')) {
                    await api.delete(`/inventory/${r._id}`);
                    fetchAll();
                  }
                }}
              >
                <Trash2 className="h-4 w-4 text-red-400" />
              </Button>
            ),
          },
        ]}
      />
    </div>
  );
}
