import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import type { Project } from '../types/project';

interface Props {
  projects: Project[];
  selectedProjectId: number | null;
  onSelect: (id: number) => void;
  onAddProject: (payload: {
    name: string;
    description?: string;
    requester: string;
    modifier: string;
    confirmer: string;
  }) => Promise<void>;
}

interface ProjectFormData {
  name: string;
  description: string;
  requester: string;
  modifier: string;
  confirmer: string;
}

const ProjectSelector: React.FC<Props> = ({ 
  projects, 
  selectedProjectId, 
  onSelect, 
  onAddProject 
}) => {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<ProjectFormData>({
    name: '',
    description: '',
    requester: '',
    modifier: '',
    confirmer: ''
  });

  const handleInputChange = (field: keyof ProjectFormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    const { name, requester, modifier, confirmer } = form;
    
    if (!name.trim() || !requester.trim() || !modifier.trim() || !confirmer.trim()) {
      alert('프로젝트 이름, 요구자, 수정자, 확인자는 필수 입력 항목입니다.');
      return;
    }

    try {
      setLoading(true);
      await onAddProject({
        name: name.trim(),
        description: form.description.trim() || undefined,
        requester: requester.trim(),
        modifier: modifier.trim(),
        confirmer: confirmer.trim()
      });
      
      // 성공시 폼 초기화 및 모달 닫기
      setForm({
        name: '',
        description: '',
        requester: '',
        modifier: '',
        confirmer: ''
      });
      setShowModal(false);
    } catch (error) {
      // 에러는 부모 컴포넌트에서 처리
      console.error('프로젝트 생성 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setForm({
      name: '',
      description: '',
      requester: '',
      modifier: '',
      confirmer: ''
    });
    setShowModal(false);
  };

  return (
    <>
      <div className="card p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-secondary-900">
              프로젝트 선택
            </h2>
            {projects.length > 0 && (
              <select
                value={selectedProjectId || ''}
                onChange={(e) => onSelect(parseInt(e.target.value))}
                className="select max-w-xs"
              >
                <option value="">프로젝트를 선택하세요</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="btn-success"
          >
            <Plus size={16} className="mr-2" />
            프로젝트 추가
          </button>
        </div>

        {projects.length > 0 && (
          <div className="mt-3 text-sm text-secondary-600">
            총 {projects.length}개의 프로젝트가 있습니다.
          </div>
        )}
      </div>

      {/* 프로젝트 추가 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                새 프로젝트 추가
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    프로젝트 이름 <span className="text-error-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="프로젝트 이름을 입력하세요"
                    className="input"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    설명
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="프로젝트에 대한 간단한 설명을 입력하세요 (선택사항)"
                    rows={3}
                    className="textarea"
                    disabled={loading}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      요구자 <span className="text-error-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.requester}
                      onChange={(e) => handleInputChange('requester', e.target.value)}
                      placeholder="요구자"
                      className="input"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      수정자 <span className="text-error-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.modifier}
                      onChange={(e) => handleInputChange('modifier', e.target.value)}
                      placeholder="수정자"
                      className="input"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      확인자 <span className="text-error-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.confirmer}
                      onChange={(e) => handleInputChange('confirmer', e.target.value)}
                      placeholder="확인자"
                      className="input"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className="btn-outline"
                >
                  취소
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="btn-primary"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      생성 중...
                    </>
                  ) : (
                    '생성'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProjectSelector;