'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HelpCircle, ListChecks, Banknote, Landmark, History } from 'lucide-react';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';

const navItems = [
  { href: '/yes-no', label: 'Yes/No Decision', icon: HelpCircle },
  { href: '/multiple-choice', label: 'Multiple Choice', icon: ListChecks },
  { href: '/financial-analysis', label: 'Financial Analysis', icon: Banknote },
  { href: '/financial-spending', label: 'Financial Spending', icon: Landmark },
  { href: '/history', label: 'Decision History', icon: History },
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
