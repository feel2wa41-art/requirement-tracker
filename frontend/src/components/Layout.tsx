import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from './Sidebar';
import LanguageSwitcher from './LanguageSwitcher';
import { Menu, X } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentPath: string;
  onNavigate: (path: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentPath, onNavigate }) => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (!user) {
    return <div>{children}</div>;
  }

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleNavigate = (path: string) => {
    onNavigate(path);
    setIsSidebarOpen(false); // 모바일에서 네비게이션 후 사이드바 닫기
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* 모바일 오버레이 */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* 사이드바 */}
      <div
        className={`fixed inset-y-0 left-0 z-30 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar
          currentPath={currentPath}
          onNavigate={handleNavigate}
          onLogout={logout}
          user={user}
        />
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 헤더 */}
        <header className="bg-white shadow-sm border-b border-gray-200 lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              {isSidebarOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
            <h1 className="text-lg font-semibold text-gray-900">
              {t('common.requirementTracker', '요구사항 추적 시스템')}
            </h1>
            <LanguageSwitcher />
          </div>
        </header>

        {/* 페이지 제목 (데스크톱) */}
        <div className="hidden lg:flex bg-white border-b border-gray-200 px-6 py-4 justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">
            {getPageTitle(currentPath, t)}
          </h1>
          <LanguageSwitcher />
        </div>

        {/* 메인 콘텐츠 영역 */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

const getPageTitle = (path: string, t: any): string => {
  const titles: { [key: string]: string } = {
    '/dashboard': t('navigation.dashboard'),
    '/projects': t('navigation.projects'),
    '/reports': t('report.title'),
    '/admin/access': t('admin.accessControl'),
    '/admin/settings': t('admin.systemSettings')
  };
  
  return titles[path] || t('common.requirementTracker', '요구사항 추적 시스템');
};

export default Layout;