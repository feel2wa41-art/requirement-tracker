import express, { Request, Response } from 'express';
import { Requirement } from '../models/Requirement';
import { Project } from '../models/Project';
import { authMiddleware, permissionMiddleware } from '../middleware/auth';

const router = express.Router();

// 모든 라우트에 인증 미들웨어 적용
router.use(authMiddleware);

// 프로젝트별 요구사항 목록 조회 (트리 구조)
router.get('/project/:projectId', permissionMiddleware('requirement.read'), async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    
    const requirements = await Requirement.findWithChildren(Number(projectId));
    
    res.json({
      success: true,
      data: { requirements }
    });
  } catch (error: any) {
    console.error('Get requirements error:', error);
    res.status(500).json({
      success: false,
      message: '요구사항 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 특정 요구사항 조회
router.get('/:id', permissionMiddleware('requirement.read'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const requirement = await Requirement.findOne({ id: Number(id) });
    if (!requirement) {
      return res.status(404).json({
        success: false,
        message: '요구사항을 찾을 수 없습니다.'
      });
    }
    
    res.json({
      success: true,
      data: { requirement }
    });
  } catch (error: any) {
    console.error('Get requirement error:', error);
    res.status(500).json({
      success: false,
      message: '요구사항 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 요구사항 추가
router.post('/', permissionMiddleware('requirement.write'), async (req: Request, res: Response) => {
  try {
    const { projectId, parentNumber, title, description, priority, requester } = req.body;
    const user = (req as any).user;

    // 필수 필드 검증
    if (!projectId || !title) {
      return res.status(400).json({
        success: false,
        message: '프로젝트 ID와 제목은 필수입니다.'
      });
    }

    // 프로젝트 존재 여부 확인
    const project = await Project.findOne({ id: projectId });
    if (!project) {
      return res.status(404).json({
        success: false,
        message: '프로젝트를 찾을 수 없습니다.'
      });
    }

    let parentId = null;
    let level = 0;
    let sortOrder = 0;

    // 부모 요구사항이 있는 경우
    if (parentNumber) {
      const parent = await Requirement.findOne({ projectId, number: parentNumber });
      if (!parent) {
        return res.status(404).json({
          success: false,
          message: '부모 요구사항을 찾을 수 없습니다.'
        });
      }
      parentId = parent.id;
      level = parent.level + 1;
      
      // 같은 부모의 하위 요구사항 중 최대 sortOrder 찾기
      const maxSibling = await Requirement.findOne({
        projectId,
        parentId,
        level
      }).sort({ sortOrder: -1 });
      
      sortOrder = maxSibling ? maxSibling.sortOrder + 1 : 1;
    } else {
      // 루트 레벨인 경우
      const maxRoot = await Requirement.findOne({
        projectId,
        level: 0
      }).sort({ sortOrder: -1 });
      
      sortOrder = maxRoot ? maxRoot.sortOrder + 1 : 1;
    }

    // ID 생성
    const lastRequirement = await Requirement.findOne().sort({ id: -1 });
    const newId = lastRequirement ? lastRequirement.id + 1 : 1;

    // 번호 생성
    const number = await (Requirement as any).generateNumber(projectId, parentNumber);

    // 새 요구사항 생성
    const requirement = new Requirement({
      id: newId, // ID 수동 설정
      projectId,
      number,
      title,
      description: description || '',
      priority: priority || '보통',
      status: req.body.status || '요청',
      requester: requester || user.name,
      parentId,
      parentNumber: parentNumber || null,
      level,
      sortOrder,
      modifier: user.name,
      modifyDate: new Date()
    });

    console.log('Creating requirement with ID:', newId);

    await requirement.save();

    res.status(201).json({
      success: true,
      message: '요구사항이 추가되었습니다.',
      data: { requirement }
    });
  } catch (error: any) {
    console.error('Create requirement error:', error);
    res.status(500).json({
      success: false,
      message: '요구사항 추가 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 요구사항 수정
router.put('/:id', permissionMiddleware('requirement.write'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const user = (req as any).user;

    const requirement = await Requirement.findOne({ id: Number(id) });
    if (!requirement) {
      return res.status(404).json({
        success: false,
        message: '요구사항을 찾을 수 없습니다.'
      });
    }

    // 수정 정보 추가
    updateData.modifier = user.name;
    updateData.modifyDate = new Date();

    // 번호, 프로젝트ID, 부모 관계는 변경 불가
    delete updateData.number;
    delete updateData.projectId;
    delete updateData.parentId;
    delete updateData.parentNumber;
    delete updateData.level;
    delete updateData.sortOrder;

    const updatedRequirement = await Requirement.findOneAndUpdate(
      { id: Number(id) },
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: '요구사항이 수정되었습니다.',
      data: { requirement: updatedRequirement }
    });
  } catch (error: any) {
    console.error('Update requirement error:', error);
    res.status(500).json({
      success: false,
      message: '요구사항 수정 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 요구사항 삭제
router.delete('/:id', permissionMiddleware('requirement.write'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const requirement = await Requirement.findOne({ id: Number(id) });
    if (!requirement) {
      return res.status(404).json({
        success: false,
        message: '요구사항을 찾을 수 없습니다.'
      });
    }

    // 하위 요구사항이 있는지 확인
    const childRequirements = await Requirement.find({ parentId: requirement.id });
    if (childRequirements.length > 0) {
      return res.status(400).json({
        success: false,
        message: '하위 요구사항이 있는 요구사항은 삭제할 수 없습니다. 하위 요구사항을 먼저 삭제해주세요.'
      });
    }

    await Requirement.deleteOne({ id: Number(id) });

    res.json({
      success: true,
      message: '요구사항이 삭제되었습니다.'
    });
  } catch (error: any) {
    console.error('Delete requirement error:', error);
    res.status(500).json({
      success: false,
      message: '요구사항 삭제 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 요구사항 상태 변경
router.patch('/:id/status', permissionMiddleware('requirement.write'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, confirmer } = req.body;
    const user = (req as any).user;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: '상태는 필수입니다.'
      });
    }

    const updateData: any = {
      status,
      modifier: user.name,
      modifyDate: new Date()
    };

    // 완료 상태로 변경하는 경우 확인자 정보 추가
    if (status === '완료') {
      updateData.confirmer = confirmer || user.name;
      updateData.confirmDate = new Date();
    }

    const requirement = await Requirement.findOneAndUpdate(
      { id: Number(id) },
      updateData,
      { new: true }
    );

    if (!requirement) {
      return res.status(404).json({
        success: false,
        message: '요구사항을 찾을 수 없습니다.'
      });
    }

    res.json({
      success: true,
      message: '요구사항 상태가 변경되었습니다.',
      data: { requirement }
    });
  } catch (error: any) {
    console.error('Update requirement status error:', error);
    res.status(500).json({
      success: false,
      message: '요구사항 상태 변경 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 요구사항 펼침/접힘 상태 변경
router.patch('/:id/expand', permissionMiddleware('requirement.read'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isExpanded } = req.body;

    const requirement = await Requirement.findOneAndUpdate(
      { id: Number(id) },
      { isExpanded: !!isExpanded },
      { new: true }
    );

    if (!requirement) {
      return res.status(404).json({
        success: false,
        message: '요구사항을 찾을 수 없습니다.'
      });
    }

    res.json({
      success: true,
      data: { requirement }
    });
  } catch (error: any) {
    console.error('Update requirement expand error:', error);
    res.status(500).json({
      success: false,
      message: '요구사항 펼침 상태 변경 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

export default router;