import React, { useState } from 'react';
import { Plus, Edit, ChevronDown, ChevronRight, Save, X } from 'lucide-react';
import { Requirement, CustomStatus } from '../types/requirement';
import StatusChangeModal from './StatusChangeModal';

interface Props {
  requirement: Requirement;
  onToggleExpand?: (id: number, isExpanded: boolean) => void;
  onAddSubRequirement?: (parentId: number, parentNumber: string) => void;
  onEditRequirement?: (requirement: Requirement) => void;
  onStatusChange?: (id: number, status: string) => void;
  onUpdateRequirement?: (id: number, title: string) => void;
  onProgressChange?: (id: number, progress: number) => void;
  onPriorityChange?: (id: number, priority: '높음' | '보통' | '낮음') => void;
  userRole: 'admin' | 'manager' | 'user';
  customStatuses?: CustomStatus[];
}

// 상태별 색상 매핑 (커스텀 상태 지원)
const getStatusColor = (status: Requirement['status'], customStatuses?: CustomStatus[]): string => {
  if (customStatuses) {
    const customStatus = customStatuses.find(s => s.name === status);
    if (customStatus) {
      // 색상을 Tailwind 클래스로 변환
      const hexToTailwind = (color: string) => {
        const colorMap: Record<string, string> = {
          '#3b82f6': 'bg-blue-100 text-blue-800 border-blue-200',
          '#ef4444': 'bg-red-100 text-red-800 border-red-200',
          '#10b981': 'bg-green-100 text-green-800 border-green-200',
          '#f59e0b': 'bg-yellow-100 text-yellow-800 border-yellow-200',
          '#f97316': 'bg-orange-100 text-orange-800 border-orange-200',
          '#6b7280': 'bg-gray-100 text-gray-800 border-gray-200',
          '#8b5cf6': 'bg-purple-100 text-purple-800 border-purple-200',
          '#06b6d4': 'bg-cyan-100 text-cyan-800 border-cyan-200',
          '#84cc16': 'bg-lime-100 text-lime-800 border-lime-200',
          '#ec4899': 'bg-pink-100 text-pink-800 border-pink-200'
        };
        return colorMap[color] || 'bg-gray-100 text-gray-800 border-gray-200';
      };
      return hexToTailwind(customStatus.color);
    }
  }
  
  // 기본 색상 매핑 (fallback)
  const defaultColors = {
    '요청': 'bg-blue-100 text-blue-800 border-blue-200',
    '검토중': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    '진행중': 'bg-orange-100 text-orange-800 border-orange-200',
    '완료': 'bg-green-100 text-green-800 border-green-200',
    '보류': 'bg-gray-100 text-gray-800 border-gray-200',
    '취소': 'bg-red-100 text-red-800 border-red-200'
  };
  return defaultColors[status as keyof typeof defaultColors] || 'bg-gray-100 text-gray-800 border-gray-200';
};

// 우선순위별 색상 매핑
const getPriorityIcon = (priority: Requirement['priority']): string => {
  const icons = {
    '높음': '🔴',
    '보통': '🟡',
    '낮음': '🟢'
  };
  return icons[priority] || '🟡';
};

const RequirementRow: React.FC<Props> = ({ 
  requirement, 
  onToggleExpand,
  onAddSubRequirement,
  onEditRequirement,
  onStatusChange,
  onUpdateRequirement,
  onProgressChange,
  onPriorityChange,
  userRole,
  customStatuses 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(requirement.title);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);
  const [isEditingProgress, setIsEditingProgress] = useState(false);
  const [editProgress, setEditProgress] = useState(requirement.progress || 0);
  
  const hasChildren = requirement.children && requirement.children.length > 0;
  const canEdit = userRole === 'admin' || userRole === 'manager';
  const canWrite = userRole === 'admin' || userRole === 'manager';

  // 들여쓰기 스타일
  const indentStyle = {
    paddingLeft: `${requirement.level * 20 + 8}px`,
  };

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

  const handleStatusChange = async (newStatus: Requirement['status']) => {
    if (onStatusChange) {
      try {
        await onStatusChange(requirement.id, newStatus);
      } catch (error) {
        console.error('상태 변경 실패:', error);
        throw error;
      }
    }
  };

  const handlePriorityChange = (newPriority: '높음' | '보통' | '낮음') => {
    if (onPriorityChange) {
      onPriorityChange(requirement.id, newPriority);
    }
    setShowPriorityMenu(false);
  };

  const handleSaveEdit = () => {
    if (onUpdateRequirement && editTitle.trim() !== requirement.title) {
      onUpdateRequirement(requirement.id, editTitle.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditTitle(requirement.title);
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const handleProgressSave = () => {
    if (onProgressChange && editProgress !== requirement.progress) {
      onProgressChange(requirement.id, editProgress);
    }
    setIsEditingProgress(false);
  };

  const handleProgressCancel = () => {
    setEditProgress(requirement.progress || 0);
    setIsEditingProgress(false);
  };

  const handleProgressKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleProgressSave();
    } else if (e.key === 'Escape') {
      handleProgressCancel();
    }
  };

  const statusOptions = customStatuses ? customStatuses.map(s => s.name) : ['요청', '검토중', '진행중', '완료', '보류', '취소'];

  return (
    <div>
      <div 
        className="flex items-center py-2 px-4 hover:bg-gray-50 border-b border-gray-100 group"
        style={indentStyle}
      >
        {/* 펼치기/접기 버튼 */}
        <div className="w-6 flex-shrink-0">
          {hasChildren && (
            <button
              onClick={handleToggleExpand}
              className="p-1 hover:bg-gray-200 rounded transition-colors duration-200"
              title={requirement.isExpanded ? '접기' : '펼치기'}
            >
              {requirement.isExpanded ? (
                <ChevronDown size={14} className="text-gray-600" />
              ) : (
                <ChevronRight size={14} className="text-gray-600" />
              )}
            </button>
          )}
        </div>

        {/* 번호 */}
        <div className="w-20 flex-shrink-0">
          <span className="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
            {requirement.number}
          </span>
        </div>

        {/* 제목 */}
        <div className="flex-1 min-w-0 mx-3">
          {isEditing ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={handleKeyPress}
              onBlur={handleSaveEdit}
              className="w-full text-sm border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          ) : (
            <span 
              className="text-sm text-gray-900 cursor-pointer hover:text-blue-600"
              onClick={() => canEdit && setIsEditing(true)}
              title={canEdit ? '클릭하여 편집' : requirement.title}
            >
              {requirement.title}
            </span>
          )}
        </div>

        {/* 상태 */}
        <div className="w-20 flex-shrink-0 relative">
          <button
            onClick={() => canEdit && setShowStatusModal(true)}
            className={`text-xs px-2 py-1 rounded border transition-colors ${getStatusColor(requirement.status, customStatuses)} ${
              canEdit ? 'hover:opacity-80 cursor-pointer' : 'cursor-default'
            }`}
            disabled={!canEdit}
            title={canEdit ? '상태 변경' : ''}
          >
            {requirement.status}
          </button>
        </div>

        {/* 우선순위 */}
        <div className="w-12 flex-shrink-0 text-center relative">
          {canEdit && onPriorityChange ? (
            <button
              onClick={() => setShowPriorityMenu(!showPriorityMenu)}
              className="hover:bg-gray-100 rounded p-1"
              title={`우선순위: ${requirement.priority} (클릭하여 변경)`}
            >
              {getPriorityIcon(requirement.priority)}
            </button>
          ) : (
            <span title={`우선순위: ${requirement.priority}`}>
              {getPriorityIcon(requirement.priority)}
            </span>
          )}
          
          {/* 우선순위 변경 메뉴 */}
          {showPriorityMenu && canEdit && onPriorityChange && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1 min-w-[80px]">
              {['높음', '보통', '낮음'].map((priority) => (
                <button
                  key={priority}
                  onClick={() => handlePriorityChange(priority as '높음' | '보통' | '낮음')}
                  className={`block w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                    priority === requirement.priority ? 'bg-gray-50 font-medium' : ''
                  }`}
                >
                  {getPriorityIcon(priority as '높음' | '보통' | '낮음')} {priority}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 진척도 */}
        <div className="w-20 flex-shrink-0">
          {isEditingProgress ? (
            <div className="flex items-center space-x-1">
              <input
                type="number"
                min="0"
                max="100"
                value={editProgress}
                onChange={(e) => setEditProgress(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                onKeyDown={handleProgressKeyPress}
                onBlur={handleProgressSave}
                className="w-12 text-xs border border-blue-300 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                autoFocus
              />
              <span className="text-xs text-gray-500">%</span>
            </div>
          ) : (
            <div 
              className={`text-center ${canEdit ? 'cursor-pointer hover:bg-gray-100 rounded px-1 py-0.5' : ''}`}
              onClick={() => canEdit && setIsEditingProgress(true)}
              title={canEdit ? '클릭하여 진척도 편집' : `진척도: ${requirement.progress || 0}%`}
            >
              <div className="text-xs font-medium text-gray-700">{requirement.progress || 0}%</div>
              <div className="w-full bg-gray-200 rounded-full h-1 mt-0.5">
                <div 
                  className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                  style={{ width: `${requirement.progress || 0}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* 하위 개수 */}
        <div className="w-16 flex-shrink-0 text-center">
          {hasChildren && (
            <span className="text-xs text-gray-500">
              {requirement.children?.length}개
            </span>
          )}
        </div>

        {/* 액션 버튼들 */}
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {isEditing ? (
            <>
              <button
                onClick={handleSaveEdit}
                className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                title="저장"
              >
                <Save size={14} />
              </button>
              <button
                onClick={handleCancelEdit}
                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                title="취소"
              >
                <X size={14} />
              </button>
            </>
          ) : (
            <>
              {canWrite && (
                <button
                  onClick={handleAddSubRequirement}
                  className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                  title="하위 요구사항 추가"
                >
                  <Plus size={14} />
                </button>
              )}
              
              {canEdit && (
                <button
                  onClick={handleEditRequirement}
                  className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="상세 편집"
                >
                  <Edit size={14} />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* 하위 요구사항 렌더링 (재귀) */}
      {hasChildren && requirement.isExpanded && requirement.children && (
        <div>
          {requirement.children.map((child) => (
            <RequirementRow
              key={child.id}
              requirement={child}
              onToggleExpand={onToggleExpand}
              onAddSubRequirement={onAddSubRequirement}
              onEditRequirement={onEditRequirement}
              onStatusChange={onStatusChange}
              onUpdateRequirement={onUpdateRequirement}
              onProgressChange={onProgressChange}
              onPriorityChange={onPriorityChange}
              userRole={userRole}
              customStatuses={customStatuses}
            />
          ))}
        </div>
      )}
      
      {/* 상태 변경 모달 */}
      {customStatuses && (
        <StatusChangeModal
          isOpen={showStatusModal}
          onClose={() => setShowStatusModal(false)}
          currentStatus={requirement.status}
          onStatusChange={handleStatusChange}
          customStatuses={customStatuses}
          requirementTitle={requirement.title}
        />
      )}
    </div>
  );
};

export default RequirementRow;