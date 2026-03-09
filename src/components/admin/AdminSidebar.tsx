import { LayoutDashboard, Package, ShoppingBag, MessageSquare, Users, Settings, LogOut, Store, Plug, Home, Heart, Mail, Trash2 } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';

const menuItems = [
  { title: 'Dashboard', key: 'dashboard', icon: LayoutDashboard },
  { title: 'Homepage', key: 'homepage', icon: Home },
  { title: 'Products', key: 'products', icon: Package },
  { title: 'Orders', key: 'orders', icon: ShoppingBag },
  { title: 'Reviews', key: 'reviews', icon: MessageSquare },
  { title: 'Wishlist', key: 'wishlist', icon: Heart },
  { title: 'Newsletter', key: 'newsletter', icon: Mail },
  { title: 'Users', key: 'users', icon: Users },
  { title: 'API', key: 'api', icon: Plug },
  { title: 'Settings', key: 'settings', icon: Settings },
];

type Props = {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onSignOut: () => void;
};

const AdminSidebar = ({ activeTab, onTabChange, onSignOut }: Props) => {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            <Store className="mr-2 h-4 w-4" />
            {!collapsed && 'Admin Panel'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton
                    onClick={() => onTabChange(item.key)}
                    isActive={activeTab === item.key}
                    tooltip={item.title}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={onSignOut} tooltip="Sign Out">
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AdminSidebar;
