import { Module } from '@nestjs/common';
import { BlazarModule } from '../../../src';

import { User } from './user.entity';
import { UserService } from './user.service';

@Module({
  imports: [
    BlazarModule.forFeature([
      User,
    ]),
  ],
  providers: [
    UserService,
  ],
  exports: [
    UserService,
  ],
})
export class UserModule {}
