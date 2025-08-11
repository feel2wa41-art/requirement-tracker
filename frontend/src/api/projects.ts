import { api, ApiError } from './client';
import type { 
  Project, 
  CreateProjectRequest, 
  UpdateProjectRequest,
  CreateRequirementRequest,
  UpdateRequirementRequest
} from '../types/project';

/**
 * 프로젝트 관련 API 함수들
 */
export const projectsApi = {
  /**
   * 모든 프로젝트 목록을 조회합니다
   */
  async getProjects(): Promise<Project[]> {
    try {
      const { data } = await api.get<Project[]>('/projects');
      return data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || '프로젝트 목록 조회에 실패했습니다.');
    }
  },

  /**
   * 특정 프로젝트를 ID로 조회합니다
   */
  async getProject(id: number): Promise<Project> {
    try {
      const { data } = await api.get<Project>(`/projects/${id}`);
      return data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('프로젝트를 찾을 수 없습니다.');
      }
      throw new Error(error.response?.data?.error || '프로젝트 조회에 실패했습니다.');
    }
  },

  /**
   * 새 프로젝트를 생성합니다
   */
  async createProject(payload: CreateProjectRequest): Promise<Project> {
    try {
      const { data } = await api.post<Project>('/projects', payload);
      return data;
    } catch (error: any) {
      if (error.response?.status === 400) {
        throw new Error(error.response.data?.error || '필수 정보가 누락되었습니다.');
      }
      throw new Error(error.response?.data?.error || '프로젝트 생성에 실패했습니다.');
    }
  },

  /**
   * 프로젝트 정보를 수정합니다 (상세 정보 포함)
   */
  async updateProject(id: number, payload: UpdateProjectRequest): Promise<Project> {
    try {
      const { data } = await api.put<Project>(`/projects/${id}`, payload);
      return data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('프로젝트를 찾을 수 없습니다.');
      }
      throw new Error(error.response?.data?.error || '프로젝트 수정에 실패했습니다.');
    }
  },

  /**
   * 프로젝트를 삭제합니다
   */
  async deleteProject(id: number): Promise<void> {
    try {
      await api.delete(`/projects/${id}`);
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('프로젝트를 찾을 수 없습니다.');
      }
      throw new Error(error.response?.data?.error || '프로젝트 삭제에 실패했습니다.');
    }
  },
};

/**
 * 요구사항 관련 API 함수들
 */
export const requirementsApi = {
  /**
   * 프로젝트에 새 요구사항을 추가합니다
   */
  async addRequirement(projectId: number, payload: CreateRequirementRequest): Promise<Project> {
    try {
      const { data } = await api.post<Project>(`/projects/${projectId}/requirements`, payload);
      return data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('프로젝트를 찾을 수 없습니다.');
      } else if (error.response?.status === 400) {
        throw new Error(error.response.data?.error || '요구사항 정보가 올바르지 않습니다.');
      }
      throw new Error(error.response?.data?.error || '요구사항 추가에 실패했습니다.');
    }
  },

  /**
   * 요구사항을 수정합니다
   */
  async updateRequirement(
    projectId: number, 
    requirementId: number, 
    payload: UpdateRequirementRequest
  ): Promise<Project> {
    try {
      const { data } = await api.put<Project>(
        `/projects/${projectId}/requirements/${requirementId}`, 
        payload
      );
      return data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('프로젝트 또는 요구사항을 찾을 수 없습니다.');
      }
      throw new Error(error.response?.data?.error || '요구사항 수정에 실패했습니다.');
    }
  },

  /**
   * 요구사항을 삭제합니다 (하위 요구사항도 함께 삭제)
   */
  async deleteRequirement(projectId: number, requirementId: number): Promise<Project> {
    try {
      const { data } = await api.delete<Project>(
        `/projects/${projectId}/requirements/${requirementId}`
      );
      return data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('프로젝트 또는 요구사항을 찾을 수 없습니다.');
      }
      throw new Error(error.response?.data?.error || '요구사항 삭제에 실패했습니다.');
    }
  },
};

// 통합 API 객체 (기존 코드와의 호환성을 위해)
export const api_legacy = {
  // 프로젝트 관련
  getProjects: projectsApi.getProjects,
  createProject: projectsApi.createProject,
  updateProject: projectsApi.updateProject,
  deleteProject: projectsApi.deleteProject,
  
  // 요구사항 관련
  addRequirement: requirementsApi.addRequirement,
  updateRequirement: requirementsApi.updateRequirement,
  deleteRequirement: requirementsApi.deleteRequirement,
};

// 기본 export (기존 코드 호환성)
export const getProjects = projectsApi.getProjects;
export const createProject = projectsApi.createProject;
export const addRequirement = requirementsApi.addRequirement;

export default {
  projects: projectsApi,
  requirements: requirementsApi,
};