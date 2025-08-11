import express, { Request, Response } from 'express';
import { User, IUser } from '../models/User';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

const router = express.Router();

// 모든 라우트에 인증 미들웨어 적용
router.use(authMiddleware);

// 사용자 목록 조회 (관리자만)
router.get('/', adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // 검색 조건
    let filter: any = {};
    if (search) {
      filter = {
        $or: [
          { username: { $regex: search, $options: 'i' } },
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      };
    }

    // 사용자 목록 조회 (비밀번호 제외)
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    // 전체 사용자 수
    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          current: Number(page),
          total: Math.ceil(total / Number(limit)),
          count: users.length,
          totalRecords: total
        }
      }
    });
  } catch (error: any) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: '사용자 목록 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 특정 사용자 조회
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const requestUser = (req as any).user;

    // 본인이거나 관리자만 조회 가능
    if (requestUser.userId !== id && requestUser.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '접근 권한이 없습니다.'
      });
    }

    const user = await User.findById(id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.'
      });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error: any) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: '사용자 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 사용자 정보 수정
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const requestUser = (req as any).user;
    const updateData = req.body;

    // 본인이거나 관리자만 수정 가능
    if (requestUser.userId !== id && requestUser.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '접근 권한이 없습니다.'
      });
    }

    // 비밀번호는 별도 API로 변경
    delete updateData.password;

    // 일반 사용자는 role, permissions 변경 불가
    if (requestUser.role !== 'admin') {
      delete updateData.role;
      delete updateData.permissions;
      delete updateData.isActive;
    }

    const user = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.'
      });
    }

    res.json({
      success: true,
      message: '사용자 정보가 수정되었습니다.',
      data: { user }
    });
  } catch (error: any) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: '사용자 정보 수정 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 사용자 삭제 (관리자만)
router.delete('/:id', adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const requestUser = (req as any).user;

    // 자기 자신은 삭제할 수 없음
    if (requestUser.userId === id) {
      return res.status(400).json({
        success: false,
        message: '자기 자신은 삭제할 수 없습니다.'
      });
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.'
      });
    }

    res.json({
      success: true,
      message: '사용자가 삭제되었습니다.'
    });
  } catch (error: any) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: '사용자 삭제 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 비밀번호 변경
router.put('/:id/password', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;
    const requestUser = (req as any).user;

    // 본인이거나 관리자만 변경 가능
    if (requestUser.userId !== id && requestUser.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '접근 권한이 없습니다.'
      });
    }

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: '새 비밀번호를 입력해주세요.'
      });
    }

    const user = await User.findById(id).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.'
      });
    }

    // 본인이 변경하는 경우 현재 비밀번호 확인 필요
    if (requestUser.userId === id) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: '현재 비밀번호를 입력해주세요.'
        });
      }

      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: '현재 비밀번호가 올바르지 않습니다.'
        });
      }
    }

    // 새 비밀번호 설정
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: '비밀번호가 변경되었습니다.'
    });
  } catch (error: any) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: '비밀번호 변경 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 사용자 통계 (관리자만)
router.get('/stats/overview', adminMiddleware, async (req: Request, res: Response) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const adminUsers = await User.countDocuments({ role: 'admin' });
    const managerUsers = await User.countDocuments({ role: 'manager' });
    const regularUsers = await User.countDocuments({ role: 'user' });

    // 최근 로그인 사용자 (7일 이내)
    const recentLoginUsers = await User.countDocuments({
      lastLoginAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    res.json({
      success: true,
      data: {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers,
        roles: {
          admin: adminUsers,
          manager: managerUsers,
          user: regularUsers
        },
        recentLogin: recentLoginUsers
      }
    });
  } catch (error: any) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: '사용자 통계 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

export default router;