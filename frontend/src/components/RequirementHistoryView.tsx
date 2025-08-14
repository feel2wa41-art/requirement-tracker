import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Clock, 
  User, 
  Activity, 
  AlertCircle, 
  CheckCircle, 
  Edit,
  FileText,
  Tag,
  Filter,
  Calendar,
  ChevronDown,
  ChevronUp,
  Download
} from 'lucide-react';
import axios from 'axios';

interface HistoryEntry {
  id: number;
  requirementId: number;
  changeType: string;
  fieldName?: string;
  oldValue?: string;
  newValue?: string;
  changedBy: string;
  changeReason?: string;
  timestamp: string;
  requirement?: {
    number: string;
    title: string;
    currentStatus: string;
  };
}

interface RequirementHistoryViewProps {
  projectId: number;
  requirementId?: number;
  showProjectFilter?: boolean;
}

const RequirementHistoryView: React.FC<RequirementHistoryViewProps> = ({
  projectId,
  requirementId,
  showProjectFilter = true
}) => {
  const { t } = useTranslation();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    changeType: '',
    dateRange: { start: '', end: '' },
    changedBy: ''
  });
  const [expandedEntries, setExpandedEntries] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadHistory();
  }, [projectId, requirementId]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      const endpoint = requirementId 
        ? `/api/history/requirement/${requirementId}`
        : `/api/history/project/${projectId}`;
      
      const params: any = {};
      if (filters.dateRange.start && filters.dateRange.end) {
        params.startDate = filters.dateRange.start;
        params.endDate = filters.dateRange.end;
      }

      const response = await axios.get(endpoint, { params });
      
      if (response.data.success) {
        setHistory(response.data.data.history || []);
      } else {
        setError(response.data.message || '이력을 불러오는데 실패했습니다.');
      }
    } catch (err: any) {
      console.error('이력 로드 실패:', err);
      setError(err.response?.data?.message || '이력을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getChangeTypeIcon = (changeType: string) => {
    switch (changeType) {
      case 'created': return <FileText className="w-4 h-4 text-green-500" />;
      case 'status_changed': return <Activity className="w-4 h-4 text-blue-500" />;
      case 'title_changed': return <Edit className="w-4 h-4 text-orange-500" />;
      case 'description_changed': return <Edit className="w-4 h-4 text-orange-500" />;
      case 'priority_changed': return <Tag className="w-4 h-4 text-purple-500" />;
      case 'assigned': return <User className="w-4 h-4 text-indigo-500" />;
      case 'deleted': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getChangeTypeLabel = (changeType: string) => {
    const labels: { [key: string]: string } = {
      created: '생성됨',
      status_changed: '상태 변경',
      title_changed: '제목 변경',
      description_changed: '설명 변경',
      priority_changed: '우선순위 변경',
      assigned: '담당자 지정',
      deleted: '삭제됨'
    };
    return labels[changeType] || changeType;
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleEntryExpansion = (entryId: number) => {
    const newExpanded = new Set(expandedEntries);
    if (newExpanded.has(entryId)) {
      newExpanded.delete(entryId);
    } else {
      newExpanded.add(entryId);
    }
    setExpandedEntries(newExpanded);
  };

  const filteredHistory = history.filter(entry => {
    if (filters.changeType && entry.changeType !== filters.changeType) return false;
    if (filters.changedBy && !entry.changedBy.toLowerCase().includes(filters.changedBy.toLowerCase())) return false;
    return true;
  });

  const exportHistoryToCSV = () => {
    const csvData = [
      ['Export Information'],
      ['Project ID', projectId.toString()],
      ['Requirement ID', requirementId ? requirementId.toString() : 'All'],
      ['Export Date', new Date().toLocaleString('ko-KR')],
      ['Total Records', filteredHistory.length.toString()],
      [''],
      ['Change History'],
      ['Change Type', 'Field Name', 'Old Value', 'New Value', 'Changed By', 'Timestamp', 'Requirement', 'Change Reason'],
      ...filteredHistory.map(entry => [
        getChangeTypeLabel(entry.changeType),
        entry.fieldName || '',
        entry.oldValue || '',
        entry.newValue || '',
        entry.changedBy,
        formatTimestamp(entry.timestamp),
        entry.requirement ? `${entry.requirement.number} - ${entry.requirement.title}` : '',
        entry.changeReason || ''
      ])
    ];

    const csvContent = csvData.map(row => 
      Array.isArray(row) ? row.map(cell => `"${cell}"`).join(',') : `"${row}"`
    ).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fileName = requirementId 
      ? `requirement-${requirementId}-history-${new Date().toISOString().split('T')[0]}.csv`
      : `project-${projectId}-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">이력을 불러오는 중...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
          <span className="text-red-800">{error}</span>
        </div>
        <button
          onClick={loadHistory}
          className="mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 필터 섹션 */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">변경 유형</label>
            <select
              value={filters.changeType}
              onChange={(e) => setFilters(prev => ({ ...prev, changeType: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">전체</option>
              <option value="created">생성됨</option>
              <option value="status_changed">상태 변경</option>
              <option value="title_changed">제목 변경</option>
              <option value="description_changed">설명 변경</option>
              <option value="priority_changed">우선순위 변경</option>
              <option value="assigned">담당자 지정</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">변경자</label>
            <input
              type="text"
              value={filters.changedBy}
              onChange={(e) => setFilters(prev => ({ ...prev, changedBy: e.target.value }))}
              placeholder="변경자 이름"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">시작 날짜</label>
            <input
              type="date"
              value={filters.dateRange.start}
              onChange={(e) => setFilters(prev => ({ 
                ...prev, 
                dateRange: { ...prev.dateRange, start: e.target.value }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">종료 날짜</label>
            <input
              type="date"
              value={filters.dateRange.end}
              onChange={(e) => setFilters(prev => ({ 
                ...prev, 
                dateRange: { ...prev.dateRange, end: e.target.value }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
        </div>
        
        <div className="mt-3 flex justify-between">
          <button
            onClick={exportHistoryToCSV}
            disabled={filteredHistory.length === 0}
            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
          >
            <Download className="w-4 h-4 mr-1" />
            CSV 내보내기
          </button>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setFilters({ changeType: '', dateRange: { start: '', end: '' }, changedBy: '' })}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
            >
              필터 초기화
            </button>
            <button
              onClick={loadHistory}
              className="px-4 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              적용
            </button>
          </div>
        </div>
      </div>

      {/* 이력 목록 */}
      <div className="space-y-3">
        {filteredHistory.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>표시할 이력이 없습니다.</p>
          </div>
        ) : (
          filteredHistory.map((entry) => (
            <div key={entry.id} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  {getChangeTypeIcon(entry.changeType)}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">
                        {getChangeTypeLabel(entry.changeType)}
                      </span>
                      {entry.requirement && (
                        <span className="text-sm text-gray-500">
                          {entry.requirement.number} - {entry.requirement.title}
                        </span>
                      )}
                    </div>
                    
                    <div className="mt-1 text-sm text-gray-600">
                      <span className="flex items-center space-x-4">
                        <span className="flex items-center">
                          <User className="w-3 h-3 mr-1" />
                          {entry.changedBy}
                        </span>
                        <span className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatTimestamp(entry.timestamp)}
                        </span>
                      </span>
                    </div>

                    {(entry.oldValue || entry.newValue) && (
                      <div className="mt-2">
                        <button
                          onClick={() => toggleEntryExpansion(entry.id)}
                          className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                        >
                          {expandedEntries.has(entry.id) ? (
                            <ChevronUp className="w-4 h-4 mr-1" />
                          ) : (
                            <ChevronDown className="w-4 h-4 mr-1" />
                          )}
                          변경 내용 보기
                        </button>
                        
                        {expandedEntries.has(entry.id) && (
                          <div className="mt-2 p-3 bg-gray-50 rounded border-l-4 border-blue-400">
                            {entry.oldValue && (
                              <div className="mb-2">
                                <span className="text-xs font-medium text-gray-600">이전 값:</span>
                                <div className="text-sm text-red-600 bg-red-50 px-2 py-1 rounded mt-1">
                                  {entry.oldValue}
                                </div>
                              </div>
                            )}
                            {entry.newValue && (
                              <div>
                                <span className="text-xs font-medium text-gray-600">새 값:</span>
                                <div className="text-sm text-green-600 bg-green-50 px-2 py-1 rounded mt-1">
                                  {entry.newValue}
                                </div>
                              </div>
                            )}
                            {entry.changeReason && (
                              <div className="mt-2">
                                <span className="text-xs font-medium text-gray-600">변경 사유:</span>
                                <div className="text-sm text-gray-700 mt-1">
                                  {entry.changeReason}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RequirementHistoryView;