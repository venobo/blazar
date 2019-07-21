import { Module } from '@nestjs/common';
import { BlazarModule } from '../../src';

import { UserModule } from './user';

@Module({
  imports: [
    BlazarModule.forRoot(),
    UserModule,
  ],
})
export class AppModule {}
