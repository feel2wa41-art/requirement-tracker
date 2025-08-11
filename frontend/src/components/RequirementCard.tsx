import React, { useState } from 'react';
import { Plus, Edit, Calendar, User, ChevronDown, ChevronRight, MoreVertical } from 'lucide-react';

interface Requirement {
  id: number;
  projectId: number;
  number: string;
  title: string;
  description?: string;
  status: '요청' | '검토중' | '진행중' | '완료' | '보류' | '취소';
  priority: '높음' | '보통' | '낮음';
  requester?: string;
  requestDate?: string;
  modifier?: string;
  modifyDate?: string;
  confirmer?: string;
  confirmDate?: string;
  parentId?: number | null;
  parentNumber?: string | null;
  level: number;
  sortOrder: number;
  isExpanded: boolean;
  children?: Requirement[];
  createdAt: string;
  updatedAt: string;
}

interface Props {
  requirement: Requirement;
  onToggleExpand?: (id: number, isExpanded: boolean) => void;
  onAddSubRequirement?: (parentId: number, parentNumber: string) => void;
  onEditRequirement?: (requirement: Requirement) => void;
  onStatusChange?: (id: number, status: Requirement['status']) => void;
  userRole: 'admin' | 'manager' | 'user';
}

// 상태별 색상 매핑
const getStatusColor = (status: Requirement['status']): string => {
  const colors = {
    '요청': 'bg-blue-100 text-blue-800',
    '검토중': 'bg-yellow-100 text-yellow-800',
    '진행중': 'bg-orange-100 text-orange-800',
    '완료': 'bg-green-100 text-green-800',
    '보류': 'bg-gray-100 text-gray-800',
    '취소': 'bg-red-100 text-red-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

// 우선순위별 색상 매핑
const getPriorityColor = (priority: Requirement['priority']): string => {
  const colors = {
    '높음': 'bg-red-100 text-red-800',
    '보통': 'bg-blue-100 text-blue-800',
    '낮음': 'bg-gray-100 text-gray-800'
  };
  return colors[priority] || 'bg-gray-100 text-gray-800';
};

// 날짜 포맷 함수
const formatDate = (dateString?: string): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return '';
  }
};

const RequirementCard: React.FC<Props> = ({ 
  requirement, 
  onToggleExpand,
  onAddSubRequirement,
  onEditRequirement,
  onStatusChange,
  userRole 
}) => {
  const [showActions, setShowActions] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  
  const hasChildren = requirement.children && requirement.children.length > 0;
  const canEdit = userRole === 'admin' || userRole === 'manager';
  const canWrite = userRole === 'admin' || userRole === 'manager';

  // 들여쓰기 스타일
  const indentStyle = {
    marginLeft: `${requirement.level * 20}px`,
  };

  // 왼쪽 경계선 스타일 (하위 요구사항인 경우)
  const borderStyle = requirement.level > 0 ? {
    borderLeft: '2px solid #e5e7eb',
    paddingLeft: '12px'
  } : {};

  const handleToggleExpand = () => {
    if (onToggleExpand) {
      onToggleExpand(requirement.id, !requirement.isExpanded);
    }
  };

  const handleAddSubRequirement = () => {
    if (onAddSubRequirement) {
      onAddSubRequirement(requirement.id, requirement.number);
    }
  };

  const handleEditRequirement = () => {
    if (onEditRequirement) {
      onEditRequirement(requirement);
    }
  };

  const handleStatusChange = (newStatus: Requirement['status']) => {
    if (onStatusChange) {
      onStatusChange(requirement.id, newStatus);
    }
    setShowStatusMenu(false);
  };

  const statusOptions: Requirement['status'][] = ['요청', '검토중', '진행중', '완료', '보류', '취소'];

  return (
    <div>
      <div style={indentStyle}>
        <div 
          className={`
            bg-white rounded-lg shadow-sm border border-gray-200 transition-all duration-200 hover:shadow-md
            ${requirement.level > 0 ? 'ml-4' : ''}
          `}
          style={borderStyle}
        >
          <div className="p-4">
            {/* 헤더 영역 */}
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                {/* 펼치기/접기 버튼 (하위 요구사항이 있는 경우만) */}
                {hasChildren && (
                  <button
                    onClick={handleToggleExpand}
                    className="mt-1 p-1 hover:bg-gray-100 rounded transition-colors duration-200"
                    title={requirement.isExpanded ? '접기' : '펼치기'}
                  >
                    {requirement.isExpanded ? (
                      <ChevronDown size={16} className="text-gray-600" />
                    ) : (
                      <ChevronRight size={16} className="text-gray-600" />
                    )}
                  </button>
                )}

                <div className="flex-1">
                  {/* 번호와 제목 */}
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-mono bg-gray-100 text-gray-700 border">
                      {requirement.number}
                    </span>
                    <h4 className="font-medium text-gray-900 flex-1">
                      {requirement.title}
                    </h4>
                  </div>

                  {/* 설명 */}
                  {requirement.description && (
                    <p className="text-sm text-gray-600 mb-3 pl-2 border-l-2 border-gray-200">
                      {requirement.description}
                    </p>
                  )}

                  {/* 상태 및 우선순위 배지 */}
                  <div className="flex items-center space-x-2 mb-3">
                    <button
                      onClick={() => setShowStatusMenu(!showStatusMenu)}
                      className={`px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer hover:opacity-80 ${getStatusColor(requirement.status)} ${canEdit ? '' : 'cursor-default'}`}
                      disabled={!canEdit}
                      title={canEdit ? '상태 변경' : ''}
                    >
                      {requirement.status}
                    </button>
                    
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(requirement.priority)}`}>
                      {requirement.priority}
                    </span>
                    
                    {hasChildren && (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        하위 {requirement.children?.length}개
                      </span>
                    )}
                  </div>

                  {/* 메타데이터 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs text-gray-500">
                    {requirement.requester && (
                      <div className="flex items-center space-x-1">
                        <User size={12} />
                        <span>요청: {requirement.requester}</span>
                      </div>
                    )}
                    {requirement.requestDate && (
                      <div className="flex items-center space-x-1">
                        <Calendar size={12} />
                        <span>{formatDate(requirement.requestDate)}</span>
                      </div>
                    )}
                    {requirement.modifier && requirement.modifyDate && (
                      <div className="flex items-center space-x-1">
                        <Edit size={12} />
                        <span>수정: {requirement.modifier} ({formatDate(requirement.modifyDate)})</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 액션 버튼들 */}
              <div className="relative flex items-center space-x-1">
                {canWrite && (
                  <button
                    onClick={handleAddSubRequirement}
                    className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors duration-200"
                    title="하위 요구사항 추가"
                  >
                    <Plus size={16} />
                  </button>
                )}
                
                {canEdit && (
                  <>
                    <button
                      onClick={handleEditRequirement}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors duration-200"
                      title="요구사항 수정"
                    >
                      <Edit size={16} />
                    </button>
                    
                    <button
                      onClick={() => setShowActions(!showActions)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors duration-200"
                      title="더 많은 옵션"
                    >
                      <MoreVertical size={16} />
                    </button>
                  </>
                )}

                {/* 상태 변경 드롭다운 */}
                {showStatusMenu && canEdit && (
                  <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1 min-w-[120px]">
                    {statusOptions.map((status) => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(status)}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${
                          status === requirement.status ? 'bg-gray-50 font-medium' : ''
                        }`}
                      >
                        <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                          getStatusColor(status).includes('blue') ? 'bg-blue-500' :
                          getStatusColor(status).includes('yellow') ? 'bg-yellow-500' :
                          getStatusColor(status).includes('orange') ? 'bg-orange-500' :
                          getStatusColor(status).includes('green') ? 'bg-green-500' :
                          getStatusColor(status).includes('gray') ? 'bg-gray-500' :
                          'bg-red-500'
                        }`} />
                        {status}
                      </button>
                    ))}
                  </div>
                )}

                {/* 액션 메뉴 */}
                {showActions && canEdit && (
                  <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1 min-w-[120px]">
                    <button
                      onClick={() => {
                        // TODO: 삭제 로직 구현
                        setShowActions(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      삭제
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 진행률 표시 (하위 요구사항이 있는 경우) */}
            {hasChildren && requirement.isExpanded && requirement.children && (
              <div className="mt-4 pt-3 border-t border-gray-100">
                <RequirementProgress requirements={requirement.children} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 하위 요구사항 렌더링 (재귀) */}
      {hasChildren && requirement.isExpanded && requirement.children && (
        <div className="mt-2">
          {requirement.children.map((child) => (
            <RequirementCard
              key={child.id}
              requirement={child}
              onToggleExpand={onToggleExpand}
              onAddSubRequirement={onAddSubRequirement}
              onEditRequirement={onEditRequirement}
              onStatusChange={onStatusChange}
              userRole={userRole}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// 하위 요구사항들의 진행률을 보여주는 컴포넌트
interface ProgressProps {
  requirements: Requirement[];
}

const RequirementProgress: React.FC<ProgressProps> = ({ requirements }) => {
  if (requirements.length === 0) return null;

  const statusCount = requirements.reduce((acc, req) => {
    acc[req.status] = (acc[req.status] || 0) + 1;
    return acc;
  }, {} as Record<Requirement['status'], number>);

  const total = requirements.length;
  const completed = statusCount['완료'] || 0;
  const progressPercentage = Math.round((completed / total) * 100);

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-gray-600">
        <span>하위 요구사항 진행률</span>
        <span>{completed}/{total} 완료 ({progressPercentage}%)</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-green-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      <div className="flex flex-wrap gap-3 text-xs">
        {Object.entries(statusCount).map(([status, count]) => (
          <span key={status} className="flex items-center space-x-1">
            <span className={`w-2 h-2 rounded-full ${
              status === '완료' ? 'bg-green-500' :
              status === '진행중' ? 'bg-orange-500' :
              status === '검토중' ? 'bg-yellow-500' :
              status === '보류' ? 'bg-gray-500' :
              status === '취소' ? 'bg-red-500' :
              'bg-blue-500'
            }`} />
            <span className="text-gray-600">{status} {count}</span>
          </span>
        ))}
      </div>
    </div>
  );
};

// 외부 클릭 감지를 위한 hook
const useClickOutside = (ref: React.RefObject<HTMLElement>, callback: () => void) => {
  React.useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        callback();
      }
    };
    
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [ref, callback]);
};

export default RequirementCard;