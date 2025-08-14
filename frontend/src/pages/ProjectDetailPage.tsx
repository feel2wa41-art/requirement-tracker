import React, { useState, useEffect } from 'react';
import { ArrowLeft, FileText, Settings } from 'lucide-react';
import RequirementList from '../components/RequirementList';
import RequirementForm from '../components/RequirementForm';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Requirement } from '../types/requirement';

interface Project {
  id: number;
  name: string;
  description?: string;
  status: '진행중' | '완료' | '보류';
  requester: string;
  modifier: string;
  confirmer: string;
  createdAt: string;
  updatedAt: string;
}

interface ProjectDetailPageProps {
  projectId: number;
  onBack: () => void;
}

const ProjectDetailPage: React.FC<ProjectDetailPageProps> = ({ projectId, onBack }) => {
  const { hasPermission } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [_requirements, _setRequirements] = useState<Requirement[]>([]);
  const [requirementsCount, setRequirementsCount] = useState(0);
  const [selectedRequirement, setSelectedRequirement] = useState<Requirement | null>(null);
  const [showRequirementForm, setShowRequirementForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'requirements' | 'details' | 'reports'>('requirements');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canWrite = hasPermission('requirement.write');
  const canDelete = hasPermission('requirement.delete');

  useEffect(() => {
    loadProjectData();
  }, [projectId]);

  const loadProjectData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 프로젝트 정보 로드
      const projectResponse = await axios.get(`/api/projects/${projectId}`);
      if (projectResponse.data.success) {
        setProject(projectResponse.data.data.project);
      }

      // 요구사항 정보 로드
      await loadRequirements();
    } catch (err: any) {
      console.error('프로젝트 데이터 로드 실패:', err);
      setError(err.response?.data?.message || '프로젝트 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const loadRequirements = async () => {
    try {
      const response = await axios.get(`/api/requirements/project/${projectId}`);
      if (response.data.success) {
        const reqs = response.data.data.requirements || [];
        _setRequirements(reqs);
        setRequirementsCount(flattenRequirements(reqs).length);
      }
    } catch (err: any) {
      console.error('요구사항 로드 실패:', err);
    }
  };

  const flattenRequirements = (reqs: Requirement[]): Requirement[] => {
    const result: Requirement[] = [];
    reqs.forEach(req => {
      result.push(req);
      if (req.children) {
        result.push(...flattenRequirements(req.children));
      }
    });
    return result;
  };

  const handleAddRequirement = (_projectId: number, _parentNumber?: string) => {
    setSelectedRequirement(null);
    setShowRequirementForm(true);
  };

  const handleEditRequirement = (requirement: Requirement) => {
    setSelectedRequirement(requirement);
    setShowRequirementForm(true);
  };

  const handleCloseRequirementForm = () => {
    setShowRequirementForm(false);
    setSelectedRequirement(null);
  };

  const handleRequirementSaved = () => {
    setShowRequirementForm(false);
    setSelectedRequirement(null);
    loadRequirements();
  };

  const _handleDeleteRequirement = async (requirement: Requirement) => {
    if (!canDelete) return;
    
    if (window.confirm(`"${requirement.title}" 요구사항을 삭제하시겠습니까?`)) {
      try {
        const response = await axios.delete(`/api/requirements/${requirement.id}`);
        if (response.data.success) {
          loadRequirements();
        } else {
          alert(response.data.message || '요구사항 삭제에 실패했습니다.');
        }
      } catch (err: any) {
        console.error('요구사항 삭제 실패:', err);
        alert(err.response?.data?.message || '요구사항 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">프로젝트 정보를 불러오는 중...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="text-red-800">
            <h3 className="font-medium">오류 발생</h3>
            <p className="text-sm mt-1">{error}</p>
          </div>
          <button
            onClick={loadProjectData}
            className="mt-4 px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
            title="뒤로가기"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project?.name}</h1>
            <p className="text-gray-600 mt-1">{project?.description || '프로젝트 상세 정보 및 요구사항을 관리하세요'}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            project?.status === '진행중' ? 'bg-blue-100 text-blue-800' :
            project?.status === '완료' ? 'bg-green-100 text-green-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {project?.status}
          </span>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('requirements')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'requirements'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FileText size={16} className="inline mr-2" />
            요구사항 ({requirementsCount})
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'details'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Settings size={16} className="inline mr-2" />
            프로젝트 상세
          </button>
        </nav>
      </div>

      {/* 탭 콘텐츠 */}
      {activeTab === 'requirements' && (
        <div className="space-y-6">
          {/* 요구사항 관리 헤더 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">요구사항 관리</h2>
              <p className="text-gray-600 mt-1">프로젝트의 모든 요구사항을 체계적으로 관리하세요</p>
            </div>
          </div>

          {/* 요구사항 목록 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <RequirementList
              projectId={projectId}
              userRole={canWrite ? 'admin' : 'user'}
              onAddRequirement={canWrite ? handleAddRequirement : undefined}
              onEditRequirement={canWrite ? handleEditRequirement : undefined}
              onRequirementAdded={loadRequirements}
            />
          </div>
        </div>
      )}

      {activeTab === 'details' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">프로젝트 정보</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">요구자</label>
                <p className="mt-1 text-sm text-gray-900">{project?.requester}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">수정자</label>
                <p className="mt-1 text-sm text-gray-900">{project?.modifier}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">확인자</label>
                <p className="mt-1 text-sm text-gray-900">{project?.confirmer}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">생성일</label>
                <p className="mt-1 text-sm text-gray-900">
                  {project?.createdAt ? new Date(project.createdAt).toLocaleDateString('ko-KR') : '-'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">수정일</label>
                <p className="mt-1 text-sm text-gray-900">
                  {project?.updatedAt ? new Date(project.updatedAt).toLocaleDateString('ko-KR') : '-'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 요구사항 폼 모달 */}
      <RequirementForm
        isOpen={showRequirementForm}
        onClose={handleCloseRequirementForm}
        onSuccess={handleRequirementSaved}
        projectId={projectId}
        requirement={selectedRequirement || undefined}
        mode={selectedRequirement ? 'edit' : 'create'}
      />
    </div>
  );
};

export default ProjectDetailPage;