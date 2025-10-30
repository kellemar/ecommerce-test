import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { hash as hashPassword } from 'argon2';
import { User, UserRole } from '../../entities';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly em: EntityManager) {}

  async create(dto: CreateUserDto): Promise<User> {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.em.findOne(User, { email });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const user = new User();
    user.email = email;
    user.passwordHash = await hashPassword(dto.password);
    user.fullName = dto.fullName;
    user.role = dto.role ?? UserRole.Customer;

    await this.em.persistAndFlush(user);
    return user;
  }

  findAll(): Promise<User[]> {
    return this.em.find(User, {});
  }

  findOne(id: number): Promise<User | null> {
    return this.em.findOne(User, id);
  }

  async update(id: number, dto: UpdateUserDto): Promise<User> {
    const user = await this.em.findOne(User, id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (dto.password) {
      user.passwordHash = await hashPassword(dto.password);
    }

    if (dto.fullName !== undefined) {
      user.fullName = dto.fullName;
    }

    if (dto.role) {
      user.role = dto.role;
    }

    await this.em.flush();
    return user;
  }

  async remove(id: number): Promise<void> {
    const user = await this.em.findOne(User, id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.em.removeAndFlush(user);
  }
}
