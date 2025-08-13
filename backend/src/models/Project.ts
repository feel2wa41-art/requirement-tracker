import mongoose, { Schema, Document } from 'mongoose';

export interface IRequirement extends Document {
  id: number;
  number: string; // "1.0", "1.1", "1.1.1"
  title: string;
  description?: string;
  status: string; // 커스텀 상태값을 지원하기 위해 string으로 변경
  priority: '높음' | '보통' | '낮음';
  requester?: string;
  requestDate?: Date;
  modifier?: string;
  modifyDate?: Date;
  confirmer?: string;
  confirmDate?: Date;
  parentId?: number | null;
  subRequirements: IRequirement[];
  progress?: number; // 진척도 (0-100)
  completionDate?: Date; // 요구사항 완료일
}

// 프로젝트 상세 기록 인터페이스 (신규 추가)
export interface IProjectDetails {
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

// 커스텀 상태 인터페이스
export interface ICustomStatus {
  id: string;
  name: string;
  color: string; // 색상 코드 (예: #ff0000)
  description?: string;
  order: number; // 정렬 순서
  isDefault: boolean; // 기본 상태 여부
}

export interface IProject extends Document {
  id: number;
  name: string;
  description?: string;
  requester: string;
  modifier: string;
  confirmer: string;
  status: '진행중' | '완료' | '보류';
  requirements: IRequirement[];
  details: IProjectDetails; // 프로젝트 상세 기록 (신규 추가)
  customStatuses: ICustomStatus[]; // 프로젝트별 커스텀 상태 (신규 추가)
  completionDate?: Date; // 프로젝트 완료일
  effort: {
    manMonths?: number; // 공수 (M/M)
    manDays?: number; // 공수 (M/D)
  };
  createdAt: Date;
  updatedAt: Date;
}

const customStatusSchema = new Schema<ICustomStatus>({
  id: { type: String, required: true },
  name: { type: String, required: true },
  color: { type: String, required: true },
  description: { type: String, default: '' },
  order: { type: Number, required: true },
  isDefault: { type: Boolean, default: false }
});

const requirementSchema = new Schema<IRequirement>({
  id: { type: Number, required: true },
  number: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  status: { 
    type: String, 
    default: '요청' 
  },
  priority: { 
    type: String, 
    enum: ['높음', '보통', '낮음'], 
    default: '보통' 
  },
  requester: { type: String, default: '' },
  requestDate: { type: Date, default: Date.now },
  modifier: { type: String, default: '' },
  modifyDate: { type: Date },
  confirmer: { type: String, default: '' },
  confirmDate: { type: Date },
  parentId: { type: Number, default: null },
  subRequirements: [{ type: Schema.Types.Mixed }],
  progress: { type: Number, default: 0, min: 0, max: 100 }, // 진척도 (0-100)
  completionDate: { type: Date } // 요구사항 완료일
});

const projectDetailsSchema = new Schema<IProjectDetails>({
  frontend: {
    enabled: { type: Boolean, default: false },
    description: { type: String, default: '' }
  },
  backend: {
    enabled: { type: Boolean, default: false },
    description: { type: String, default: '' }
  },
  platform: [{ type: String }], // ['웹', '모바일', '데스크톱']
  ideTools: [{ type: String }], // ['VSCode', 'IntelliJ', 'WebStorm']
  developmentEnvironment: {
    frameworks: [{ type: String }],
    libraries: [{ type: String }],
    versions: { type: Schema.Types.Mixed, default: {} }
  },
  hasSpecification: { type: Boolean, default: false },
  screenNames: [{ type: String }]
});

const projectSchema = new Schema<IProject>({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  requester: { type: String, required: true },
  modifier: { type: String, required: true },
  confirmer: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['진행중', '완료', '보류'], 
    default: '진행중' 
  },
  requirements: [requirementSchema],
  details: { type: projectDetailsSchema, default: {} },
  customStatuses: { 
    type: [customStatusSchema], 
    default: function() {
      return [
        { id: 'req', name: '요청', color: '#3b82f6', description: '새로운 요구사항 요청', order: 1, isDefault: true },
        { id: 'review', name: '검토중', color: '#f59e0b', description: '요구사항 검토 중', order: 2, isDefault: true },
        { id: 'progress', name: '진행중', color: '#f97316', description: '개발 진행 중', order: 3, isDefault: true },
        { id: 'complete', name: '완료', color: '#10b981', description: '개발 완료', order: 4, isDefault: true },
        { id: 'hold', name: '보류', color: '#6b7280', description: '일시 보류', order: 5, isDefault: true },
        { id: 'cancel', name: '취소', color: '#ef4444', description: '요구사항 취소', order: 6, isDefault: true }
      ];
    }
  },
  completionDate: { type: Date }, // 프로젝트 완료일
  effort: {
    manMonths: { type: Number }, // 공수 (M/M)
    manDays: { type: Number } // 공수 (M/D)
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// 프로젝트 ID 자동 증가를 위한 미들웨어
projectSchema.pre('save', async function(next) {
  try {
    if (this.isNew && (this.id === undefined || this.id === null)) {
      // 마지막 프로젝트의 ID를 조회하여 1 증가
      const lastProject = await mongoose.connection.collection('projects').findOne({}, { sort: { id: -1 } });
      this.id = lastProject ? (lastProject.id + 1) : 1;
      console.log('Generated new project ID:', this.id);
    }
    this.updatedAt = new Date();
    next();
  } catch (error: any) {
    console.error('Pre-save middleware error:', error);
    next(error);
  }
});

export const Project = mongoose.model<IProject>('Project', projectSchema);