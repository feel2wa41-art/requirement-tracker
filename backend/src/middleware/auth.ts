import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

// 인증 미들웨어
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: '인증 토큰이 필요합니다.'
      });
    }

    // 토큰 검증
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // 사용자 조회
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: '유효하지 않은 토큰입니다.'
      });
    }

    // 요청 객체에 사용자 정보 추가
    (req as any).user = {
      userId: user._id.toString(),
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: user.permissions
    };

    next();
  } catch (error: any) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({
      success: false,
      message: '토큰 검증에 실패했습니다.',
      error: error.message
    });
  }
};

// 관리자 권한 검증 미들웨어
export const adminMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  
  if (!user) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.'
    });
  }

  if (user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: '관리자 권한이 필요합니다.'
    });
  }

  next();
};

// 특정 권한 검증 미들웨어
export const permissionMiddleware = (requiredPermission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '인증이 필요합니다.'
      });
    }

    // 관리자는 모든 권한을 가짐
    if (user.role === 'admin' || user.permissions.includes('all')) {
      return next();
    }

    // 특정 권한 검사
    if (!user.permissions.includes(requiredPermission)) {
      return res.status(403).json({
        success: false,
        message: `${requiredPermission} 권한이 필요합니다.`
      });
    }

    next();
  };
};

// 관리자 또는 매니저 권한 검증 미들웨어
export const managerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  
  if (!user) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.'
    });
  }

  if (user.role !== 'admin' && user.role !== 'manager') {
    return res.status(403).json({
      success: false,
      message: '관리자 또는 매니저 권한이 필요합니다.'
    });
  }

  next();
};