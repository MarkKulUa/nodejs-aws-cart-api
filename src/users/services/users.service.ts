import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../../database/entities';
import { User } from '../models';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async findOne(name: string): Promise<User | undefined> {
    const user = await this.userRepository.findOne({ where: { name } });
    return user ?? undefined;
  }

  async createOne({ name, password, email }: User): Promise<User> {
    const user = this.userRepository.create({ name, password, email });
    return this.userRepository.save(user);
  }
}
