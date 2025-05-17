import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createUser(email: string, password: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
    });

    return this.userRepository.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findById(id: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user)
      throw new NotFoundException(`Usuário com id ${id} não encontrado`);
    return user;
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  // Atualização dummy (adicione o que quiser atualizar)
  async update(id: number): Promise<void> {
    const user = await this.findById(id);
    if (!user)
      throw new NotFoundException(`Usuário com id ${id} não encontrado`);

    // Aqui você pode atualizar algo, ex: lastLogin
    // await this.userRepository.update(id, { lastLogin: new Date() });
  }
}
