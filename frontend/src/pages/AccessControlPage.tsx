import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Users, 
  Shield, 
  Edit, 
  Trash2, 
  Plus, 
  Save, 
  X,
  Search,
  Eye,
  EyeOff
} from 'lucide-react';

interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'user';
  permissions: string[];
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

const mockUsers: User[] = [
  {
    id: '1',
    username: 'admin',
    name: '관리자',
    email: 'admin@company.com',
    role: 'admin',
    permissions: ['all'],
    isActive: true,
    createdAt: '2024-01-01',
    lastLoginAt: '2024-01-15'
  },
  {
    id: '2',
    username: 'manager1',
    name: '김관리',
    email: 'manager@company.com',
    role: 'manager',
    permissions: ['project.read', 'project.write', 'requirement.read', 'requirement.write', 'report.read'],
    isActive: true,
    createdAt: '2024-01-02',
    lastLoginAt: '2024-01-14'
  },
  {
    id: '3',
    username: 'user1',
    name: '이사용',
    email: 'user@company.com',
    role: 'user',
    permissions: ['project.read', 'requirement.read'],
    isActive: true,
    createdAt: '2024-01-03',
    lastLoginAt: '2024-01-13'
  }
];

const availablePermissions: Permission[] = [
  { id: 'project.read', name: '프로젝트 조회', description: '프로젝트 정보를 조회할 수 있습니다', category: '프로젝트' },
  { id: 'project.write', name: '프로젝트 편집', description: '프로젝트를 생성, 수정, 삭제할 수 있습니다', category: '프로젝트' },
  { id: 'requirement.read', name: '요구사항 조회', description: '요구사항을 조회할 수 있습니다', category: '요구사항' },
  { id: 'requirement.write', name: '요구사항 편집', description: '요구사항을 생성, 수정, 삭제할 수 있습니다', category: '요구사항' },
  { id: 'report.read', name: '보고서 조회', description: '보고서를 조회하고 내보낼 수 있습니다', category: '보고서' },
  { id: 'user.manage', name: '사용자 관리', description: '다른 사용자를 관리할 수 있습니다', category: '관리' },
  { id: 'system.admin', name: '시스템 관리', description: '시스템 설정을 변경할 수 있습니다', category: '관리' }
];

const AccessControlPage: React.FC = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [filteredUsers, setFilteredUsers] = useState<User[]>(mockUsers);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPermissions, setShowPermissions] = useState<{ [userId: string]: boolean }>({});

  useEffect(() => {
    const filtered = users.filter(user => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [users, searchTerm]);

  const getRoleDisplay = (role: string) => {
    const roleMap = {
      admin: '관리자',
      manager: '매니저',
      user: '일반 사용자'
    };
    return roleMap[role as keyof typeof roleMap] || role;
  };

  const getPermissionsByCategory = () => {
    return availablePermissions.reduce((acc, permission) => {
      if (!acc[permission.category]) {
        acc[permission.category] = [];
      }
      acc[permission.category].push(permission);
      return acc;
    }, {} as { [category: string]: Permission[] });
  };

  const handleUserEdit = (user: User) => {
    setSelectedUser({ ...user });
    setIsEditing(true);
  };

  const handleUserSave = () => {
    if (selectedUser) {
      setUsers(prev => prev.map(user => 
        user.id === selectedUser.id ? selectedUser : user
      ));
      setIsEditing(false);
      setSelectedUser(null);
    }
  };

  const handleUserDelete = (userId: string) => {
    if (window.confirm('이 사용자를 삭제하시겠습니까?')) {
      setUsers(prev => prev.filter(user => user.id !== userId));
    }
  };

  const handlePermissionToggle = (permissionId: string) => {
    if (!selectedUser) return;
    
    const newPermissions = selectedUser.permissions.includes(permissionId)
      ? selectedUser.permissions.filter(p => p !== permissionId)
      : [...selectedUser.permissions, permissionId];
    
    setSelectedUser({ ...selectedUser, permissions: newPermissions });
  };

  const toggleShowPermissions = (userId: string) => {
    setShowPermissions(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const permissionsByCategory = getPermissionsByCategory();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">접속 권한 설정</h1>
        <p className="text-gray-600">사용자의 역할과 권한을 관리할 수 있습니다.</p>
      </div>

      {/* 검색 및 필터 */}
      <div className="mb-6 flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="사용자 검색..."
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
          onClick={() => {
            // 새 사용자 추가 로직
            console.log('새 사용자 추가');
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          사용자 추가
        </button>
      </div>

      {/* 사용자 목록 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                사용자
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                역할
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                상태
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                마지막 로그인
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                권한
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                작업
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <React.Fragment key={user.id}>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                          <span className="text-sm font-medium text-white">
                            {user.name.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.role === 'admin' ? 'bg-red-100 text-red-800' :
                      user.role === 'manager' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {getRoleDisplay(user.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.isActive ? '활성' : '비활성'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.lastLoginAt || '없음'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleShowPermissions(user.id)}
                      className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                    >
                      {showPermissions[user.id] ? (
                        <EyeOff className="h-4 w-4 mr-1" />
                      ) : (
                        <Eye className="h-4 w-4 mr-1" />
                      )}
                      {user.permissions.length}개 권한
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleUserEdit(user)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleUserDelete(user.id)}
                      className="text-red-600 hover:text-red-900"
                      disabled={user.role === 'admin'}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
                {showPermissions[user.id] && (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 bg-gray-50">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900 mb-2">보유 권한:</div>
                        <div className="flex flex-wrap gap-2">
                          {user.permissions.includes('all') ? (
                            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                              모든 권한
                            </span>
                          ) : (
                            user.permissions.map(permId => {
                              const perm = availablePermissions.find(p => p.id === permId);
                              return perm ? (
                                <span key={permId} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                  {perm.name}
                                </span>
                              ) : null;
                            })
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* 편집 모달 */}
      {isEditing && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">사용자 권한 편집</h3>
              <button
                onClick={() => setIsEditing(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-4">
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-white font-medium">
                    {selectedUser.name.charAt(0)}
                  </span>
                </div>
                <div className="ml-4">
                  <div className="text-lg font-medium text-gray-900">{selectedUser.name}</div>
                  <div className="text-sm text-gray-500">{selectedUser.email}</div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                역할
              </label>
              <select
                value={selectedUser.role}
                onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="user">일반 사용자</option>
                <option value="manager">매니저</option>
                <option value="admin">관리자</option>
              </select>
            </div>

            <div className="mb-6">
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={selectedUser.isActive}
                  onChange={(e) => setSelectedUser({ ...selectedUser, isActive: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                  계정 활성화
                </label>
              </div>
            </div>

            {selectedUser.role !== 'admin' && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3">개별 권한 설정</h4>
                {Object.entries(permissionsByCategory).map(([category, permissions]) => (
                  <div key={category} className="mb-4">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">{category}</h5>
                    <div className="space-y-2">
                      {permissions.map(permission => (
                        <div key={permission.id} className="flex items-start">
                          <div className="flex items-center h-5">
                            <input
                              type="checkbox"
                              id={permission.id}
                              checked={selectedUser.permissions.includes(permission.id)}
                              onChange={() => handlePermissionToggle(permission.id)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                          </div>
                          <div className="ml-3">
                            <label htmlFor={permission.id} className="text-sm font-medium text-gray-700">
                              {permission.name}
                            </label>
                            <p className="text-xs text-gray-500">{permission.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                취소
              </button>
              <button
                onClick={handleUserSave}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center"
              >
                <Save className="h-4 w-4 mr-2" />
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccessControlPage;