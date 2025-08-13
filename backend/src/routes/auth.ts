import express, { Request, Response } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { User, IUser } from '../models/User';

const router = express.Router();

// JWT 비밀키 (실제로는 환경변수에서 가져와야 함)
const JWT_SECRET: string = process.env.JWT_SECRET || 'your-secret-key-here';
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '24h';

// 사용자 등록
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, password, name, email, role = 'user' } = req.body;

    // 필수 필드 검증
    if (!username || !password || !name || !email) {
      return res.status(400).json({
        success: false,
        message: '필수 필드가 누락되었습니다.'
      });
    }

    // 사용자 존재 여부 확인
    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: '이미 존재하는 사용자명 또는 이메일입니다.'
      });
    }

    // 권한 설정
    let permissions: string[] = [];
    switch (role) {
      case 'admin':
        permissions = ['all'];
        break;
      case 'manager':
        permissions = ['project.read', 'project.write', 'requirement.read', 'requirement.write', 'report.read'];
        break;
      case 'user':
        permissions = ['project.read', 'requirement.read'];
        break;
    }

    // 새 사용자 생성
    const user = new User({
      username,
      password,
      name,
      email,
      role,
      permissions
    });

    await user.save();

    // 비밀번호 제외하고 응답
    const userResponse = {
      id: user._id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      isActive: user.isActive,
      createdAt: user.createdAt
    };

    res.status(201).json({
      success: true,
      message: '사용자가 성공적으로 등록되었습니다.',
      data: { user: userResponse }
    });
  } catch (error: any) {
    console.error('User registration error:', error);
    res.status(500).json({
      success: false,
      message: '사용자 등록 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 로그인
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    // 필수 필드 검증
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '사용자명과 비밀번호를 입력해주세요.'
      });
    }

    // 사용자 찾기
    const user = await User.findOne({ username }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '잘못된 사용자명 또는 비밀번호입니다.'
      });
    }

    // 계정 활성화 상태 확인
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: '비활성화된 계정입니다. 관리자에게 문의하세요.'
      });
    }

    // 비밀번호 확인
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: '잘못된 사용자명 또는 비밀번호입니다.'
      });
    }

    // 마지막 로그인 시간 업데이트
    user.lastLoginAt = new Date();
    await user.save();

    // JWT 토큰 생성
    const payload = { 
      userId: user._id,
      username: user.username,
      role: user.role
    };
    
    const options = { 
      expiresIn: '24h' as const
    };
    
    const token = jwt.sign(payload, JWT_SECRET, options);

    // 사용자 정보 (비밀번호 제외)
    const userResponse = {
      id: user._id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt
    };

    res.json({
      success: true,
      message: '로그인 성공',
      data: {
        user: userResponse,
        token
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: '로그인 처리 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 토큰 검증
router.get('/verify', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: '토큰이 제공되지 않았습니다.'
      });
    }

    // 토큰 검증
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // 사용자 찾기
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: '유효하지 않은 토큰입니다.'
      });
    }

    // 사용자 정보 반환
    const userResponse = {
      id: user._id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt
    };

    res.json({
      success: true,
      data: { user: userResponse }
    });
  } catch (error: any) {
    console.error('Token verification error:', error);
    res.status(401).json({
      success: false,
      message: '토큰 검증에 실패했습니다.',
      error: error.message
    });
  }
});

// 로그아웃 (클라이언트에서 토큰 제거)
router.post('/logout', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: '로그아웃되었습니다.'
  });
});

export default router;