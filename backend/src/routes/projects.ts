import express, { Request, Response } from 'express';
import { Project } from '../models/Project';
import { authMiddleware, permissionMiddleware } from '../middleware/auth';

const router = express.Router();

// 모든 라우트에 인증 미들웨어 적용
router.use(authMiddleware);

// GET /api/projects - 모든 프로젝트 조회
router.get('/', permissionMiddleware('project.read'), async (req: Request, res: Response) => {
  try {
    const projects = await Project.find().select('-requirements').sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: { projects }
    });
  } catch (error: any) {
    console.error('프로젝트 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '프로젝트 조회에 실패했습니다.',
      error: error.message
    });
  }
});

// GET /api/projects/:id - 특정 프로젝트 조회
router.get('/:id', permissionMiddleware('project.read'), async (req: Request, res: Response) => {
  try {
    const project = await Project.findOne({ id: parseInt(req.params.id) });
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: '프로젝트를 찾을 수 없습니다.'
      });
    }
    
    res.json({
      success: true,
      data: { project }
    });
  } catch (error: any) {
    console.error('프로젝트 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '프로젝트 조회에 실패했습니다.',
      error: error.message
    });
  }
});

// POST /api/projects - 프로젝트 생성
router.post('/', permissionMiddleware('project.write'), async (req: Request, res: Response) => {
  try {
    const { name, description, requester, modifier, confirmer, details } = req.body;
    const user = (req as any).user;

    // 필수 필드 검증
    if (!name || !requester || !modifier || !confirmer) {
      return res.status(400).json({
        success: false,
        message: '프로젝트 이름, 요구자, 수정자, 확인자는 필수입니다.'
      });
    }

    // 프로젝트 생성 전에 ID 수동 설정
    const lastProject = await Project.findOne().sort({ id: -1 });
    const newId = lastProject ? lastProject.id + 1 : 1;

    const project = new Project({
      id: newId, // ID 수동 설정
      name,
      description: description || '',
      requester,
      modifier,
      confirmer,
      details: details || {
        frontend: { enabled: false, description: '' },
        backend: { enabled: false, description: '' },
        platform: [],
        ideTools: [],
        developmentEnvironment: {
          frameworks: [],
          libraries: [],
          versions: {}
        },
        hasSpecification: false,
        screenNames: []
      },
      requirements: []
    });

    console.log('Creating project with ID:', newId);

    await project.save();

    res.status(201).json({
      success: true,
      message: '프로젝트가 생성되었습니다.',
      data: { project }
    });
  } catch (error: any) {
    console.error('프로젝트 생성 실패:', error);
    res.status(500).json({
      success: false,
      message: '프로젝트 생성에 실패했습니다.',
      error: error.message
    });
  }
});

// PUT /api/projects/:id - 프로젝트 수정
router.put('/:id', permissionMiddleware('project.write'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const user = (req as any).user;

    const project = await Project.findOne({ id: parseInt(id) });
    if (!project) {
      return res.status(404).json({
        success: false,
        message: '프로젝트를 찾을 수 없습니다.'
      });
    }

    // ID는 수정 불가
    delete updateData.id;
    updateData.updatedAt = new Date();

    const updatedProject = await Project.findOneAndUpdate(
      { id: parseInt(id) },
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: '프로젝트가 수정되었습니다.',
      data: { project: updatedProject }
    });
  } catch (error: any) {
    console.error('프로젝트 수정 실패:', error);
    res.status(500).json({
      success: false,
      message: '프로젝트 수정에 실패했습니다.',
      error: error.message
    });
  }
});

// PATCH /api/projects/:id/status - 프로젝트 상태 변경
router.patch('/:id/status', permissionMiddleware('project.write'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const user = (req as any).user;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: '상태는 필수입니다.'
      });
    }

    const project = await Project.findOne({ id: parseInt(id) });
    if (!project) {
      return res.status(404).json({
        success: false,
        message: '프로젝트를 찾을 수 없습니다.'
      });
    }

    const updatedProject = await Project.findOneAndUpdate(
      { id: parseInt(id) },
      { status, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: '프로젝트 상태가 변경되었습니다.',
      data: { project: updatedProject }
    });
  } catch (error: any) {
    console.error('프로젝트 상태 변경 실패:', error);
    res.status(500).json({
      success: false,
      message: '프로젝트 상태 변경에 실패했습니다.',
      error: error.message
    });
  }
});

// PUT /api/projects/:id/details - 프로젝트 상세 정보 수정
router.put('/:id/details', permissionMiddleware('project.write'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { details } = req.body;

    const project = await Project.findOne({ id: parseInt(id) });
    if (!project) {
      return res.status(404).json({
        success: false,
        message: '프로젝트를 찾을 수 없습니다.'
      });
    }

    const updatedProject = await Project.findOneAndUpdate(
      { id: parseInt(id) },
      { details, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: '프로젝트 상세 정보가 수정되었습니다.',
      data: { project: updatedProject }
    });
  } catch (error: any) {
    console.error('프로젝트 상세 정보 수정 실패:', error);
    res.status(500).json({
      success: false,
      message: '프로젝트 상세 정보 수정에 실패했습니다.',
      error: error.message
    });
  }
});

// DELETE /api/projects/:id - 프로젝트 삭제
router.delete('/:id', permissionMiddleware('project.write'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const project = await Project.findOne({ id: parseInt(id) });
    if (!project) {
      return res.status(404).json({
        success: false,
        message: '프로젝트를 찾을 수 없습니다.'
      });
    }

    // 요구사항이 있는 프로젝트는 삭제 불가 (선택사항)
    if (project.requirements && project.requirements.length > 0) {
      return res.status(400).json({
        success: false,
        message: '요구사항이 있는 프로젝트는 삭제할 수 없습니다. 요구사항을 먼저 삭제해주세요.'
      });
    }

    await Project.deleteOne({ id: parseInt(id) });

    res.json({
      success: true,
      message: '프로젝트가 삭제되었습니다.'
    });
  } catch (error: any) {
    console.error('프로젝트 삭제 실패:', error);
    res.status(500).json({
      success: false,
      message: '프로젝트 삭제에 실패했습니다.',
      error: error.message
    });
  }
});

// GET /api/projects/:id/requirements - 프로젝트의 요구사항 조회 (호환성을 위해 유지)
router.get('/:id/requirements', permissionMiddleware('requirement.read'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const project = await Project.findOne({ id: parseInt(id) }).select('requirements');
    if (!project) {
      return res.status(404).json({
        success: false,
        message: '프로젝트를 찾을 수 없습니다.'
      });
    }

    res.json({
      success: true,
      data: { requirements: project.requirements || [] }
    });
  } catch (error: any) {
    console.error('요구사항 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '요구사항 조회에 실패했습니다.',
      error: error.message
    });
  }
});

// GET /api/projects/:id/custom-statuses - 프로젝트 커스텀 상태 조회
router.get('/:id/custom-statuses', permissionMiddleware('project.read'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const project = await Project.findOne({ id: parseInt(id) }).select('customStatuses');
    if (!project) {
      return res.status(404).json({
        success: false,
        message: '프로젝트를 찾을 수 없습니다.'
      });
    }

    res.json({
      success: true,
      data: { customStatuses: project.customStatuses || [] }
    });
  } catch (error: any) {
    console.error('커스텀 상태 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '커스텀 상태 조회에 실패했습니다.',
      error: error.message
    });
  }
});

// POST /api/projects/:id/custom-statuses - 커스텀 상태 추가
router.post('/:id/custom-statuses', permissionMiddleware('project.write'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, color, description } = req.body;
    
    if (!name || !color) {
      return res.status(400).json({
        success: false,
        message: '상태 이름과 색상은 필수입니다.'
      });
    }

    const project = await Project.findOne({ id: parseInt(id) });
    if (!project) {
      return res.status(404).json({
        success: false,
        message: '프로젝트를 찾을 수 없습니다.'
      });
    }

    // 새로운 상태 ID 생성
    const newStatusId = `custom_${Date.now()}`;
    
    // 정렬 순서 계산 (마지막 + 1)
    const maxOrder = Math.max(...(project.customStatuses?.map(s => s.order) || [0]));
    
    const newStatus = {
      id: newStatusId,
      name,
      color,
      description: description || '',
      order: maxOrder + 1,
      isDefault: false
    };

    project.customStatuses = project.customStatuses || [];
    project.customStatuses.push(newStatus);
    project.updatedAt = new Date();
    
    await project.save();

    res.status(201).json({
      success: true,
      message: '커스텀 상태가 추가되었습니다.',
      data: { customStatus: newStatus }
    });
  } catch (error: any) {
    console.error('커스텀 상태 추가 실패:', error);
    res.status(500).json({
      success: false,
      message: '커스텀 상태 추가에 실패했습니다.',
      error: error.message
    });
  }
});

// PUT /api/projects/:id/custom-statuses/:statusId - 커스텀 상태 수정
router.put('/:id/custom-statuses/:statusId', permissionMiddleware('project.write'), async (req: Request, res: Response) => {
  try {
    const { id, statusId } = req.params;
    const { name, color, description, order } = req.body;
    
    const project = await Project.findOne({ id: parseInt(id) });
    if (!project) {
      return res.status(404).json({
        success: false,
        message: '프로젝트를 찾을 수 없습니다.'
      });
    }

    const statusIndex = project.customStatuses?.findIndex(s => s.id === statusId);
    if (statusIndex === -1 || statusIndex === undefined) {
      return res.status(404).json({
        success: false,
        message: '커스텀 상태를 찾을 수 없습니다.'
      });
    }

    // 기본 상태는 이름과 색상 변경 불가
    const status = project.customStatuses![statusIndex];
    if (status.isDefault && (name !== status.name || color !== status.color)) {
      return res.status(400).json({
        success: false,
        message: '기본 상태의 이름과 색상은 변경할 수 없습니다.'
      });
    }

    // 상태 업데이트
    if (name) project.customStatuses![statusIndex].name = name;
    if (color) project.customStatuses![statusIndex].color = color;
    if (description !== undefined) project.customStatuses![statusIndex].description = description;
    if (order !== undefined) project.customStatuses![statusIndex].order = order;
    
    project.updatedAt = new Date();
    await project.save();

    res.json({
      success: true,
      message: '커스텀 상태가 수정되었습니다.',
      data: { customStatus: project.customStatuses![statusIndex] }
    });
  } catch (error: any) {
    console.error('커스텀 상태 수정 실패:', error);
    res.status(500).json({
      success: false,
      message: '커스텀 상태 수정에 실패했습니다.',
      error: error.message
    });
  }
});

// DELETE /api/projects/:id/custom-statuses/:statusId - 커스텀 상태 삭제
router.delete('/:id/custom-statuses/:statusId', permissionMiddleware('project.write'), async (req: Request, res: Response) => {
  try {
    const { id, statusId } = req.params;
    
    const project = await Project.findOne({ id: parseInt(id) });
    if (!project) {
      return res.status(404).json({
        success: false,
        message: '프로젝트를 찾을 수 없습니다.'
      });
    }

    const statusIndex = project.customStatuses?.findIndex(s => s.id === statusId);
    if (statusIndex === -1 || statusIndex === undefined) {
      return res.status(404).json({
        success: false,
        message: '커스텀 상태를 찾을 수 없습니다.'
      });
    }

    // 기본 상태는 삭제 불가
    if (project.customStatuses![statusIndex].isDefault) {
      return res.status(400).json({
        success: false,
        message: '기본 상태는 삭제할 수 없습니다.'
      });
    }

    // 해당 상태를 사용하는 요구사항이 있는지 확인
    const statusName = project.customStatuses![statusIndex].name;
    const hasRequirementsWithStatus = project.requirements?.some(req => req.status === statusName);
    
    if (hasRequirementsWithStatus) {
      return res.status(400).json({
        success: false,
        message: '이 상태를 사용하는 요구사항이 있어 삭제할 수 없습니다.'
      });
    }

    project.customStatuses!.splice(statusIndex, 1);
    project.updatedAt = new Date();
    await project.save();

    res.json({
      success: true,
      message: '커스텀 상태가 삭제되었습니다.'
    });
  } catch (error: any) {
    console.error('커스텀 상태 삭제 실패:', error);
    res.status(500).json({
      success: false,
      message: '커스텀 상태 삭제에 실패했습니다.',
      error: error.message
    });
  }
});

export default router;