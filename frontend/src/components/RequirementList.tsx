import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, RefreshCw, Filter, Search, Grid, List } from 'lucide-react';
import RequirementCard from './RequirementCard';
import RequirementRow from './RequirementRow';
import axios from 'axios';
import { Requirement, CustomStatus } from '../types/requirement';

interface Props {
  projectId: number;
  userRole: 'admin' | 'manager' | 'user';
  onAddRequirement?: (projectId: number, parentNumber?: string) => void;
  onEditRequirement?: (requirement: Requirement) => void;
  onRequirementAdded?: () => void; // 요구사항 추가 후 콜백
}

const RequirementList: React.FC<Props> = ({ 
  projectId, 
  userRole, 
  onAddRequirement,
  onEditRequirement,
  onRequirementAdded: _onRequirementAdded
}) => {
  const { t } = useTranslation();
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [filteredRequirements, setFilteredRequirements] = useState<Requirement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'card' | 'row'>('row');
  const [customStatuses, setCustomStatuses] = useState<CustomStatus[]>([]);

  const canWrite = userRole === 'admin' || userRole === 'manager';

  // 커스텀 상태 로드
  const loadCustomStatuses = async () => {
    if (!projectId) return;

    try {
      const response = await axios.get(`/api/projects/${projectId}/custom-statuses`);
      if (response.data.success) {
        const sortedStatuses = response.data.data.customStatuses.sort((a: any, b: any) => a.order - b.order);
        setCustomStatuses(sortedStatuses);
      }
    } catch (err: any) {
      console.error('커스텀 상태 로드 실패:', err);
    }
  };

  // 요구사항 목록 로드
  const loadRequirements = async () => {
    if (!projectId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get(`/api/requirements/project/${projectId}`);
      if (response.data.success) {
        const requirementsData = response.data.data.requirements || [];
        setRequirements(requirementsData);
        setFilteredRequirements(requirementsData);
      } else {
        setError(response.data.message || '요구사항을 불러올 수 없습니다.');
      }
    } catch (err: any) {
      console.error('요구사항 로드 실패:', err);
      setError(err.response?.data?.message || '요구사항을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 프로젝트 변경 시 요구사항과 커스텀 상태 다시 로드
  useEffect(() => {
    loadRequirements();
    loadCustomStatuses();
  }, [projectId]);

  // 상태 변경 이벤트 리스너 추가
  useEffect(() => {
    const handleStatusChanged = () => {
      loadCustomStatuses();
    };
    
    window.addEventListener('statusChanged', handleStatusChanged);
    return () => window.removeEventListener('statusChanged', handleStatusChanged);
  }, [projectId]);

  // 필터링 및 검색
  useEffect(() => {
    let filtered = [...requirements];

    // 검색어 필터링
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      const filterBySearch = (reqs: Requirement[]): Requirement[] => {
        return reqs.filter(req => {
          const matchesSearch = req.title.toLowerCase().includes(searchLower) ||
                               req.number.toLowerCase().includes(searchLower) ||
                               req.description?.toLowerCase().includes(searchLower);
          
          // 자식 요구사항 검사
          const filteredChildren = req.children ? filterBySearch(req.children) : [];
          
          // 현재 요구사항이 매치되거나 자식 중에 매치되는 것이 있으면 포함
          if (matchesSearch || filteredChildren.length > 0) {
            return true;
          }
          
          return false;
        }).map(req => ({
          ...req,
          children: req.children ? filterBySearch(req.children) : []
        }));
      };
      
      filtered = filterBySearch(filtered);
    }

    // 상태 필터링
    if (statusFilter !== 'all') {
      const filterByStatus = (reqs: Requirement[]): Requirement[] => {
        return reqs.filter(req => {
          const matchesStatus = req.status === statusFilter;
          const filteredChildren = req.children ? filterByStatus(req.children) : [];
          
          if (matchesStatus || filteredChildren.length > 0) {
            return true;
          }
          
          return false;
        }).map(req => ({
          ...req,
          children: req.children ? filterByStatus(req.children) : []
        }));
      };
      
      filtered = filterByStatus(filtered);
    }

    // 우선순위 필터링
    if (priorityFilter !== 'all') {
      const filterByPriority = (reqs: Requirement[]): Requirement[] => {
        return reqs.filter(req => {
          const matchesPriority = req.priority === priorityFilter;
          const filteredChildren = req.children ? filterByPriority(req.children) : [];
          
          if (matchesPriority || filteredChildren.length > 0) {
            return true;
          }
          
          return false;
        }).map(req => ({
          ...req,
          children: req.children ? filterByPriority(req.children) : []
        }));
      };
      
      filtered = filterByPriority(filtered);
    }

    setFilteredRequirements(filtered);
  }, [requirements, searchTerm, statusFilter, priorityFilter]);

  // 펼침/접힘 토글
  const handleToggleExpand = async (id: number, isExpanded: boolean) => {
    try {
      await axios.patch(`/api/requirements/${id}/expand`, { isExpanded });
      
      // 로컬 상태 업데이트
      const updateRequirements = (reqs: Requirement[]): Requirement[] => {
        return reqs.map(req => {
          if (req.id === id) {
            return { ...req, isExpanded };
          }
          if (req.children) {
            return { ...req, children: updateRequirements(req.children) };
          }
          return req;
        });
      };

      setRequirements(prev => updateRequirements(prev));
    } catch (err: any) {
      console.error('펼침 상태 업데이트 실패:', err);
    }
  };

  // 하위 요구사항 추가
  const handleAddSubRequirement = (_parentId: number, parentNumber: string) => {
    if (onAddRequirement) {
      onAddRequirement(projectId, parentNumber);
    }
  };

  // 루트 요구사항 추가
  const handleAddRootRequirement = () => {
    if (onAddRequirement) {
      onAddRequirement(projectId);
    }
  };

  // 상태 변경
  const handleStatusChange = async (id: number, status: Requirement['status']) => {
    try {
      const response = await axios.patch(`/api/requirements/${id}/status`, { status });
      
      if (response.data.success) {
        // 로컬 상태 업데이트
        const updateRequirements = (reqs: Requirement[]): Requirement[] => {
          return reqs.map(req => {
            if (req.id === id) {
              return { ...req, status, modifyDate: new Date().toISOString() };
            }
            if (req.children) {
              return { ...req, children: updateRequirements(req.children) };
            }
            return req;
          });
        };

        setRequirements(prev => updateRequirements(prev));
      }
    } catch (err: any) {
      console.error('상태 변경 실패:', err);
      setError(err.response?.data?.message || '상태 변경 중 오류가 발생했습니다.');
    }
  };

  // 요구사항 제목 업데이트
  const handleUpdateRequirement = async (id: number, title: string) => {
    try {
      const response = await axios.patch(`/api/requirements/${id}`, { title });
      
      if (response.data.success) {
        // 로컬 상태 업데이트
        const updateRequirements = (reqs: Requirement[]): Requirement[] => {
          return reqs.map(req => {
            if (req.id === id) {
              return { ...req, title, modifyDate: new Date().toISOString() };
            }
            if (req.children) {
              return { ...req, children: updateRequirements(req.children) };
            }
            return req;
          });
        };

        setRequirements(prev => updateRequirements(prev));
      }
    } catch (err: any) {
      console.error('요구사항 업데이트 실패:', err);
      setError(err.response?.data?.message || '요구사항 업데이트 중 오류가 발생했습니다.');
    }
  };

  // 진척도 변경
  const handleProgressChange = async (id: number, progress: number) => {
    try {
      const response = await axios.patch(`/api/requirements/${id}/progress`, { progress });
      
      if (response.data.success) {
        // 로컬 상태 업데이트
        const updateRequirements = (reqs: Requirement[]): Requirement[] => {
          return reqs.map(req => {
            if (req.id === id) {
              return { ...req, progress, modifyDate: new Date().toISOString() };
            }
            if (req.children) {
              return { ...req, children: updateRequirements(req.children) };
            }
            return req;
          });
        };

        setRequirements(prev => updateRequirements(prev));
      }
    } catch (err: any) {
      console.error('진척도 업데이트 실패:', err);
      setError(err.response?.data?.message || '진척도 업데이트 중 오류가 발생했습니다.');
    }
  };

  // 우선순위 변경
  const handlePriorityChange = async (requirementId: number, priority: '높음' | '보통' | '낮음') => {
    try {
      const response = await axios.put(`/api/requirements/${requirementId}/priority`, {
        priority
      });

      if (response.data.success) {
        // 로컬 상태 업데이트
        const updateRequirements = (reqs: Requirement[]): Requirement[] => {
          return reqs.map(req => {
            if (req.id === requirementId) {
              return { ...req, priority };
            }
            if (req.children) {
              return { ...req, children: updateRequirements(req.children) };
            }
            return req;
          });
        };
        
        setRequirements(prev => updateRequirements(prev));
      }
    } catch (err: any) {
      console.error('우선순위 업데이트 실패:', err);
      setError(err.response?.data?.message || '우선순위 업데이트 중 오류가 발생했습니다.');
    }
  };

  // 통계 계산
  const calculateStats = () => {
    const flatRequirements = flattenRequirements(requirements);
    const total = flatRequirements.length;
    const completed = flatRequirements.filter(req => req.status === '완료').length;
    const inProgress = flatRequirements.filter(req => req.status === '진행중').length;
    const pending = flatRequirements.filter(req => req.status === '요청').length;
    
    return { total, completed, inProgress, pending };
  };

  // 요구사항 트리를 평면화하는 함수
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

  const stats = calculateStats();
  const statusOptions = customStatuses.map(status => status.name);
  const priorityOptions = ['높음', '보통', '낮음'];

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="text-red-800">
            <p className="font-medium">오류 발생</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
          <button
            onClick={() => loadRequirements()}
            className="px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 및 통계 */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{t('requirement.requirementList')}</h3>
          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
            <span>{t('requirement.totalCount')} {stats.total}개</span>
            <span className="text-green-600">{t('requirement.completedCount')} {stats.completed}개</span>
            <span className="text-orange-600">{t('requirement.inProgressCount')} {stats.inProgress}개</span>
            <span className="text-blue-600">{t('requirement.pendingCount')} {stats.pending}개</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* 뷰 모드 전환 */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('row')}
              className={`p-1 rounded transition-colors ${
                viewMode === 'row' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title={t('requirement.listView')}
            >
              <List size={16} />
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={`p-1 rounded transition-colors ${
                viewMode === 'card' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title={t('requirement.cardView')}
            >
              <Grid size={16} />
            </button>
          </div>

          {canWrite && (
            <button
              onClick={handleAddRootRequirement}
              className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 flex items-center"
              disabled={!projectId}
            >
              <Plus size={16} className="mr-2" />
              {t('requirement.addRequirement')}
            </button>
          )}
          
          <button
            onClick={() => loadRequirements()}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
            title={t('form.refresh')}
            disabled={isLoading}
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* 검색 및 필터 */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder={t('requirement.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">{t('requirement.allStatuses')}</option>
            {statusOptions.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">{t('requirement.allPriorities')}</option>
            {priorityOptions.map(priority => (
              <option key={priority} value={priority}>{priority}</option>
            ))}
          </select>
          
          <div className="flex items-center text-sm text-gray-600">
            <Filter size={16} className="mr-2" />
            {flattenRequirements(filteredRequirements).length}{t('requirement.displayingCount')}
          </div>
        </div>
      </div>

      {/* 요구사항 목록 */}
      {viewMode === 'row' ? (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden max-h-[70vh] flex flex-col">
          {/* 헤더 */}
          <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
            <div className="flex items-center text-xs font-medium text-gray-600">
              <div className="w-6"></div>
              <div className="w-20 text-center">{t('requirement.numberColumn')}</div>
              <div className="flex-1 mx-3">{t('requirement.titleColumn')}</div>
              <div className="w-20 text-center">{t('requirement.statusColumn')}</div>
              <div className="w-12 text-center">{t('requirement.priorityColumn')}</div>
              <div className="w-20 text-center">{t('requirement.progressColumn')}</div>
              <div className="w-16 text-center">{t('requirement.subRequirementsColumn')}</div>
              <div className="w-20"></div>
            </div>
          </div>
          
          {/* 목록 내용 - 스크롤 가능 */}
          <div className="flex-1 overflow-y-auto" style={{scrollbarWidth: 'thin'}}>
            {isLoading ? (
              <div className="text-center py-8">
                <RefreshCw size={24} className="animate-spin mx-auto text-gray-400 mb-2" />
                <p className="text-gray-600">{t('requirement.loadingRequirements')}</p>
              </div>
            ) : filteredRequirements.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">
                  {requirements.length === 0 
                    ? t('requirement.noRequirementsRegistered') 
                    : t('requirement.noMatchingRequirements')
                  }
                </p>
                {canWrite && requirements.length === 0 && (
                  <button
                    onClick={handleAddRootRequirement}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700"
                    disabled={!projectId}
                  >
                    {t('requirement.addFirstRequirement')}
                  </button>
                )}
              </div>
            ) : (
              filteredRequirements.map((requirement) => (
                <RequirementRow
                  key={requirement.id}
                  requirement={requirement}
                  onToggleExpand={handleToggleExpand}
                  onAddSubRequirement={handleAddSubRequirement}
                  onEditRequirement={onEditRequirement}
                  onStatusChange={handleStatusChange}
                  onUpdateRequirement={handleUpdateRequirement}
                  onProgressChange={handleProgressChange}
                  onPriorityChange={handlePriorityChange}
                  userRole={userRole}
                  customStatuses={customStatuses}
                />
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3 max-h-[70vh] overflow-y-auto" style={{scrollbarWidth: 'thin'}}>
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw size={24} className="animate-spin mx-auto text-gray-400 mb-2" />
              <p className="text-gray-600">요구사항을 불러오는 중...</p>
            </div>
          ) : filteredRequirements.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">
                {requirements.length === 0 
                  ? '등록된 요구사항이 없습니다.' 
                  : '검색 조건에 맞는 요구사항이 없습니다.'
                }
              </p>
              {canWrite && requirements.length === 0 && (
                <button
                  onClick={handleAddRootRequirement}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700"
                  disabled={!projectId}
                >
                  첫 번째 요구사항 추가하기
                </button>
              )}
            </div>
          ) : (
            filteredRequirements.map((requirement) => (
              <RequirementCard
                key={requirement.id}
                requirement={requirement}
                onToggleExpand={handleToggleExpand}
                onAddSubRequirement={handleAddSubRequirement}
                onEditRequirement={onEditRequirement}
                onStatusChange={handleStatusChange}
                onUpdateRequirement={handleUpdateRequirement}
                onProgressChange={handleProgressChange}
                onPriorityChange={handlePriorityChange}
                userRole={userRole}
                customStatuses={customStatuses}
              />
            ))
          )}
        </div>
      )}

      {/* 진행률 표시 */}
      {stats.total > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">{t('requirement.overallProgress')}</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{t('requirement.progressCompletion')} {stats.completed}/{stats.total}</span>
              <span>{stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-green-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequirementList;