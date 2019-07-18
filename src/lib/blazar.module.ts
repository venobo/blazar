import { DynamicModule, Module, Type } from '@nestjs/common';

import { BlazarService } from './blazar.service';
import { getRepositoryToken } from './utils';
import { BlazarModuleAsyncOptions, BlazarModuleOptions } from './interfaces';
import { BlazarCoreModule } from './blazar-core.module';

@Module({})
export class BlazarModule {
  static forRoot(options: BlazarModuleOptions): DynamicModule {
    return {
      module: BlazarModule,
      imports: [BlazarCoreModule.forRoot(options)],
    };
  }

  static forRootAsync(options: BlazarModuleAsyncOptions): DynamicModule {
    return {
      module: BlazarModule,
      imports: [BlazarCoreModule.forRootAsync(options)],
    };
  }

  static forFeature(entities: Type<any>[]): DynamicModule {
    const repositories = entities.map(entity => ({
      provide: getRepositoryToken(entity),
      useFactory(blazar: BlazarService) {
        return blazar.createRepository(entity);
      },
      inject: [BlazarService],
    }));

    return {
      module: BlazarModule,
      providers: repositories,
      exports: repositories,
    };
  }
}
