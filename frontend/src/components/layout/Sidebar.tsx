import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Store,
  Package,
  Boxes,
  ShoppingCart,
  ArrowLeftRight,
  Settings,
  UtensilsCrossed,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const links = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/stores', icon: Store, label: 'Stores', adminOnly: true },
  { to: '/products', icon: Package, label: 'Products', adminOnly: true },
  { to: '/inventory', icon: Boxes, label: 'Inventory' },
  { to: '/sales', icon: ShoppingCart, label: 'Sales' },
  { to: '/recommendations', icon: ArrowLeftRight, label: 'Recommendations' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { isAdmin } = useAuth();

  return (
    <aside className="flex h-full w-64 flex-col border-r border-white/10 bg-black/20 p-4">
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 shadow-lg shadow-purple-500/30">
          <UtensilsCrossed className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-lg font-bold tracking-tight text-white">FoodFlow</p>
          <p className="text-xs text-zinc-500">Inventory Intelligence</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {links
          .filter((l) => !l.adminOnly || isAdmin)
          .map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive ? 'text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute inset-0 rounded-lg bg-white/10"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                    />
                  )}
                  <link.icon className="relative z-10 h-4 w-4" />
                  <span className="relative z-10">{link.label}</span>
                </>
              )}
            </NavLink>
          ))}
      </nav>
    </aside>
  );
}
