import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Plus } from 'lucide-react';
import axios from 'axios';

interface Requirement {
  id: number;
  projectId: number;
  number: string;
  title: string;
  description?: string;
  status: string;
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

interface RequirementFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projectId: number;
  parentNumber?: string; // 하위 요구사항인 경우 부모 번호
  requirement?: Requirement; // 편집할 요구사항 (없으면 새 요구사항 생성)
  mode?: 'create' | 'edit'; // 모드 명시
}

const RequirementForm: React.FC<RequirementFormProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  projectId,
  parentNumber,
  requirement,
  mode = 'create'
}) => {
  const { t } = useTranslation();
  const isEditMode = mode === 'edit' && requirement;
  
  const getInitialFormData = () => {
    if (isEditMode) {
      return {
        title: requirement.title,
        description: requirement.description || '',
        status: requirement.status,
        priority: requirement.priority,
        requester: requirement.requester || '',
        modifier: requirement.modifier || '',
        confirmer: requirement.confirmer || ''
      };
    }
    return {
      title: '',
      description: '',
      status: '요청',
      priority: '보통' as const,
      requester: '',
      modifier: '',
      confirmer: ''
    };
  };

  const [formData, setFormData] = useState(getInitialFormData());

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 요구사항이 변경될 때 폼 데이터 업데이트
  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialFormData());
      setError(null);
    }
  }, [isOpen, requirement, mode]);

  const statusOptions = ['요청', '검토중', '진행중', '완료', '보류', '취소'] as const;
  const priorityOptions = ['높음', '보통', '낮음'] as const;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 필수 필드 검증
    if (!formData.title.trim()) {
      setError(t('requirement.titleRequired'));
      return;
    }

    setLoading(true);

    try {
      let response;

      if (isEditMode) {
        // 요구사항 수정
        const updateData = {
          title: formData.title,
          description: formData.description,
          status: formData.status,
          priority: formData.priority,
          requester: formData.requester,
          modifier: formData.modifier,
          confirmer: formData.confirmer
        };
        response = await axios.put(`/api/requirements/${requirement.id}`, updateData);
      } else {
        // 요구사항 생성
        const requestData = {
          ...formData,
          projectId,
          parentNumber: parentNumber || null,
          status: formData.status,
          priority: formData.priority
        };
        response = await axios.post('/api/requirements', requestData);
      }
      
      if (response.data.success) {
        onSuccess();
        onClose();
        if (!isEditMode) {
          resetForm();
        }
      } else {
        setError(response.data.message || (isEditMode ? t('requirement.updateFailed') : t('requirement.createFailed')));
      }
    } catch (err: any) {
      console.error(`요구사항 ${isEditMode ? '수정' : '생성'} 실패:`, err);
      setError(err.response?.data?.message || (isEditMode ? t('requirement.updateFailed') : t('requirement.createFailed')));
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
            {isEditMode 
              ? t('requirement.editRequirement') 
              : parentNumber 
                ? `${t('requirement.subRequirementAdd')} (${parentNumber})` 
                : t('requirement.newRequirementAdd')
            }
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
            <h3 className="text-lg font-medium text-gray-900">{t('requirement.basicInfo')}</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('requirement.requirementTitle')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={t('requirement.titlePlaceholder')}
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('requirement.detailDescription')}
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={t('requirement.descriptionPlaceholder')}
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('project.status')}
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
                  {t('requirement.priority')}
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
            <h3 className="text-lg font-medium text-gray-900">{t('requirement.assigneeInfo')}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('requirement.requester')}
                </label>
                <input
                  type="text"
                  value={formData.requester}
                  onChange={(e) => setFormData(prev => ({ ...prev, requester: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={t('requirement.requester')}
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('requirement.modifier')}
                </label>
                <input
                  type="text"
                  value={formData.modifier}
                  onChange={(e) => setFormData(prev => ({ ...prev, modifier: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={t('requirement.modifier')}
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('requirement.confirmer')}
                </label>
                <input
                  type="text"
                  value={formData.confirmer}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmer: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={t('requirement.confirmer')}
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
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors flex items-center"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isEditMode ? t('form.updating') : t('form.creating')}
                </>
              ) : (
                <>
                  <Plus size={16} className="mr-2" />
                  {isEditMode ? t('requirement.updatingRequirement') : t('requirement.creatingRequirement')}
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