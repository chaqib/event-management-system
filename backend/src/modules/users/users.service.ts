import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole, UserStatus } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(data: Partial<User> & { passwordHash: string }): Promise<User> {
    const user = this.usersRepository.create({
      email: data.email,
      passwordHash: data.passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      role: data.role || UserRole.ATTENDEE,
    });
    return this.usersRepository.save(user);
  }

  async findAll(page = 1, limit = 20, role?: UserRole) {
    const query = this.usersRepository.createQueryBuilder('user');

    if (role) {
      query.where('user.role = :role', { role });
    }

    const [users, total] = await query
      .orderBy('user.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { users, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findByEmail(email: string, includePassword = false): Promise<User | null> {
    const query = this.usersRepository.createQueryBuilder('user')
      .where('user.email = :email', { email });

    if (includePassword) {
      query.addSelect('user.passwordHash');
    }

    return query.getOne();
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');

    Object.assign(user, data);
    return this.usersRepository.save(user);
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.usersRepository.update(id, { lastLoginAt: new Date() });
  }

  async updateStatus(id: string, status: UserStatus): Promise<User> {
    return this.update(id, { status });
  }

  async updateStripeCustomerId(id: string, stripeCustomerId: string): Promise<User> {
    return this.update(id, { stripeCustomerId });
  }

  async getDashboardStats() {
    const total = await this.usersRepository.count();
    const attendees = await this.usersRepository.count({ where: { role: UserRole.ATTENDEE } });
    const organizers = await this.usersRepository.count({ where: { role: UserRole.ORGANIZER } });
    const admins = await this.usersRepository.count({ where: { role: UserRole.ADMIN } });

    return { total, attendees, organizers, admins };
  }
}
