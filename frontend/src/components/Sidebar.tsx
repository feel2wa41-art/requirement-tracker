import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  ChevronDown, 
  ChevronRight, 
  Home, 
  FolderOpen, 
  FileText, 
  Users, 
  Settings, 
  BarChart3,
  Shield,
  LogOut
} from 'lucide-react';

interface MenuItem {
  id: string;
  labelKey: string;
  icon: React.ComponentType<any>;
  children?: MenuItem[];
  path?: string;
}

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
  user: {
    name: string;
    role: string;
  };
}

const getMenuItems = (t: any): MenuItem[] => [
  {
    id: 'dashboard',
    labelKey: 'navigation.dashboard',
    icon: Home,
    path: '/dashboard'
  },
  {
    id: 'projects',
    labelKey: 'navigation.projects',
    icon: FolderOpen,
    path: '/projects'
  },
  {
    id: 'reports',
    labelKey: 'navigation.projectReports',
    icon: BarChart3,
    path: '/reports'
  },
  {
    id: 'admin',
    labelKey: 'navigation.adminMenu',
    icon: Shield,
    children: [
      {
        id: 'access-control',
        labelKey: 'navigation.userPermissionManagement',
        icon: Shield,
        path: '/admin/access'
      },
      {
        id: 'system-settings',
        labelKey: 'admin.systemSettings',
        icon: Settings,
        path: '/admin/settings'
      }
    ]
  }
];

const Sidebar: React.FC<SidebarProps> = ({ currentPath, onNavigate, onLogout, user }) => {
  const { t } = useTranslation();
  const [expandedItems, setExpandedItems] = useState<string[]>(['projects', 'reports']);
  
  const menuItems = getMenuItems(t);

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const isExpanded = expandedItems.includes(item.id);
    const isActive = currentPath === item.path;
    const hasChildren = item.children && item.children.length > 0;

    // 관리자 메뉴는 admin 역할만 표시
    if (item.id === 'admin' && user.role !== 'admin') {
      return null;
    }

    const handleClick = () => {
      if (hasChildren) {
        toggleExpanded(item.id);
      } else if (item.path) {
        onNavigate(item.path);
      }
    };

    return (
      <div key={item.id}>
        <button
          onClick={handleClick}
          className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors duration-150 ${
            level === 0 ? 'text-sm font-medium' : 'text-sm pl-8'
          } ${
            isActive 
              ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-600' 
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <div className="flex items-center">
            <item.icon className={`mr-3 h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
            <span>{t(item.labelKey)}</span>
          </div>
          {hasChildren && (
            isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-400" />
            )
          )}
        </button>
        
        {hasChildren && isExpanded && (
          <div className="bg-gray-50">
            {item.children?.map(child => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-64 bg-white shadow-lg h-screen flex flex-col">
      {/* 사용자 정보 */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-medium text-sm">
              {user.name.charAt(0)}
            </span>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">{user.name}</p>
            <p className="text-xs text-gray-500">
              {t(`user.${user.role}`)}
            </p>
          </div>
        </div>
      </div>

      {/* 메뉴 항목들 */}
      <nav className="flex-1 overflow-y-auto">
        <div className="py-4">
          {menuItems.map(item => renderMenuItem(item))}
        </div>
      </nav>

      {/* 로그아웃 버튼 */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={onLogout}
          className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors duration-150"
        >
          <LogOut className="mr-3 h-5 w-5 text-gray-400" />
          {t('auth.logout')}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;