import express, { Request, Response } from 'express';
import { RequirementHistory } from '../models/RequirementHistory';
import { Requirement } from '../models/Requirement';
import { Project } from '../models/Project';

const router = express.Router();

// 특정 요구사항의 변경 이력 조회
router.get('/requirement/:requirementId', async (req: Request, res: Response) => {
  try {
    const { requirementId } = req.params;
    const { limit = 50 } = req.query;

    const history = await RequirementHistory.findByRequirement(
      parseInt(requirementId),
      parseInt(limit as string)
    );

    res.json({
      success: true,
      data: {
        history,
        count: history.length
      }
    });
  } catch (error: any) {
    console.error('요구사항 이력 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '요구사항 이력 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 특정 프로젝트의 모든 변경 이력 조회
router.get('/project/:projectId', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { limit = 100, startDate, endDate } = req.query;

    let history;
    
    if (startDate && endDate) {
      // 날짜 범위가 지정된 경우
      history = await RequirementHistory.findByDateRange(
        new Date(startDate as string),
        new Date(endDate as string),
        parseInt(projectId)
      );
    } else {
      // 일반적인 프로젝트 이력 조회
      history = await RequirementHistory.findByProject(
        parseInt(projectId),
        parseInt(limit as string)
      );
    }

    // 각 이력에 요구사항 정보 추가
    const enrichedHistory = await Promise.all(
      history.map(async (item: any) => {
        const requirement = await Requirement.findOne({ id: item.requirementId });
        return {
          ...item.toObject(),
          requirement: requirement ? {
            number: requirement.number,
            title: requirement.title,
            currentStatus: requirement.status
          } : null
        };
      })
    );

    res.json({
      success: true,
      data: {
        history: enrichedHistory,
        count: enrichedHistory.length,
        projectId: parseInt(projectId)
      }
    });
  } catch (error: any) {
    console.error('프로젝트 이력 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '프로젝트 이력 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 프로젝트별 변경 통계 조회
router.get('/stats/:projectId', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { days = 30 } = req.query;

    const stats = await RequirementHistory.getChangeStats(
      parseInt(projectId),
      parseInt(days as string)
    );

    // 변경 유형별 총 개수 계산
    const changeTypeSummary: { [key: string]: number } = {};
    let totalChanges = 0;

    stats.forEach((dayStats: any) => {
      dayStats.changes.forEach((change: any) => {
        changeTypeSummary[change.type] = (changeTypeSummary[change.type] || 0) + change.count;
        totalChanges += change.count;
      });
    });

    // 최근 활동 요약
    const recentActivity = await RequirementHistory.find({ projectId: parseInt(projectId) })
      .sort({ timestamp: -1 })
      .limit(10);

    // 가장 자주 변경되는 요구사항 찾기
    const frequentlyChangedRequirements = await RequirementHistory.aggregate([
      {
        $match: { projectId: parseInt(projectId) }
      },
      {
        $group: {
          _id: '$requirementId',
          changeCount: { $sum: 1 },
          lastChanged: { $max: '$timestamp' }
        }
      },
      {
        $sort: { changeCount: -1 }
      },
      {
        $limit: 5
      }
    ]);

    // 요구사항 상세 정보 추가
    const enrichedFrequentChanges = await Promise.all(
      frequentlyChangedRequirements.map(async (item: any) => {
        const requirement = await Requirement.findOne({ id: item._id });
        return {
          ...item,
          requirement: requirement ? {
            number: requirement.number,
            title: requirement.title,
            status: requirement.status
          } : null
        };
      })
    );

    res.json({
      success: true,
      data: {
        timelineStats: stats,
        changeTypeSummary,
        totalChanges,
        recentActivity,
        frequentlyChangedRequirements: enrichedFrequentChanges,
        period: `${days}일간`
      }
    });
  } catch (error: any) {
    console.error('변경 통계 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '변경 통계 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 전체 프로젝트의 활동 대시보드
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days as string));

    // 기간 내 모든 변경사항
    const recentChanges = await RequirementHistory.findByDateRange(startDate, new Date());

    // 프로젝트별 활동 통계
    const projectActivity = await RequirementHistory.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$projectId',
          changeCount: { $sum: 1 },
          lastActivity: { $max: '$timestamp' },
          changeTypes: { $addToSet: '$changeType' }
        }
      },
      {
        $sort: { changeCount: -1 }
      }
    ]);

    // 각 프로젝트 정보 추가
    const enrichedProjectActivity = await Promise.all(
      projectActivity.map(async (item: any) => {
        const project = await Project.findOne({ id: item._id });
        return {
          ...item,
          project: project ? {
            name: project.name,
            status: project.status
          } : null
        };
      })
    );

    // 변경 유형별 통계
    const changeTypeStats = await RequirementHistory.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$changeType',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        period: `최근 ${days}일`,
        totalChanges: recentChanges.length,
        projectActivity: enrichedProjectActivity,
        changeTypeStats,
        recentChanges: recentChanges.slice(0, 20) // 최근 20개만
      }
    });
  } catch (error: any) {
    console.error('활동 대시보드 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '활동 대시보드 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 요구사항 변경 이력 수동 기록 (특별한 경우)
router.post('/manual', async (req: Request, res: Response) => {
  try {
    const {
      requirementId,
      projectId,
      changeType,
      fieldName,
      oldValue,
      newValue,
      changedBy,
      changeReason,
      ipAddress,
      userAgent
    } = req.body;

    const historyEntry = new RequirementHistory({
      requirementId,
      projectId,
      changeType,
      fieldName,
      oldValue,
      newValue,
      changedBy,
      changeReason,
      ipAddress,
      userAgent
    });

    await historyEntry.save();

    res.json({
      success: true,
      message: '이력이 성공적으로 기록되었습니다.',
      data: { historyId: historyEntry.id }
    });
  } catch (error: any) {
    console.error('수동 이력 기록 실패:', error);
    res.status(500).json({
      success: false,
      message: '이력 기록 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

export default router;