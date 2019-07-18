import { Module } from '@nestjs/common';
import * as IPFS from 'ipfs';
import { BlazarModule } from '../../src';

import { UserModule } from './user';

console.log(__dirname);

@Module({
  imports: [
    BlazarModule.forRootAsync({
      async useFactory() {
        const ipfs = new IPFS({
          repo: __dirname + '/blazar',
          EXPERIMENTAL: {
            pubsub: true,
          },
        });

        return {
          ipfs,
        };
      }
    }),
    UserModule,
  ],
})
export class AppModule {}
