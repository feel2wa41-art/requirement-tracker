import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import axios from 'axios';

interface RequirementFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projectId: number;
  parentNumber?: string; // 하위 요구사항인 경우 부모 번호
}

const RequirementForm: React.FC<RequirementFormProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  projectId,
  parentNumber 
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: '요청' as const,
    priority: '보통' as const,
    requester: '',
    modifier: '',
    confirmer: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const statusOptions = ['요청', '검토중', '진행중', '완료', '보류', '취소'] as const;
  const priorityOptions = ['높음', '보통', '낮음'] as const;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 필수 필드 검증
    if (!formData.title.trim()) {
      setError('요구사항 제목은 필수입니다.');
      return;
    }

    setLoading(true);

    try {
      const requestData = {
        ...formData,
        projectId,
        parentNumber: parentNumber || null,
        status: formData.status,
        priority: formData.priority
      };

      const response = await axios.post('/api/requirements', requestData);
      
      if (response.data.success) {
        onSuccess();
        onClose();
        resetForm();
      } else {
        setError(response.data.message || '요구사항 생성에 실패했습니다.');
      }
    } catch (err: any) {
      console.error('요구사항 생성 실패:', err);
      setError(err.response?.data?.message || '요구사항 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      status: '요청',
      priority: '보통',
      requester: '',
      modifier: '',
      confirmer: ''
    });
    setError(null);
  };

  const handleClose = () => {
    if (!loading) {
      resetForm();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {parentNumber ? `하위 요구사항 추가 (${parentNumber})` : '새 요구사항 추가'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* 기본 정보 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">기본 정보</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                요구사항 제목 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="요구사항 제목을 입력하세요"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                상세 설명
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="요구사항에 대한 상세한 설명을 입력하세요 (선택사항)"
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  상태
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                >
                  {statusOptions.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  우선순위
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                >
                  {priorityOptions.map(priority => (
                    <option key={priority} value={priority}>{priority}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 담당자 정보 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">담당자 정보</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  요구자
                </label>
                <input
                  type="text"
                  value={formData.requester}
                  onChange={(e) => setFormData(prev => ({ ...prev, requester: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="요구자"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  수정자
                </label>
                <input
                  type="text"
                  value={formData.modifier}
                  onChange={(e) => setFormData(prev => ({ ...prev, modifier: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="수정자"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  확인자
                </label>
                <input
                  type="text"
                  value={formData.confirmer}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmer: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="확인자"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              disabled={loading}
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors flex items-center"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  생성 중...
                </>
              ) : (
                <>
                  <Plus size={16} className="mr-2" />
                  요구사항 생성
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RequirementForm;