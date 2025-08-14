export interface Requirement {
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
  parentId?: number;
  parentNumber?: string | null;
  level: number;
  sortOrder: number;
  isExpanded: boolean;
  children?: Requirement[];
  progress?: number; // 진척도 (0-100)
  completionDate?: string; // 요구사항 완료일
  createdAt: string;
  updatedAt: string;
}

export interface CustomStatus {
  id: string;
  name: string;
  color: string;
  description?: string;
  order: number;
  isDefault: boolean;
}