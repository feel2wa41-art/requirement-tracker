import mongoose, { Schema, Document } from 'mongoose';

export interface IRequirement extends Document {
  id: number;
  number: string; // "1.0", "1.1", "1.1.1"
  title: string;
  description?: string;
  status: '요청' | '검토중' | '진행중' | '완료' | '보류' | '취소';
  priority: '높음' | '보통' | '낮음';
  requester?: string;
  requestDate?: Date;
  modifier?: string;
  modifyDate?: Date;
  confirmer?: string;
  confirmDate?: Date;
  parentId?: number | null;
  subRequirements: IRequirement[];
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
  createdAt: Date;
  updatedAt: Date;
}

const requirementSchema = new Schema<IRequirement>({
  id: { type: Number, required: true },
  number: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  status: { 
    type: String, 
    enum: ['요청', '검토중', '진행중', '완료', '보류', '취소'], 
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
  subRequirements: [{ type: Schema.Types.Mixed }]
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
  } catch (error) {
    console.error('Pre-save middleware error:', error);
    next(error);
  }
});

export const Project = mongoose.model<IProject>('Project', projectSchema);