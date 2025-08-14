import mongoose, { Schema, Document } from 'mongoose';

export interface IRequirementHistory extends Document {
  id: number;
  requirementId: number;
  projectId: number;
  changeType: 'created' | 'status_changed' | 'title_changed' | 'description_changed' | 'priority_changed' | 'assigned' | 'deleted';
  fieldName?: string; // 변경된 필드명
  oldValue?: string; // 이전 값
  newValue?: string; // 새로운 값
  changedBy: string; // 변경한 사용자
  changeReason?: string; // 변경 사유
  timestamp: Date; // 변경 시간
  ipAddress?: string; // 변경자 IP
  userAgent?: string; // 사용자 브라우저 정보
  createdAt: Date;
}

const requirementHistorySchema = new Schema<IRequirementHistory>({
  id: { type: Number, required: true, unique: true },
  requirementId: { type: Number, required: true },
  projectId: { type: Number, required: true },
  changeType: { 
    type: String, 
    enum: ['created', 'status_changed', 'title_changed', 'description_changed', 'priority_changed', 'assigned', 'deleted'],
    required: true 
  },
  fieldName: { type: String },
  oldValue: { type: String },
  newValue: { type: String },
  changedBy: { type: String, required: true },
  changeReason: { type: String },
  timestamp: { type: Date, default: Date.now },
  ipAddress: { type: String },
  userAgent: { type: String }
}, {
  timestamps: true
});

// 히스토리 ID 자동 증가를 위한 미들웨어
requirementHistorySchema.pre('save', async function(next) {
  try {
    if (this.isNew && (this.id === undefined || this.id === null)) {
      const lastHistory = await mongoose.connection.collection('requirementhistories').findOne({}, { sort: { id: -1 } });
      this.id = lastHistory ? (lastHistory.id + 1) : 1;
      console.log('Generated new history ID:', this.id);
    }
    next();
  } catch (error: any) {
    console.error('Pre-save middleware error:', error);
    next(error);
  }
});

// 특정 요구사항의 변경 이력 조회
requirementHistorySchema.statics.findByRequirement = function(requirementId: number, limit: number = 50) {
  return this.find({ requirementId })
    .sort({ timestamp: -1 })
    .limit(limit);
};

// 특정 프로젝트의 변경 이력 조회
requirementHistorySchema.statics.findByProject = function(projectId: number, limit: number = 100) {
  return this.find({ projectId })
    .sort({ timestamp: -1 })
    .limit(limit);
};

// 특정 기간의 변경 이력 조회
requirementHistorySchema.statics.findByDateRange = function(startDate: Date, endDate: Date, projectId?: number) {
  const query: any = {
    timestamp: { $gte: startDate, $lte: endDate }
  };
  
  if (projectId) {
    query.projectId = projectId;
  }
  
  return this.find(query).sort({ timestamp: -1 });
};

// 변경 통계 조회
requirementHistorySchema.statics.getChangeStats = async function(projectId: number, days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const pipeline = [
    {
      $match: {
        projectId: projectId,
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
          changeType: "$changeType"
        },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: "$_id.date",
        changes: {
          $push: {
            type: "$_id.changeType",
            count: "$count"
          }
        },
        totalChanges: { $sum: "$count" }
      }
    },
    {
      $sort: { "_id": 1 }
    }
  ];
  
  return this.aggregate(pipeline);
};

export const RequirementHistory = mongoose.model<IRequirementHistory>('RequirementHistory', requirementHistorySchema);