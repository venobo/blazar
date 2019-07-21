import * as Gun from 'gun';

export type BlazarModuleOptions = Gun.ConstructorOptions;

export interface BlazarModuleAsyncOptions {
  useFactory: (...args: any[]) => Promise<BlazarModuleOptions> | BlazarModuleOptions;
  inject?: any[];
}
