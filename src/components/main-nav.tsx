'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, HelpCircle, ListChecks, Banknote, Landmark, History } from 'lucide-react';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/yes-no', label: 'Decisão Sim/Não', icon: HelpCircle },
  { href: '/multiple-choice', label: 'Múltipla Escolha', icon: ListChecks },
  { href: '/financial-analysis', label: 'Análise Financeira', icon: Banknote },
  { href: '/financial-spending', label: 'Gasto Financeiro', icon: Landmark },
  { href: '/history', label: 'Histórico de Decisões', icon: History },
];

export function MainNav() {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {navItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <SidebarMenuButton
            asChild
            isActive={pathname === item.href}
            tooltip={{ children: item.label, side: 'right', align: 'center' }}
          >
            <Link href={item.href}>
              <item.icon />
              <span>{item.label}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
