import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginForm from './components/LoginForm';
import Layout from './components/Layout';
import ProjectManagementPage from './pages/ProjectManagementPage';
import AccessControlPage from './pages/AccessControlPage';
import ReportPage from './pages/ReportPage';

const AppContent: React.FC = () => {
  const { user, isLoading, isAuthenticated, login } = useAuth();
  const [currentPath, setCurrentPath] = useState('/dashboard');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm onLogin={login} />;
  }

  const handleNavigate = (path: string) => {
    setCurrentPath(path);
  };

  const renderCurrentPage = () => {
    switch (currentPath) {
      case '/dashboard':
        return <DashboardPage />;
      case '/projects':
      case '/projects/create':
        return <ProjectManagementPage user={user!} />;
      case '/reports/requirements':
      case '/reports/status':
      case '/reports/export':
        return <ReportPage />;
      case '/admin/users':
        return <UserManagementPage />;
      case '/admin/access':
        return <AccessControlPage />;
      case '/admin/settings':
        return <SystemSettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <Layout currentPath={currentPath} onNavigate={handleNavigate}>
      {renderCurrentPage()}
    </Layout>
  );
};

// 대시보드 페이지
const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">대시보드</h2>
        <p className="text-gray-600">안녕하세요, {user?.name}님! 프로젝트 현황을 확인하세요.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-md">
              <div className="w-6 h-6 bg-blue-600 rounded"></div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">총 프로젝트</p>
              <p className="text-2xl font-semibold text-gray-900">5</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-md">
              <div className="w-6 h-6 bg-green-600 rounded"></div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">완료된 요구사항</p>
              <p className="text-2xl font-semibold text-gray-900">85</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-md">
              <div className="w-6 h-6 bg-yellow-600 rounded"></div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">진행 중</p>
              <p className="text-2xl font-semibold text-gray-900">35</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-md">
              <div className="w-6 h-6 bg-red-600 rounded"></div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">지연된 작업</p>
              <p className="text-2xl font-semibold text-gray-900">3</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">최근 프로젝트</h3>
          <div className="space-y-3">
            {['웹 포털 시스템', '모바일 앱', 'API 서버'].map((project, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-900">{project}</span>
                <span className="text-xs text-gray-500">진행 중</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">최근 활동</h3>
          <div className="space-y-3">
            {[
              '새로운 요구사항이 추가되었습니다',
              '프로젝트 상태가 업데이트되었습니다',
              '보고서가 생성되었습니다'
            ].map((activity, index) => (
              <div key={index} className="flex items-start py-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3"></div>
                <span className="text-sm text-gray-700">{activity}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// 사용자 관리 페이지 (간단한 버전)
const UserManagementPage: React.FC = () => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">사용자 관리</h2>
        <p className="text-gray-600">시스템 사용자를 관리할 수 있습니다.</p>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500">사용자 관리 기능이 구현될 예정입니다.</p>
      </div>
    </div>
  );
};

// 시스템 설정 페이지 (간단한 버전)
const SystemSettingsPage: React.FC = () => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">시스템 설정</h2>
        <p className="text-gray-600">시스템 전체 설정을 관리할 수 있습니다.</p>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500">시스템 설정 기능이 구현될 예정입니다.</p>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;