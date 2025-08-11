import mongoose from 'mongoose';
import { User } from '../models/User';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/requirement-tracker';

const seedUsers = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // 기존 사용자가 있는지 확인
    const existingAdmin = await User.findOne({ username: 'admin' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

    // 기본 사용자 생성
    const users = [
      {
        username: 'admin',
        password: 'password',
        name: '관리자',
        email: 'admin@company.com',
        role: 'admin',
        permissions: ['all']
      },
      {
        username: 'manager1',
        password: 'password',
        name: '김관리',
        email: 'manager@company.com',
        role: 'manager',
        permissions: ['project.read', 'project.write', 'requirement.read', 'requirement.write', 'report.read']
      },
      {
        username: 'user1',
        password: 'password',
        name: '이사용',
        email: 'user@company.com',
        role: 'user',
        permissions: ['project.read', 'requirement.read']
      }
    ];

    for (const userData of users) {
      const user = new User(userData);
      await user.save();
      console.log(`Created user: ${userData.username}`);
    }

    console.log('Users seeded successfully!');
    console.log('Default login: admin / password');
    
  } catch (error) {
    console.error('Error seeding users:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

seedUsers();