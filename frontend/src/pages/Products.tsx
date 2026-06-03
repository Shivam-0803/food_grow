import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { api, type Product } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import { DataTable } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function Products() {
  const { isAdmin } = useAuth();
  const { lastUpdate } = useSocket();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({ name: '', category: '', price: '', shelfLife: '' });

  const fetchProducts = useCallback(async () => {
    const { data } = await api.get('/products', { params: { search: search || undefined } });
    setProducts(data.data);
    setLoading(false);
  }, [search]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts, lastUpdate]);

  const resetForm = () => {
    setForm({ name: '', category: '', price: '', shelfLife: '' });
    setEditing(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      category: form.category,
      price: parseFloat(form.price),
      shelfLife: parseInt(form.shelfLife, 10),
    };
    if (editing) await api.put(`/products/${editing._id}`, payload);
    else await api.post('/products', payload);
    setOpen(false);
    resetForm();
    fetchProducts();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Products</h1>
          <p className="text-zinc-400">Product catalog & shelf life</p>
        </div>
        {isAdmin && (
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setOpen(true); }}>
                <Plus className="h-4 w-4" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? 'Edit Product' : 'Add Product'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Price</Label>
                  <Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Shelf Life (days)</Label>
                  <Input type="number" value={form.shelfLife} onChange={(e) => setForm({ ...form, shelfLife: e.target.value })} required />
                </div>
                <Button type="submit" className="w-full">{editing ? 'Update' : 'Create'}</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <Input className="pl-10" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <DataTable
        loading={loading}
        data={products}
        columns={[
          { key: 'name', header: 'Product' },
          { key: 'category', header: 'Category' },
          { key: 'price', header: 'Price', render: (r) => formatCurrency(r.price) },
          { key: 'shelfLife', header: 'Shelf Life', render: (r) => `${r.shelfLife} days` },
          ...(isAdmin
            ? [
                {
                  key: 'actions',
                  header: 'Actions',
                  render: (row: Product) => (
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditing(row);
                          setForm({
                            name: row.name,
                            category: row.category,
                            price: String(row.price),
                            shelfLife: String(row.shelfLife),
                          });
                          setOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={async () => {
                          if (confirm('Deactivate product?')) {
                            await api.delete(`/products/${row._id}`);
                            fetchProducts();
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </Button>
                    </div>
                  ),
                },
              ]
            : []),
        ]}
      />
    </div>
  );
}
