import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, Palette } from 'lucide-react';
import axios from 'axios';

interface CustomStatus {
  id: string;
  name: string;
  color: string;
  description?: string;
  order: number;
  isDefault: boolean;
}

interface Props {
  projectId: number;
  userRole: 'admin' | 'manager' | 'user';
  onStatusChange?: () => void; // 상태 변경 시 콜백
}

const CustomStatusManager: React.FC<Props> = ({ projectId, userRole, onStatusChange }) => {
  const [statuses, setStatuses] = useState<CustomStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // 새 상태 추가 폼 상태
  const [newStatus, setNewStatus] = useState({
    name: '',
    color: '#3b82f6',
    description: ''
  });
  
  // 편집 중인 상태 데이터
  const [editData, setEditData] = useState({
    name: '',
    color: '',
    description: ''
  });

  const canEdit = userRole === 'admin' || userRole === 'manager';

  // 상태 목록 로드
  const loadStatuses = async () => {
    if (!projectId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`/api/projects/${projectId}/custom-statuses`);
      if (response.data.success) {
        const sortedStatuses = response.data.data.customStatuses.sort((a: CustomStatus, b: CustomStatus) => a.order - b.order);
        setStatuses(sortedStatuses);
      }
    } catch (err: any) {
      console.error('상태 로드 실패:', err);
      setError(err.response?.data?.message || '상태를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStatuses();
  }, [projectId]);

  // 새 상태 추가
  const handleAddStatus = async () => {
    if (!newStatus.name.trim()) {
      setError('상태 이름을 입력해주세요.');
      return;
    }

    try {
      const response = await axios.post(`/api/projects/${projectId}/custom-statuses`, newStatus);
      if (response.data.success) {
        await loadStatuses();
        setNewStatus({ name: '', color: '#3b82f6', description: '' });
        setShowAddForm(false);
        onStatusChange?.();
        setError(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || '상태 추가에 실패했습니다.');
    }
  };

  // 상태 편집 시작
  const startEdit = (status: CustomStatus) => {
    setEditingId(status.id);
    setEditData({
      name: status.name,
      color: status.color,
      description: status.description || ''
    });
  };

  // 상태 편집 저장
  const saveEdit = async () => {
    if (!editData.name.trim()) {
      setError('상태 이름을 입력해주세요.');
      return;
    }

    try {
      const response = await axios.put(`/api/projects/${projectId}/custom-statuses/${editingId}`, editData);
      if (response.data.success) {
        await loadStatuses();
        setEditingId(null);
        onStatusChange?.();
        setError(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || '상태 수정에 실패했습니다.');
    }
  };

  // 상태 편집 취소
  const cancelEdit = () => {
    setEditingId(null);
    setEditData({ name: '', color: '', description: '' });
  };

  // 상태 삭제
  const deleteStatus = async (statusId: string) => {
    if (!confirm('이 상태를 삭제하시겠습니까?')) return;

    try {
      const response = await axios.delete(`/api/projects/${projectId}/custom-statuses/${statusId}`);
      if (response.data.success) {
        await loadStatuses();
        onStatusChange?.();
        setError(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || '상태 삭제에 실패했습니다.');
    }
  };

  // 미리 정의된 색상 팔레트
  const colorPalette = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
    '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#6b7280'
  ];

  if (isLoading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-sm text-gray-600 mt-2">상태를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-medium text-gray-900">상태 관리</h4>
        {canEdit && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center"
          >
            <Plus size={16} className="mr-2" />
            상태 추가
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* 새 상태 추가 폼 */}
      {showAddForm && canEdit && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h5 className="font-medium text-gray-900 mb-3">새 상태 추가</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                상태 이름 *
              </label>
              <input
                type="text"
                value={newStatus.name}
                onChange={(e) => setNewStatus(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="예: 대기중"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                색상 *
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={newStatus.color}
                  onChange={(e) => setNewStatus(prev => ({ ...prev, color: e.target.value }))}
                  className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                />
                <div className="flex space-x-1">
                  {colorPalette.map(color => (
                    <button
                      key={color}
                      onClick={() => setNewStatus(prev => ({ ...prev, color }))}
                      className={`w-6 h-6 rounded border-2 ${
                        newStatus.color === color ? 'border-gray-800' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                설명
              </label>
              <textarea
                value={newStatus.description}
                onChange={(e) => setNewStatus(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={2}
                placeholder="상태에 대한 설명을 입력하세요"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <button
              onClick={() => setShowAddForm(false)}
              className="px-3 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
            >
              취소
            </button>
            <button
              onClick={handleAddStatus}
              className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              추가
            </button>
          </div>
        </div>
      )}

      {/* 상태 목록 */}
      <div className="space-y-2">
        {statuses.map((status) => (
          <div
            key={status.id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
          >
            {editingId === status.id ? (
              // 편집 모드
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      상태 이름
                    </label>
                    <input
                      type="text"
                      value={editData.name}
                      onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={status.isDefault}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      색상
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={editData.color}
                        onChange={(e) => setEditData(prev => ({ ...prev, color: e.target.value }))}
                        className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                        disabled={status.isDefault}
                      />
                      <div className="flex space-x-1">
                        {colorPalette.map(color => (
                          <button
                            key={color}
                            onClick={() => setEditData(prev => ({ ...prev, color }))}
                            className={`w-6 h-6 rounded border-2 ${
                              editData.color === color ? 'border-gray-800' : 'border-gray-300'
                            }`}
                            style={{ backgroundColor: color }}
                            disabled={status.isDefault}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      설명
                    </label>
                    <textarea
                      value={editData.description}
                      onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={2}
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={cancelEdit}
                    className="px-3 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 flex items-center"
                  >
                    <X size={16} className="mr-1" />
                    취소
                  </button>
                  <button
                    onClick={saveEdit}
                    className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center"
                  >
                    <Save size={16} className="mr-1" />
                    저장
                  </button>
                </div>
              </div>
            ) : (
              // 보기 모드
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded-full border border-gray-300"
                    style={{ backgroundColor: status.color }}
                  />
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">{status.name}</span>
                      {status.isDefault && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                          기본
                        </span>
                      )}
                    </div>
                    {status.description && (
                      <p className="text-sm text-gray-600 mt-1">{status.description}</p>
                    )}
                  </div>
                </div>
                
                {canEdit && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => startEdit(status)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="편집"
                    >
                      <Edit size={16} />
                    </button>
                    {!status.isDefault && (
                      <button
                        onClick={() => deleteStatus(status.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="삭제"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {statuses.length === 0 && (
        <div className="text-center py-8">
          <Palette size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">등록된 상태가 없습니다.</p>
          {canEdit && (
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-2 px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              첫 번째 상태 추가하기
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomStatusManager;