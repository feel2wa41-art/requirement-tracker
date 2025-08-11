import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import axios from 'axios';

interface ProjectFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ProjectForm: React.FC<ProjectFormProps> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    requester: '',
    modifier: '',
    confirmer: '',
    details: {
      frontend: {
        enabled: false,
        description: ''
      },
      backend: {
        enabled: false,
        description: ''
      },
      platform: [] as string[],
      ideTools: [] as string[],
      developmentEnvironment: {
        frameworks: [] as string[],
        libraries: [] as string[],
        versions: {} as Record<string, string>
      },
      hasSpecification: false,
      screenNames: [] as string[]
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 플랫폼 옵션
  const platformOptions = ['웹', '모바일', '데스크톱', 'API'];
  
  // IDE 도구 옵션
  const ideToolOptions = ['VSCode', 'IntelliJ IDEA', 'WebStorm', 'Eclipse', 'Sublime Text', 'Atom'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 필수 필드 검증
    if (!formData.name.trim() || !formData.requester.trim() || !formData.modifier.trim() || !formData.confirmer.trim()) {
      setError('프로젝트 이름, 요구자, 수정자, 확인자는 필수입니다.');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('/api/projects', formData);
      
      if (response.data.success) {
        onSuccess();
        onClose();
        resetForm();
      } else {
        setError(response.data.message || '프로젝트 생성에 실패했습니다.');
      }
    } catch (err: any) {
      console.error('프로젝트 생성 실패:', err);
      setError(err.response?.data?.message || '프로젝트 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      requester: '',
      modifier: '',
      confirmer: '',
      details: {
        frontend: {
          enabled: false,
          description: ''
        },
        backend: {
          enabled: false,
          description: ''
        },
        platform: [],
        ideTools: [],
        developmentEnvironment: {
          frameworks: [],
          libraries: [],
          versions: {}
        },
        hasSpecification: false,
        screenNames: []
      }
    });
    setError(null);
  };

  const handleClose = () => {
    if (!loading) {
      resetForm();
      onClose();
    }
  };

  const handlePlatformToggle = (platform: string) => {
    const platforms = formData.details.platform;
    const newPlatforms = platforms.includes(platform)
      ? platforms.filter(p => p !== platform)
      : [...platforms, platform];
    
    setFormData(prev => ({
      ...prev,
      details: {
        ...prev.details,
        platform: newPlatforms
      }
    }));
  };

  const handleIdeToolToggle = (tool: string) => {
    const tools = formData.details.ideTools;
    const newTools = tools.includes(tool)
      ? tools.filter(t => t !== tool)
      : [...tools, tool];
    
    setFormData(prev => ({
      ...prev,
      details: {
        ...prev.details,
        ideTools: newTools
      }
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">새 프로젝트 추가</h2>
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
                프로젝트 이름 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="프로젝트 이름을 입력하세요"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                설명
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="프로젝트 설명을 입력하세요 (선택사항)"
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  요구자 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.requester}
                  onChange={(e) => setFormData(prev => ({ ...prev, requester: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="요구자"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  수정자 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.modifier}
                  onChange={(e) => setFormData(prev => ({ ...prev, modifier: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="수정자"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  확인자 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.confirmer}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmer: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="확인자"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* 개발 영역 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">개발 영역</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="frontend"
                    checked={formData.details.frontend.enabled}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      details: {
                        ...prev.details,
                        frontend: {
                          ...prev.details.frontend,
                          enabled: e.target.checked
                        }
                      }
                    }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    disabled={loading}
                  />
                  <label htmlFor="frontend" className="text-sm font-medium text-gray-700">
                    Front-end 개발
                  </label>
                </div>
                {formData.details.frontend.enabled && (
                  <input
                    type="text"
                    value={formData.details.frontend.description}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      details: {
                        ...prev.details,
                        frontend: {
                          ...prev.details.frontend,
                          description: e.target.value
                        }
                      }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Front-end 상세 설명"
                    disabled={loading}
                  />
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="backend"
                    checked={formData.details.backend.enabled}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      details: {
                        ...prev.details,
                        backend: {
                          ...prev.details.backend,
                          enabled: e.target.checked
                        }
                      }
                    }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    disabled={loading}
                  />
                  <label htmlFor="backend" className="text-sm font-medium text-gray-700">
                    Back-end 개발
                  </label>
                </div>
                {formData.details.backend.enabled && (
                  <input
                    type="text"
                    value={formData.details.backend.description}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      details: {
                        ...prev.details,
                        backend: {
                          ...prev.details.backend,
                          description: e.target.value
                        }
                      }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Back-end 상세 설명"
                    disabled={loading}
                  />
                )}
              </div>
            </div>
          </div>

          {/* 플랫폼 선택 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">플랫폼</h3>
            <div className="flex flex-wrap gap-2">
              {platformOptions.map((platform) => (
                <button
                  key={platform}
                  type="button"
                  onClick={() => handlePlatformToggle(platform)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    formData.details.platform.includes(platform)
                      ? 'bg-blue-100 text-blue-800 border-blue-300'
                      : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                  } border`}
                  disabled={loading}
                >
                  {platform}
                </button>
              ))}
            </div>
          </div>

          {/* IDE 도구 선택 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">IDE 도구</h3>
            <div className="flex flex-wrap gap-2">
              {ideToolOptions.map((tool) => (
                <button
                  key={tool}
                  type="button"
                  onClick={() => handleIdeToolToggle(tool)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    formData.details.ideTools.includes(tool)
                      ? 'bg-green-100 text-green-800 border-green-300'
                      : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                  } border`}
                  disabled={loading}
                >
                  {tool}
                </button>
              ))}
            </div>
          </div>

          {/* 기획서 작성 여부 */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="hasSpecification"
                checked={formData.details.hasSpecification}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  details: {
                    ...prev.details,
                    hasSpecification: e.target.checked
                  }
                }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                disabled={loading}
              />
              <label htmlFor="hasSpecification" className="text-sm font-medium text-gray-700">
                기획서 작성 여부
              </label>
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
                  프로젝트 생성
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectForm;