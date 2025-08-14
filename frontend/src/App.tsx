import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginForm from './components/LoginForm';
import Layout from './components/Layout';
import ProjectManagementPage from './pages/ProjectManagementPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import ProjectProgressPage from './pages/ProjectProgressPage';
import AccessControlPage from './pages/AccessControlPage';
import EnhancedReportPage from './pages/EnhancedReportPage';
import { api } from './api/client';

const AppContent: React.FC = () => {
  const { user, isLoading, isAuthenticated, login } = useAuth();
  const [currentPath, setCurrentPath] = useState('/dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

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

  const handleNavigate = (path: string, projectId?: number) => {
    setCurrentPath(path);
    if (projectId) {
      setSelectedProjectId(projectId);
    }
  };

  const handleBackToProjects = () => {
    setCurrentPath('/projects');
    setSelectedProjectId(null);
  };

  const renderCurrentPage = () => {
    switch (currentPath) {
      case '/dashboard':
        return <DashboardPage />;
      case '/projects':
        return <ProjectManagementPage user={user!} />;
      case '/project-detail':
        return selectedProjectId ? (
          <ProjectDetailPage projectId={selectedProjectId} onBack={handleBackToProjects} />
        ) : (
          <div className="p-6">
            <div className="text-center text-gray-500">{useTranslation().t('project.selectProject')}</div>
          </div>
        );
      case '/project-progress':
        return selectedProjectId ? (
          <ProjectProgressPage projectId={selectedProjectId} onBack={handleBackToProjects} />
        ) : (
          <div className="p-6">
            <div className="text-center text-gray-500">{useTranslation().t('project.selectProject')}</div>
          </div>
        );
      case '/reports':
        return <EnhancedReportPage />;
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
  const { t } = useTranslation();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalProjects: 0,
    completedRequirements: 0,
    inProgressRequirements: 0,
    pendingRequirements: 0
  });
  const [recentProjects, setRecentProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 대시보드 데이터 로드
  React.useEffect(() => {
    const loadDashboardData = async () => {
      // 인증되지 않은 경우 데이터 로드를 건너뜀
      const token = localStorage.getItem('token');
      if (!user || !token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // 프로젝트 목록 가져오기
        const projectsResponse = await api.get('/projects');
        if (projectsResponse.data.success) {
          const projects = projectsResponse.data.data.projects || [];
          setRecentProjects(projects.slice(0, 5)); // 최근 5개 프로젝트
          
          // 모든 프로젝트의 요구사항 통계 계산
          let totalCompleted = 0;
          let totalInProgress = 0;
          let totalPending = 0;
          
          for (const project of projects) {
            try {
              const reqResponse = await api.get(`/requirements/project/${project.id}`);
              if (reqResponse.data.success) {
                const requirements = reqResponse.data.data.requirements || [];
                const flatRequirements = flattenRequirements(requirements);
                
                totalCompleted += flatRequirements.filter(req => req.status === '완료').length;
                totalInProgress += flatRequirements.filter(req => req.status === '진행중').length;
                totalPending += flatRequirements.filter(req => req.status === '요청').length;
              }
            } catch (err) {
              console.error('요구사항 로드 실패:', err);
            }
          }
          
          setStats({
            totalProjects: projects.length,
            completedRequirements: totalCompleted,
            inProgressRequirements: totalInProgress,
            pendingRequirements: totalPending
          });
        }
      } catch (err) {
        console.error('대시보드 데이터 로드 실패:', err);
        console.error('에러 상세:', err.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user]);

  // 요구사항 트리를 평면화하는 함수
  const flattenRequirements = (reqs: any[]): any[] => {
    const result: any[] = [];
    reqs.forEach(req => {
      result.push(req);
      if (req.children) {
        result.push(...flattenRequirements(req.children));
      }
    });
    return result;
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };
  
  return (
    <div className="p-6">
      <div className="mb-6">
        <p className="text-gray-600">{t('dashboard.welcome', { name: user?.name })}</p>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">{t('common.loading')}</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-md">
                  <div className="w-6 h-6 bg-blue-600 rounded"></div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{t('dashboard.totalProjects')}</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalProjects}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-md">
                  <div className="w-6 h-6 bg-green-600 rounded"></div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{t('dashboard.completedRequirements')}</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.completedRequirements}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-md">
                  <div className="w-6 h-6 bg-orange-600 rounded"></div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{t('dashboard.inProgress')}</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.inProgressRequirements}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-md">
                  <div className="w-6 h-6 bg-blue-600 rounded"></div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{t('dashboard.pending')}</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.pendingRequirements}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">{t('dashboard.recentProjects')}</h3>
              <div className="space-y-3">
                {recentProjects.length === 0 ? (
                  <p className="text-sm text-gray-500">{t('dashboard.noProjects')}</p>
                ) : (
                  recentProjects.map((project) => (
                    <div key={project.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                      <div>
                        <span className="text-sm text-gray-900">{project.name}</span>
                        <p className="text-xs text-gray-500 mt-1">{formatDate(project.createdAt)}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        project.status === '진행중' ? 'bg-blue-100 text-blue-800' :
                        project.status === '완료' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {project.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">{t('dashboard.projectProgress')}</h3>
              <div className="space-y-4">
                {recentProjects.slice(0, 3).map((project) => (
                  <div key={project.id} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-900">{project.name}</span>
                      <span className="text-gray-500">진행중</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${Math.random() * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
                {recentProjects.length === 0 && (
                  <p className="text-sm text-gray-500">{t('dashboard.noProgressData')}</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};


// 시스템 설정 페이지 (간단한 버전)
const SystemSettingsPage: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('admin.systemSettings')}</h2>
        <p className="text-gray-600">{t('admin.systemSettingsDescription')}</p>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500">{t('admin.comingSoon')}</p>
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