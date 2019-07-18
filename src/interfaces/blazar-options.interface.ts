import { OrbitDB } from 'orbit-db';

export interface BlazarModuleOptions {
  scope?: string;
  orbitdb: OrbitDB;
}

export interface BlazarModuleAsyncOptions {
  useFactory: (...args: any[]) => Promise<BlazarModuleOptions> | BlazarModuleOptions;
  inject?: any[];
}
