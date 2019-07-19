import { Module } from '@nestjs/common';
import * as IPFS from 'ipfs';
import { BlazarModule } from '../../src';

import { UserModule } from './user';

@Module({
  imports: [
    BlazarModule.forRootAsync({
      async useFactory() {
        const ipfs = new IPFS({
          repo: __dirname + '/ipfs',
          EXPERIMENTAL: {
            pubsub: true,
          },
        });

        await new Promise(resolve => ipfs.on('ready', resolve));

        const orbitdb = await require('orbit-db').createInstance(ipfs,{
          directory: __dirname + '/orbitdb',
        } as any);

        return {
          orbitdb,
        };
      }
    }),
    UserModule,
  ],
})
export class AppModule {}
