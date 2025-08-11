// 기본 열거형 타입들
export type RequirementStatus = '요청' | '검토중' | '진행중' | '완료' | '보류' | '취소';
export type RequirementPriority = '높음' | '보통' | '낮음';
export type ProjectStatus = '진행중' | '완료' | '보류';

// 요구사항 인터페이스
export interface Requirement {
  id: number;
  number: string; // "1.0", "1.1", "1.1.1"
  title: string;
  description?: string;
  status: RequirementStatus;
  priority: RequirementPriority;
  requester?: string;
  requestDate?: string;
  modifier?: string;
  modifyDate?: string;
  confirmer?: string;
  confirmDate?: string;
  parentId?: number | null;
  subRequirements: Requirement[];
}

// 프로젝트 상세 기록 인터페이스 (신규 추가)
export interface ProjectDetails {
  frontend: {
    enabled: boolean;
    description?: string;
  };
  backend: {
    enabled: boolean;
    description?: string;
  };
  platform: string[]; // ['웹', '모바일', '데스크톱']
  ideTools: string[]; // ['VSCode', 'IntelliJ', 'WebStorm']
  developmentEnvironment: {
    frameworks: string[];
    libraries: string[];
    versions: Record<string, string>; // { "react": "18.0", "node": "18.x" }
  };
  hasSpecification: boolean; // 기획서 작성 여부
  screenNames: string[]; // 관련 화면 이름 리스트
}

// 프로젝트 인터페이스
export interface Project {
  id: number;
  name: string;
  description?: string;
  requester: string;
  modifier: string;
  confirmer: string;
  status: ProjectStatus;
  requirements: Requirement[];
  details: ProjectDetails; // 프로젝트 상세 기록 (신규 추가)
  createdAt: string;
  updatedAt: string;
}

// API 요청/응답 타입들
export interface CreateProjectRequest {
  name: string;
  description?: string;
  requester: string;
  modifier: string;
  confirmer: string;
  details?: Partial<ProjectDetails>;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  requester?: string;
  modifier?: string;
  confirmer?: string;
  status?: ProjectStatus;
  details?: Partial<ProjectDetails>;
}

export interface CreateRequirementRequest {
  title: string;
  description?: string;
  parentId?: number | null;
  priority?: RequirementPriority;
  requester?: string;
}

export interface UpdateRequirementRequest {
  title?: string;
  description?: string;
  status?: RequirementStatus;
  priority?: RequirementPriority;
  modifier?: string;
  confirmer?: string;
}

// UI 상태 관리 타입들
export interface User {
  name: string;
  role: 'admin' | 'manager' | 'user';
}

export interface ProjectFormData {
  name: string;
  description: string;
  requester: string;
  modifier: string;
  confirmer: string;
}

// 상수 객체들
export const REQUIREMENT_STATUSES: Record<RequirementStatus, string> = {
  '요청': 'requested',
  '검토중': 'reviewing',
  '진행중': 'in-progress',
  '완료': 'completed',
  '보류': 'on-hold',
  '취소': 'cancelled'
};

export const REQUIREMENT_PRIORITIES: Record<RequirementPriority, string> = {
  '높음': 'high',
  '보통': 'medium',
  '낮음': 'low'
};

export const PROJECT_STATUSES: Record<ProjectStatus, string> = {
  '진행중': 'in-progress',
  '완료': 'completed',
  '보류': 'on-hold'
};