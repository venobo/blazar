import * as IPFS from 'ipfs';

export interface BlazarModuleOptions {
  scope?: string;
  ipfs: IPFS;
}

export interface BlazarModuleAsyncOptions {
  useFactory: (...args: any[]) => Promise<BlazarModuleOptions> | BlazarModuleOptions;
  inject?: any[];
}
