import { DynamicModule, Global, Module, OnModuleDestroy, OnModuleInit, Provider } from '@nestjs/common';

import { BlazarModuleAsyncOptions, BlazarModuleOptions } from './interfaces';
import { BlazarService } from './blazar.service';
import { BLAZAR_OPTIONS } from './tokens';

@Global()
@Module({
  providers: [BlazarService],
  exports: [BlazarService],
})
export class BlazarCoreModule implements OnModuleInit, OnModuleDestroy {
  constructor(private readonly blazar: BlazarService) {}

  static forRoot(options: BlazarModuleOptions): DynamicModule {
    return {
      module: BlazarCoreModule,
      providers: [
        {
          provide: BLAZAR_OPTIONS,
          useValue: options,
        },
      ],
    };
  }

  static forRootAsync(options: BlazarModuleAsyncOptions): DynamicModule {
    return {
      module: BlazarCoreModule,
      providers: [
        {
          provide: BLAZAR_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
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
