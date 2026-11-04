import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, Sun } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/button';

export default function Layout() {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar open={open} onClose={() => setOpen(false)} />

      <div className="lg:ms-64">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-card/85 px-4 py-3 backdrop-blur lg:hidden">
          <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="פתח תפריט">
            <Menu className="h-5 w-5" />
          </Button>
          <span className="flex items-center gap-2 font-heading text-lg text-brand-deep">
            <Sun className="h-4 w-4 text-brand-yellow" />
            GoodKid Zone
          </span>
        </header>

        <main className="mx-auto max-w-7xl p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}