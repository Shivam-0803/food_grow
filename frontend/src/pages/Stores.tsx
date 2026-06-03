import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { api, type Store } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import { DataTable } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function Stores() {
  const { isAdmin } = useAuth();
  const { lastUpdate } = useSocket();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Store | null>(null);
  const [form, setForm] = useState({ name: '', address: '', contactNumber: '' });

  const fetchStores = useCallback(async () => {
    const { data } = await api.get('/stores', { params: { search: search || undefined } });
    setStores(data.data);
    setLoading(false);
  }, [search]);

  useEffect(() => {
    fetchStores();
  }, [fetchStores, lastUpdate]);

  const resetForm = () => {
    setForm({ name: '', address: '', contactNumber: '' });
    setEditing(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      await api.put(`/stores/${editing._id}`, form);
    } else {
      await api.post('/stores', form);
    }
    setOpen(false);
    resetForm();
    fetchStores();
  };

  const handleEdit = (store: Store) => {
    setEditing(store);
    setForm({
      name: store.name,
      address: store.address,
      contactNumber: store.contactNumber,
    });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deactivate this store?')) return;
    await api.delete(`/stores/${id}`);
    fetchStores();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Stores</h1>
          <p className="text-zinc-400">Manage retail locations</p>
        </div>
        {isAdmin && (
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setOpen(true); }}>
                <Plus className="h-4 w-4" />
                Add Store
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? 'Edit Store' : 'Add Store'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Contact Number</Label>
                  <Input value={form.contactNumber} onChange={(e) => setForm({ ...form, contactNumber: e.target.value })} required />
                </div>
                <Button type="submit" className="w-full">
                  {editing ? 'Update' : 'Create'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <Input
          className="pl-10"
          placeholder="Search stores..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <DataTable
        loading={loading}
        data={stores}
        columns={[
          { key: 'name', header: 'Name' },
          { key: 'address', header: 'Address' },
          { key: 'contactNumber', header: 'Contact' },
          ...(isAdmin
            ? [
                {
                  key: 'actions',
                  header: 'Actions',
                  render: (row: Store) => (
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(row)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(row._id)}>
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
