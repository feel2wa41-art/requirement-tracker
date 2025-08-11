import React, { useState } from 'react';
import { Save, Plus, X, Monitor, Server, Smartphone, Code, FileText, CheckCircle } from 'lucide-react';
import type { Project, ProjectDetails as ProjectDetailsType, User } from '../types/project';
import { projectsApi } from '../api/projects';

interface Props {
  project: Project;
  onUpdate: () => void;
  userRole: User['role'];
}

const ProjectDetails: React.FC<Props> = ({ project, onUpdate, userRole }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState<ProjectDetailsType>(
    project.details || {
      frontend: { enabled: false, description: '' },
      backend: { enabled: false, description: '' },
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
  );

  const canEdit = userRole === 'admin' || userRole === 'manager';

  // 플랫폼 옵션들
  const platformOptions = ['웹', '모바일', 'iOS', 'Android', '데스크톱', 'Windows', 'macOS', 'Linux'];
  
  // IDE 도구 옵션들
  const ideToolOptions = ['VSCode', 'IntelliJ IDEA', 'WebStorm', 'PyCharm', 'Eclipse', 'Xcode', 'Android Studio', 'Visual Studio'];

  // 일반적인 프레임워크들
  const frameworkOptions = ['React', 'Vue.js', 'Angular', 'Next.js', 'Nuxt.js', 'Express', 'NestJS', 'Django', 'Flask', 'Spring Boot', 'Laravel'];

  // 일반적인 라이브러리들
  const libraryOptions = ['Axios', 'Lodash', 'Moment.js', 'Chart.js', 'D3.js', 'jQuery', 'Bootstrap', 'Tailwind CSS', 'Material-UI', 'Ant Design'];

  const handleSave = async () => {
    try {
      setLoading(true);
      await projectsApi.updateProject(project.id, {
        details: details
      });
      setIsEditing(false);
      onUpdate(); // 부모 컴포넌트의 데이터 새로고침
    } catch (error: any) {
      console.error('프로젝트 상세 정보 저장 실패:', error);
      alert(error.message || '저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setDetails(project.details || {
      frontend: { enabled: false, description: '' },
      backend: { enabled: false, description: '' },
      platform: [],
      ideTools: [],
      developmentEnvironment: {
        frameworks: [],
        libraries: [],
        versions: {}
      },
      hasSpecification: false,
      screenNames: []
    });
    setIsEditing(false);
  };

  // 배열 항목 추가/제거 헬퍼 함수들
  const addArrayItem = (field: 'platform' | 'ideTools' | 'screenNames', value: string) => {
    if (field === 'screenNames') {
      setDetails(prev => ({
        ...prev,
        [field]: [...prev[field], value]
      }));
    } else {
      setDetails(prev => ({
        ...prev,
        [field]: [...prev[field], value]
      }));
    }
  };

  const removeArrayItem = (field: 'platform' | 'ideTools' | 'screenNames', index: number) => {
    setDetails(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const addFramework = (value: string) => {
    setDetails(prev => ({
      ...prev,
      developmentEnvironment: {
        ...prev.developmentEnvironment,
        frameworks: [...prev.developmentEnvironment.frameworks, value]
      }
    }));
  };

  const removeFramework = (index: number) => {
    setDetails(prev => ({
      ...prev,
      developmentEnvironment: {
        ...prev.developmentEnvironment,
        frameworks: prev.developmentEnvironment.frameworks.filter((_, i) => i !== index)
      }
    }));
  };

  const addLibrary = (value: string) => {
    setDetails(prev => ({
      ...prev,
      developmentEnvironment: {
        ...prev.developmentEnvironment,
        libraries: [...prev.developmentEnvironment.libraries, value]
      }
    }));
  };

  const removeLibrary = (index: number) => {
    setDetails(prev => ({
      ...prev,
      developmentEnvironment: {
        ...prev.developmentEnvironment,
        libraries: prev.developmentEnvironment.libraries.filter((_, i) => i !== index)
      }
    }));
  };

  const updateVersion = (key: string, value: string) => {
    setDetails(prev => ({
      ...prev,
      developmentEnvironment: {
        ...prev.developmentEnvironment,
        versions: {
          ...prev.developmentEnvironment.versions,
          [key]: value
        }
      }
    }));
  };

  const removeVersion = (key: string) => {
    setDetails(prev => {
      const { [key]: removed, ...rest } = prev.developmentEnvironment.versions;
      return {
        ...prev,
        developmentEnvironment: {
          ...prev.developmentEnvironment,
          versions: rest
        }
      };
    });
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-secondary-900">
          프로젝트 상세 정보
        </h3>
        {canEdit && (
          <div className="flex space-x-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className="btn-outline"
                >
                  취소
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="btn-primary"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      저장 중...
                    </>
                  ) : (
                    <>
                      <Save size={16} className="mr-2" />
                      저장
                    </>
                  )}
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="btn-primary"
              >
                수정
              </button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 개발 영역 */}
        <div className="card p-6">
          <h4 className="text-lg font-medium text-secondary-900 mb-4 flex items-center">
            <Code size={20} className="mr-2" />
            개발 영역
          </h4>

          <div className="space-y-4">
            {/* 프론트엔드 */}
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                <Monitor size={18} className="text-blue-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <label className="text-sm font-medium text-secondary-700">
                    Front-end 개발
                  </label>
                  {isEditing ? (
                    <input
                      type="checkbox"
                      checked={details.frontend.enabled}
                      onChange={(e) => setDetails(prev => ({
                        ...prev,
                        frontend: { ...prev.frontend, enabled: e.target.checked }
                      }))}
                      className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                    />
                  ) : (
                    <span className={`badge ${details.frontend.enabled ? 'badge-success' : 'badge-secondary'}`}>
                      {details.frontend.enabled ? '예' : '아니오'}
                    </span>
                  )}
                </div>
                {(details.frontend.enabled || isEditing) && (
                  <>
                    {isEditing ? (
                      <textarea
                        value={details.frontend.description}
                        onChange={(e) => setDetails(prev => ({
                          ...prev,
                          frontend: { ...prev.frontend, description: e.target.value }
                        }))}
                        placeholder="프론트엔드 개발에 대한 상세 설명..."
                        rows={2}
                        className="textarea text-sm"
                      />
                    ) : (
                      details.frontend.description && (
                        <p className="text-sm text-secondary-600">
                          {details.frontend.description}
                        </p>
                      )
                    )}
                  </>
                )}
              </div>
            </div>

            {/* 백엔드 */}
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                <Server size={18} className="text-green-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <label className="text-sm font-medium text-secondary-700">
                    Back-end 개발
                  </label>
                  {isEditing ? (
                    <input
                      type="checkbox"
                      checked={details.backend.enabled}
                      onChange={(e) => setDetails(prev => ({
                        ...prev,
                        backend: { ...prev.backend, enabled: e.target.checked }
                      }))}
                      className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                    />
                  ) : (
                    <span className={`badge ${details.backend.enabled ? 'badge-success' : 'badge-secondary'}`}>
                      {details.backend.enabled ? '예' : '아니오'}
                    </span>
                  )}
                </div>
                {(details.backend.enabled || isEditing) && (
                  <>
                    {isEditing ? (
                      <textarea
                        value={details.backend.description}
                        onChange={(e) => setDetails(prev => ({
                          ...prev,
                          backend: { ...prev.backend, description: e.target.value }
                        }))}
                        placeholder="백엔드 개발에 대한 상세 설명..."
                        rows={2}
                        className="textarea text-sm"
                      />
                    ) : (
                      details.backend.description && (
                        <p className="text-sm text-secondary-600">
                          {details.backend.description}
                        </p>
                      )
                    )}
                  </>
                )}
              </div>
            </div>

            {/* 기획서 작성 여부 */}
            <div className="flex items-center space-x-3">
              <FileText size={18} className="text-purple-500" />
              <label className="text-sm font-medium text-secondary-700">
                기획서 작성 여부
              </label>
              {isEditing ? (
                <input
                  type="checkbox"
                  checked={details.hasSpecification}
                  onChange={(e) => setDetails(prev => ({
                    ...prev,
                    hasSpecification: e.target.checked
                  }))}
                  className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                />
              ) : (
                <span className={`badge ${details.hasSpecification ? 'badge-success' : 'badge-secondary'}`}>
                  {details.hasSpecification ? '작성함' : '작성 안함'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 플랫폼 및 도구 */}
        <div className="card p-6">
          <h4 className="text-lg font-medium text-secondary-900 mb-4 flex items-center">
            <Smartphone size={20} className="mr-2" />
            플랫폼 및 도구
          </h4>

          <div className="space-y-4">
            {/* 플랫폼 */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                플랫폼
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {details.platform.map((platform, index) => (
                  <span key={index} className="badge badge-primary flex items-center">
                    {platform}
                    {isEditing && (
                      <button
                        onClick={() => removeArrayItem('platform', index)}
                        className="ml-1 hover:text-error-600"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </span>
                ))}
              </div>
              {isEditing && (
                <div className="flex space-x-2">
                  <select
                    onChange={(e) => {
                      if (e.target.value && !details.platform.includes(e.target.value)) {
                        addArrayItem('platform', e.target.value);
                        e.target.value = '';
                      }
                    }}
                    className="select text-sm"
                  >
                    <option value="">플랫폼 선택...</option>
                    {platformOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* IDE 도구 */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                IDE 도구
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {details.ideTools.map((tool, index) => (
                  <span key={index} className="badge badge-warning flex items-center">
                    {tool}
                    {isEditing && (
                      <button
                        onClick={() => removeArrayItem('ideTools', index)}
                        className="ml-1 hover:text-error-600"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </span>
                ))}
              </div>
              {isEditing && (
                <div className="flex space-x-2">
                  <select
                    onChange={(e) => {
                      if (e.target.value && !details.ideTools.includes(e.target.value)) {
                        addArrayItem('ideTools', e.target.value);
                        e.target.value = '';
                      }
                    }}
                    className="select text-sm"
                  >
                    <option value="">IDE 도구 선택...</option>
                    {ideToolOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 개발 환경 설정 */}
      <div className="card p-6">
        <h4 className="text-lg font-medium text-secondary-900 mb-4">
          개발 환경 설정
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 프레임워크 */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              프레임워크
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {details.developmentEnvironment.frameworks.map((framework, index) => (
                <span key={index} className="badge badge-success flex items-center">
                  {framework}
                  {isEditing && (
                    <button
                      onClick={() => removeFramework(index)}
                      className="ml-1 hover:text-error-600"
                    >
                      <X size={14} />
                    </button>
                  )}
                </span>
              ))}
            </div>
            {isEditing && (
              <select
                onChange={(e) => {
                  if (e.target.value && !details.developmentEnvironment.frameworks.includes(e.target.value)) {
                    addFramework(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="select text-sm"
              >
                <option value="">프레임워크 선택...</option>
                {frameworkOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            )}
          </div>

          {/* 라이브러리 */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              라이브러리
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {details.developmentEnvironment.libraries.map((library, index) => (
                <span key={index} className="badge badge-secondary flex items-center">
                  {library}
                  {isEditing && (
                    <button
                      onClick={() => removeLibrary(index)}
                      className="ml-1 hover:text-error-600"
                    >
                      <X size={14} />
                    </button>
                  )}
                </span>
              ))}
            </div>
            {isEditing && (
              <select
                onChange={(e) => {
                  if (e.target.value && !details.developmentEnvironment.libraries.includes(e.target.value)) {
                    addLibrary(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="select text-sm"
              >
                <option value="">라이브러리 선택...</option>
                {libraryOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* 버전 정보 */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-secondary-700 mb-2">
            버전 정보
          </label>
          <div className="space-y-2">
            {Object.entries(details.developmentEnvironment.versions).map(([key, value]) => (
              <div key={key} className="flex items-center space-x-2">
                <span className="text-sm font-medium text-secondary-600 w-24">{key}:</span>
                {isEditing ? (
                  <>
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => updateVersion(key, e.target.value)}
                      className="input text-sm"
                    />
                    <button
                      onClick={() => removeVersion(key)}
                      className="text-error-500 hover:text-error-700"
                    >
                      <X size={16} />
                    </button>
                  </>
                ) : (
                  <span className="text-sm text-secondary-900">{value}</span>
                )}
              </div>
            ))}
          </div>
          {isEditing && (
            <div className="mt-2 flex space-x-2">
              <input
                type="text"
                placeholder="기술명"
                className="input text-sm w-32"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const target = e.target as HTMLInputElement;
                    const nextSibling = target.nextElementSibling as HTMLInputElement;
                    if (target.value && nextSibling.value) {
                      updateVersion(target.value, nextSibling.value);
                      target.value = '';
                      nextSibling.value = '';
                    }
                  }
                }}
              />
              <input
                type="text"
                placeholder="버전"
                className="input text-sm w-32"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const target = e.target as HTMLInputElement;
                    const prevSibling = target.previousElementSibling as HTMLInputElement;
                    if (target.value && prevSibling.value) {
                      updateVersion(prevSibling.value, target.value);
                      target.value = '';
                      prevSibling.value = '';
                    }
                  }
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* 화면명 */}
      <div className="card p-6">
        <h4 className="text-lg font-medium text-secondary-900 mb-4">
          관련 화면명
        </h4>
        <div className="flex flex-wrap gap-2 mb-4">
          {details.screenNames.map((screenName, index) => (
            <span key={index} className="badge badge-primary flex items-center">
              {screenName}
              {isEditing && (
                <button
                  onClick={() => removeArrayItem('screenNames', index)}
                  className="ml-1 hover:text-error-600"
                >
                  <X size={14} />
                </button>
              )}
            </span>
          ))}
        </div>
        {isEditing && (
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="화면명을 입력하세요"
              className="input text-sm"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  const target = e.target as HTMLInputElement;
                  if (target.value.trim()) {
                    addArrayItem('screenNames', target.value.trim());
                    target.value = '';
                  }
                }
              }}
            />
            <button
              onClick={(e) => {
                const input = (e.target as HTMLElement).parentElement?.querySelector('input') as HTMLInputElement;
                if (input && input.value.trim()) {
                  addArrayItem('screenNames', input.value.trim());
                  input.value = '';
                }
              }}
              className="btn-outline"
            >
              <Plus size={16} />
            </button>
          </div>
        )}
        {details.screenNames.length === 0 && !isEditing && (
          <p className="text-sm text-secondary-500">등록된 화면명이 없습니다.</p>
        )}
      </div>
    </div>
  );
};

export default ProjectDetails;