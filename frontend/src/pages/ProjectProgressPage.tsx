import React, { useState, useEffect } from 'react';
import { BarChart3, ArrowLeft, Calendar, TrendingUp, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import axios from 'axios';

interface Project {
  id: number;
  name: string;
  description?: string;
  status: '진행중' | '완료' | '보류';
  completionDate?: string;
  effort: {
    manMonths?: number;
    manDays?: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface Requirement {
  id: number;
  number: string;
  title: string;
  status: string;
  priority: '높음' | '보통' | '낮음';
  progress?: number;
  completionDate?: string;
  level: number;
  children?: Requirement[];
}

interface ProgressStats {
  totalRequirements: number;
  completedRequirements: number;
  averageProgress: number;
  onTimeRequirements: number;
  delayedRequirements: number;
}

interface ProjectProgressPageProps {
  projectId: number;
  onBack: () => void;
}

const ProjectProgressPage: React.FC<ProjectProgressPageProps> = ({ projectId, onBack }) => {
  const [project, setProject] = useState<Project | null>(null);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [progressStats, setProgressStats] = useState<ProgressStats>({
    totalRequirements: 0,
    completedRequirements: 0,
    averageProgress: 0,
    onTimeRequirements: 0,
    delayedRequirements: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      const requirementsResponse = await axios.get(`/api/requirements/project/${projectId}`);
      if (requirementsResponse.data.success) {
        const reqData = requirementsResponse.data.data.requirements || [];
        setRequirements(reqData);
        
        // 진척도 통계 계산
        const flatRequirements = flattenRequirements(reqData);
        calculateProgressStats(flatRequirements);
      }
    } catch (err: any) {
      console.error('프로젝트 데이터 로드 실패:', err);
      setError(err.response?.data?.message || '프로젝트 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
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

  const calculateProgressStats = (flatRequirements: Requirement[]) => {
    const total = flatRequirements.length;
    const completed = flatRequirements.filter(req => req.status === '완료').length;
    const totalProgress = flatRequirements.reduce((sum, req) => sum + (req.progress || 0), 0);
    const averageProgress = total > 0 ? totalProgress / total : 0;

    // 현재 날짜 기준으로 지연된 요구사항 계산 (임시로 랜덤 값 사용)
    const onTime = Math.floor(total * 0.7);
    const delayed = total - onTime - completed;

    setProgressStats({
      totalRequirements: total,
      completedRequirements: completed,
      averageProgress,
      onTimeRequirements: onTime,
      delayedRequirements: Math.max(0, delayed)
    });
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 90) return 'bg-green-500';
    if (progress >= 70) return 'bg-blue-500';
    if (progress >= 50) return 'bg-yellow-500';
    if (progress >= 30) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case '높음': return '🔴';
      case '보통': return '🟡';
      case '낮음': return '🟢';
      default: return '🟡';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('ko-KR');
    } catch {
      return '-';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">프로젝트 진척도를 불러오는 중...</span>
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
            <h1 className="text-2xl font-bold text-gray-900">{project?.name} - 개발 진척도</h1>
            <p className="text-gray-600 mt-1">프로젝트 전체 진행 현황과 요구사항별 진척도를 확인하세요</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <BarChart3 className="h-6 w-6 text-blue-600" />
          <span className="text-lg font-semibold text-blue-600">
            {progressStats.averageProgress.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* 진척도 개요 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-md">
              <CheckCircle className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">전체 진척도</p>
              <p className="text-2xl font-semibold text-gray-900">
                {progressStats.averageProgress.toFixed(1)}%
              </p>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${getProgressColor(progressStats.averageProgress)}`}
                style={{ width: `${progressStats.averageProgress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-md">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">완료된 요구사항</p>
              <p className="text-2xl font-semibold text-gray-900">
                {progressStats.completedRequirements}/{progressStats.totalRequirements}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-md">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">일정 내 진행</p>
              <p className="text-2xl font-semibold text-gray-900">
                {progressStats.onTimeRequirements}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-md">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">지연된 작업</p>
              <p className="text-2xl font-semibold text-gray-900">
                {progressStats.delayedRequirements}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 프로젝트 정보 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">프로젝트 정보</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">프로젝트 상태</label>
            <span className={`inline-block mt-1 px-2 py-1 rounded text-sm font-medium ${
              project?.status === '완료' ? 'bg-green-100 text-green-800' :
              project?.status === '진행중' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {project?.status}
            </span>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">완료 예정일</label>
            <p className="mt-1 text-sm text-gray-900">{formatDate(project?.completionDate)}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">투입 공수</label>
            <p className="mt-1 text-sm text-gray-900">
              {project?.effort?.manMonths ? `${project.effort.manMonths} M/M` : ''} 
              {project?.effort?.manMonths && project?.effort?.manDays ? ', ' : ''}
              {project?.effort?.manDays ? `${project.effort.manDays} M/D` : ''}
              {!project?.effort?.manMonths && !project?.effort?.manDays ? '-' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* 요구사항별 진척도 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">요구사항별 진척도</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">번호</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">제목</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">우선순위</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">진척도</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">완료일</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {flattenRequirements(requirements).map((requirement) => (
                <tr key={requirement.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span 
                      className="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded"
                      style={{ marginLeft: `${requirement.level * 20}px` }}
                    >
                      {requirement.number}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{requirement.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      {requirement.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span title={`우선순위: ${requirement.priority}`}>
                      {getPriorityIcon(requirement.priority)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-3">
                        <div 
                          className={`h-2 rounded-full ${getProgressColor(requirement.progress || 0)}`}
                          style={{ width: `${requirement.progress || 0}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-900">{requirement.progress || 0}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(requirement.completionDate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {flattenRequirements(requirements).length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">등록된 요구사항이 없습니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectProgressPage;