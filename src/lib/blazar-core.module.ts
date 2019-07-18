import { DynamicModule, Global, Module, OnModuleDestroy, OnModuleInit, Provider } from '@nestjs/common';

import { BlazarModuleAsyncOptions, BlazarModuleOptions } from './interfaces';
import { BlazarService } from './blazar.service';
import { BLAZAR_OPTIONS, ORBIT_DB } from './tokens';

@Global()
@Module({
  providers: [BlazarService],
  exports: [BlazarService],
})
export class BlazarCoreModule implements OnModuleInit, OnModuleDestroy {
  constructor(private readonly blazar: BlazarService) {}

  private static createBlazarProviders(): Provider[] {
    return [
      {
        provide: ORBIT_DB,
        async useFactory({ ipfs }: BlazarModuleOptions) {
          await new Promise(resolve => ipfs.on('ready', resolve));

          // the typescript declarations seriously needs to be fixed like wtf
          return await require('orbit-db').createInstance(ipfs);
        },
        inject: [BLAZAR_OPTIONS],
      },
    ];
  }

  static forRoot(options: BlazarModuleOptions): DynamicModule {
    const providers = this.createBlazarProviders();

    return {
      module: BlazarCoreModule,
      providers: [
        {
          provide: BLAZAR_OPTIONS,
          useValue: options,
        },
        ...providers,
      ],
    };
  }

  static forRootAsync(options: BlazarModuleAsyncOptions): DynamicModule {
    const providers = this.createBlazarProviders();

    return {
      module: BlazarCoreModule,
      providers: [
        {
          provide: BLAZAR_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
        ...providers,
      ],
    };
  }

  async onModuleInit() {
    await this.blazar.create();
  }

  async onModuleDestroy() {
    await this.blazar.close();
  }
}
