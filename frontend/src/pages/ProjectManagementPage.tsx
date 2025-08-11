import React, { useEffect, useState } from 'react';
import { Plus, FileText, Settings, BarChart3, ChevronDown, Search, Eye, Grid, List } from 'lucide-react';
import RequirementList from '../components/RequirementList';
import ProjectForm from '../components/ProjectForm';
import RequirementForm from '../components/RequirementForm';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

interface Project {
  id: number;
  name: string;
  description?: string;
  requester: string;
  modifier: string;
  confirmer: string;
  status: '진행중' | '완료' | '보류';
  details: {
    frontend: {
      enabled: boolean;
      description?: string;
    };
    backend: {
      enabled: boolean;
      description?: string;
    };
    platform: string[];
    ideTools: string[];
    developmentEnvironment: {
      frameworks: string[];
      libraries: string[];
      versions: Record<string, string>;
    };
    hasSpecification: boolean;
    screenNames: string[];
  };
  createdAt: string;
  updatedAt: string;
}

interface Props {
  user: {
    id: string;
    name: string;
    role: 'admin' | 'manager' | 'user';
  };
}

type TabType = 'requirements' | 'details' | 'reports';

const ProjectManagementPage: React.FC<Props> = ({ user }) => {
  const { hasPermission } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('requirements');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showRequirementForm, setShowRequirementForm] = useState(false);
  const [requirementParentNumber, setRequirementParentNumber] = useState<string | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [showProjectDetails, setShowProjectDetails] = useState(false);
  const [requirementListKey, setRequirementListKey] = useState(0);

  const selectedProject = projects.find(p => p.id === selectedProjectId) || null;
  const canWrite = hasPermission('project.write');

  // 프로젝트 목록 로드
  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/api/projects');
      
      if (response.data.success) {
        const projectList = response.data.data.projects;
        setProjects(projectList);
        setFilteredProjects(projectList);
        
        // 선택된 프로젝트가 없거나 삭제된 경우 첫 번째 프로젝트 선택은 하지 않음
        // 사용자가 직접 선택하도록 변경
        if (selectedProjectId && !projectList.find((p: Project) => p.id === selectedProjectId)) {
          setSelectedProjectId(null);
          setShowProjectDetails(false);
        }
      } else {
        setError(response.data.message || '프로젝트를 불러오는데 실패했습니다.');
      }
    } catch (err: any) {
      console.error('프로젝트 로드 실패:', err);
      setError(err.response?.data?.message || '프로젝트를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 초기 로드
  useEffect(() => {
    loadProjects();
  }, []);

  // 프로젝트 검색 필터링
  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = projects.filter(project => 
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.requester.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.modifier.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.confirmer.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProjects(filtered);
    } else {
      setFilteredProjects(projects);
    }
  }, [searchTerm, projects]);

  // 프로젝트 추가 핸들러
  const handleAddProject = () => {
    setShowProjectForm(true);
  };

  // 프로젝트 추가 성공 핸들러
  const handleProjectAddSuccess = () => {
    loadProjects(); // 프로젝트 목록 새로고침
  };

  // 프로젝트 선택 핸들러
  const handleSelectProject = (projectId: number) => {
    setSelectedProjectId(projectId);
    setShowProjectDetails(true);
    setActiveTab('requirements');
  };

  // 프로젝트 목록으로 돌아가기
  const handleBackToList = () => {
    setShowProjectDetails(false);
    setSelectedProjectId(null);
  };

  // 프로젝트 상태 변경 핸들러
  const handleProjectStatusChange = async (projectId: number, newStatus: Project['status']) => {
    try {
      const response = await axios.patch(`/api/projects/${projectId}/status`, { status: newStatus });
      
      if (response.data.success) {
        // 프로젝트 목록 새로고침
        loadProjects();
      } else {
        console.error('프로젝트 상태 변경 실패:', response.data.message);
      }
    } catch (err: any) {
      console.error('프로젝트 상태 변경 실패:', err);
    }
  };

  // 요구사항 추가 핸들러
  const handleAddRequirement = (projectId: number, parentNumber?: string) => {
    setRequirementParentNumber(parentNumber);
    setShowRequirementForm(true);
  };

  // 탭 설정
  const tabs = [
    { id: 'requirements', label: '요구사항', icon: FileText, count: 0 },
    { id: 'details', label: '프로젝트 상세', icon: Settings },
    { id: 'reports', label: '보고서', icon: BarChart3 }
  ] as const;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">프로젝트를 불러오는 중...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="text-red-800">
            <h3 className="font-medium">오류 발생</h3>
            <p className="text-sm mt-1">{error}</p>
          </div>
          <button
            onClick={loadProjects}
            className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  // 프로젝트 목록 화면 렌더링
  if (!showProjectDetails) {
    return (
      <div className="space-y-6">
        {/* 상단 헤더 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">프로젝트 관리</h1>
              <p className="text-gray-600 mt-1">프로젝트를 선택하여 요구사항을 관리하세요</p>
            </div>
            
            {canWrite && (
              <button
                onClick={handleAddProject}
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 flex items-center"
              >
                <Plus size={16} className="mr-2" />
                새 프로젝트
              </button>
            )}
          </div>
        </div>

        {/* 검색 및 필터 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1 relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="프로젝트 이름, 설명, 담당자로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">보기:</span>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                title="리스트 보기"
              >
                <List size={18} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                title="그리드 보기"
              >
                <Grid size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* 프로젝트 목록 */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">프로젝트를 불러오는 중...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div className="text-red-800">
                  <h3 className="font-medium">오류 발생</h3>
                  <p className="text-sm mt-1">{error}</p>
                </div>
                <button
                  onClick={loadProjects}
                  className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                >
                  다시 시도
                </button>
              </div>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-12">
              <FileText size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {projects.length === 0 ? '프로젝트가 없습니다' : '검색 결과가 없습니다'}
              </h3>
              <p className="text-gray-600 mb-4">
                {projects.length === 0 
                  ? '첫 번째 프로젝트를 생성하여 시작하세요.' 
                  : '다른 검색어를 시도해보세요.'
                }
              </p>
              {canWrite && projects.length === 0 && (
                <button
                  onClick={handleAddProject}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                >
                  첫 프로젝트 생성하기
                </button>
              )}
            </div>
          ) : (
            <ProjectGrid 
              projects={filteredProjects} 
              viewMode={viewMode}
              onSelectProject={handleSelectProject}
            />
          )}
        </div>

        {/* 프로젝트 추가 모달 */}
        <ProjectForm
          isOpen={showProjectForm}
          onClose={() => setShowProjectForm(false)}
          onSuccess={handleProjectAddSuccess}
        />
      </div>
    );
  }

  // 프로젝트 상세 화면 렌더링
  return (
    <div className="space-y-6">
      {/* 상단 헤더 - 뒤로가기 버튼과 프로젝트 정보 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <button
              onClick={handleBackToList}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              title="프로젝트 목록으로 돌아가기"
            >
              <ChevronDown size={20} className="rotate-90" />
            </button>
            
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{selectedProject?.name}</h1>
              {selectedProject?.description && (
                <p className="text-gray-600 mt-1">{selectedProject.description}</p>
              )}
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                <span>요구자: {selectedProject?.requester}</span>
                <span>수정자: {selectedProject?.modifier}</span>
                <span>확인자: {selectedProject?.confirmer}</span>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <select
              value={selectedProject?.status || '진행중'}
              onChange={(e) => handleProjectStatusChange(selectedProject?.id!, e.target.value as Project['status'])}
              className={`px-3 py-1 rounded-lg text-sm font-medium border-0 cursor-pointer focus:ring-2 focus:ring-blue-500 ${
                selectedProject?.status === '진행중' ? 'bg-blue-100 text-blue-800' :
                selectedProject?.status === '완료' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}
              disabled={!canWrite}
            >
              <option value="진행중">진행중</option>
              <option value="완료">완료</option>
              <option value="보류">보류</option>
            </select>
          </div>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      {selectedProject && (
        <>
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                      isActive
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon size={16} className="mr-2" />
                    {tab.label}
                    {tab.count !== undefined && (
                      <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* 탭 내용 */}
          <div className="min-h-[400px]">
            {activeTab === 'requirements' && (
              <RequirementList
                projectId={selectedProject.id}
                userRole={user.role}
                onAddRequirement={handleAddRequirement}
                onEditRequirement={(requirement) => {
                  // TODO: 요구사항 편집 모달 구현
                  console.log('Edit requirement:', requirement);
                }}
              />
            )}
            
            {activeTab === 'details' && (
              <ProjectDetailsTab project={selectedProject} canEdit={canWrite} />
            )}
            
            {activeTab === 'reports' && (
              <ProjectReportsTab project={selectedProject} />
            )}
          </div>
        </>
      )}

      {/* 프로젝트가 없을 때 */}
      {!selectedProject && projects.length === 0 && (
        <div className="text-center py-12">
          <FileText size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">프로젝트가 없습니다</h3>
          <p className="text-gray-600 mb-4">첫 번째 프로젝트를 생성하여 시작하세요.</p>
          {canWrite && (
            <button
              onClick={handleAddProject}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
            >
              프로젝트 생성하기
            </button>
          )}
        </div>
      )}

      {/* 프로젝트 추가 모달 */}
      <ProjectForm
        isOpen={showProjectForm}
        onClose={() => setShowProjectForm(false)}
        onSuccess={handleProjectAddSuccess}
      />

      {/* 요구사항 추가 모달 */}
      <RequirementForm
        isOpen={showRequirementForm}
        onClose={() => {
          setShowRequirementForm(false);
          setRequirementParentNumber(undefined);
        }}
        onSuccess={() => {
          // 요구사항 추가 성공 후 폼을 닫고 목록을 새로고침
          setShowRequirementForm(false);
          setRequirementParentNumber(undefined);
          // RequirementList 새로고침을 위해 key를 변경
          setRequirementListKey(prev => prev + 1);
        }}
        projectId={selectedProjectId!}
        parentNumber={requirementParentNumber}
      />
    </div>
  );
};

// 프로젝트 상세 탭 컴포넌트
const ProjectDetailsTab: React.FC<{ project: Project; canEdit: boolean }> = ({ project, canEdit }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-6">프로젝트 상세 정보</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Front-end 개발 */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Front-end 개발</h4>
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={project.details.frontend.enabled}
              disabled={!canEdit}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">Front-end 개발 여부</span>
          </div>
          {project.details.frontend.description && (
            <p className="text-sm text-gray-600 pl-7">{project.details.frontend.description}</p>
          )}
        </div>

        {/* Back-end 개발 */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Back-end 개발</h4>
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={project.details.backend.enabled}
              disabled={!canEdit}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">Back-end 개발 여부</span>
          </div>
          {project.details.backend.description && (
            <p className="text-sm text-gray-600 pl-7">{project.details.backend.description}</p>
          )}
        </div>

        {/* 플랫폼 */}
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">플랫폼</h4>
          <div className="flex flex-wrap gap-2">
            {project.details.platform.length > 0 ? (
              project.details.platform.map((platform, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                >
                  {platform}
                </span>
              ))
            ) : (
              <span className="text-sm text-gray-500">설정되지 않음</span>
            )}
          </div>
        </div>

        {/* IDE 도구 */}
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">IDE 도구</h4>
          <div className="flex flex-wrap gap-2">
            {project.details.ideTools.length > 0 ? (
              project.details.ideTools.map((tool, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded"
                >
                  {tool}
                </span>
              ))
            ) : (
              <span className="text-sm text-gray-500">설정되지 않음</span>
            )}
          </div>
        </div>
      </div>

      {/* 기획서 작성 여부 */}
      <div className="mt-6 pt-6 border-t border-gray-100">
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={project.details.hasSpecification}
            disabled={!canEdit}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <span className="font-medium text-gray-900">기획서 작성 여부</span>
        </div>
      </div>

      {/* 화면명 */}
      <div className="mt-6">
        <h4 className="font-medium text-gray-900 mb-2">관련 화면</h4>
        <div className="flex flex-wrap gap-2">
          {project.details.screenNames.length > 0 ? (
            project.details.screenNames.map((screen, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded"
              >
                {screen}
              </span>
            ))
          ) : (
            <span className="text-sm text-gray-500">등록된 화면이 없습니다</span>
          )}
        </div>
      </div>

      {canEdit && (
        <div className="mt-6 pt-6 border-t border-gray-100">
          <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700">
            상세 정보 편집
          </button>
        </div>
      )}
    </div>
  );
};

// 프로젝트 보고서 탭 컴포넌트
const ProjectReportsTab: React.FC<{ project: Project }> = ({ project }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">프로젝트 보고서</h3>
      <p className="text-gray-600">프로젝트별 보고서 기능이 구현될 예정입니다.</p>
    </div>
  );
};

// 프로젝트 그리드/리스트 컴포넌트
interface ProjectGridProps {
  projects: Project[];
  viewMode: 'list' | 'grid';
  onSelectProject: (projectId: number) => void;
}

const ProjectGrid: React.FC<ProjectGridProps> = ({ projects, viewMode, onSelectProject }) => {
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <div
            key={project.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onSelectProject(project.id)}
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 flex-1">{project.name}</h3>
              <span className={`px-2 py-1 rounded text-xs font-medium ml-2 ${
                project.status === '진행중' ? 'bg-blue-100 text-blue-800' :
                project.status === '완료' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {project.status}
              </span>
            </div>
            
            {project.description && (
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">{project.description}</p>
            )}
            
            <div className="space-y-2 text-xs text-gray-500">
              <div className="flex items-center justify-between">
                <span>요구자:</span>
                <span className="font-medium">{project.requester}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>생성일:</span>
                <span>{formatDate(project.createdAt)}</span>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-4">
                  {project.details.frontend.enabled && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">Frontend</span>
                  )}
                  {project.details.backend.enabled && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Backend</span>
                  )}
                </div>
                <button className="text-blue-600 hover:text-blue-800 font-medium flex items-center">
                  <Eye size={14} className="mr-1" />
                  보기
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // 리스트 뷰
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 text-sm font-medium text-gray-700 border-b border-gray-200">
        <div className="col-span-4">프로젝트명</div>
        <div className="col-span-2">상태</div>
        <div className="col-span-2">요구자</div>
        <div className="col-span-2">생성일</div>
        <div className="col-span-2">작업</div>
      </div>
      
      {projects.map((project) => (
        <div
          key={project.id}
          className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
        >
          <div className="col-span-4">
            <div>
              <h3 className="font-medium text-gray-900">{project.name}</h3>
              {project.description && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-1">{project.description}</p>
              )}
              <div className="flex items-center space-x-2 mt-2">
                {project.details.frontend.enabled && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">Frontend</span>
                )}
                {project.details.backend.enabled && (
                  <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs">Backend</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="col-span-2 flex items-center">
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              project.status === '진행중' ? 'bg-blue-100 text-blue-800' :
              project.status === '완료' ? 'bg-green-100 text-green-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {project.status}
            </span>
          </div>
          
          <div className="col-span-2 flex items-center text-sm text-gray-600">
            {project.requester}
          </div>
          
          <div className="col-span-2 flex items-center text-sm text-gray-600">
            {formatDate(project.createdAt)}
          </div>
          
          <div className="col-span-2 flex items-center">
            <button
              onClick={() => onSelectProject(project.id)}
              className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 font-medium border border-blue-200 rounded hover:bg-blue-50 transition-colors flex items-center"
            >
              <Eye size={14} className="mr-1" />
              상세보기
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProjectManagementPage;