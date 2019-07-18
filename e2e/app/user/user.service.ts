import { Injectable } from '@nestjs/common';
import { BlazarRepository, InjectRepository } from '../../../src';
import { User } from './user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    readonly repository: BlazarRepository<User>,
  ) {}
}
