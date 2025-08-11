import mongoose, { Schema, Document } from 'mongoose';

export interface IRequirement extends Document {
  id: number;
  projectId: number;
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
  parentNumber?: string | null; // 부모 요구사항의 number
  level: number; // 트리 레벨 (0: 루트, 1: 1단계 하위, 2: 2단계 하위...)
  sortOrder: number; // 같은 레벨 내에서의 정렬 순서
  isExpanded: boolean; // UI에서 펼침/접힘 상태
  createdAt: Date;
  updatedAt: Date;
}

const requirementSchema = new Schema<IRequirement>({
  id: { type: Number, required: true, unique: true },
  projectId: { type: Number, required: true },
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
  parentNumber: { type: String, default: null },
  level: { type: Number, default: 0 },
  sortOrder: { type: Number, default: 0 },
  isExpanded: { type: Boolean, default: true }
}, {
  timestamps: true
});

// 요구사항 ID 자동 증가를 위한 미들웨어
requirementSchema.pre('save', async function(next) {
  try {
    if (this.isNew && (this.id === undefined || this.id === null)) {
      const lastRequirement = await mongoose.connection.collection('requirements').findOne({}, { sort: { id: -1 } });
      this.id = lastRequirement ? (lastRequirement.id + 1) : 1;
      console.log('Generated new requirement ID:', this.id);
    }
    next();
  } catch (error) {
    console.error('Pre-save middleware error:', error);
    next(error);
  }
});

// 요구사항 번호 생성 헬퍼 메서드
requirementSchema.statics.generateNumber = async function(projectId: number, parentNumber?: string) {
  if (!parentNumber) {
    // 루트 레벨 번호 생성 (1.0, 2.0, 3.0...)
    const maxRootRequirement = await this.findOne({
      projectId,
      level: 0
    }).sort({ sortOrder: -1 });
    
    const nextNumber = maxRootRequirement ? maxRootRequirement.sortOrder + 1 : 1;
    return `${nextNumber}.0`;
  } else {
    // 하위 요구사항 번호 생성 (1.1, 1.2, 1.1.1...)
    const parent = await this.findOne({ projectId, number: parentNumber });
    if (!parent) {
      throw new Error('Parent requirement not found');
    }
    
    // 같은 부모 하위의 최대 번호 찾기
    const parentPrefix = parentNumber;
    const siblingRequirements = await this.find({
      projectId,
      parentNumber,
      level: parent.level + 1
    }).sort({ sortOrder: -1 });
    
    const nextOrder = siblingRequirements.length > 0 ? siblingRequirements[0].sortOrder + 1 : 1;
    
    // 부모 번호가 "1.0"이면 "1.1", "1.2"...
    // 부모 번호가 "1.1"이면 "1.1.1", "1.1.2"...
    if (parentPrefix.endsWith('.0')) {
      return `${parentPrefix.slice(0, -1)}${nextOrder}`;
    } else {
      return `${parentPrefix}.${nextOrder}`;
    }
  }
};

// 하위 요구사항 조회 헬퍼 메서드
requirementSchema.statics.findWithChildren = async function(projectId: number) {
  const requirements = await this.find({ projectId }).sort({ level: 1, sortOrder: 1 });
  
  // 트리 구조로 변환
  const buildTree = (parentId: number | null = null, level: number = 0): any[] => {
    return requirements
      .filter((req: any) => req.parentId === parentId && req.level === level)
      .map((req: any) => ({
        ...req.toObject(),
        children: buildTree(req.id, level + 1)
      }));
  };
  
  return buildTree();
};

export const Requirement = mongoose.model<IRequirement>('Requirement', requirementSchema);