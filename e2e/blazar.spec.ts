import { NestFactory } from '@nestjs/core';
import { INestApplicationContext } from '@nestjs/common';
import * as IPFS from 'ipfs';
import { BLAZAR_OPTIONS, BlazarModuleOptions, BlazarService, ofEvent } from '../src';

import { AppModule } from './app/app.module';
import { UserModule, UserService } from './app/user';
import { RepositoryEvent } from '../src/lib/enums';
import { take } from 'rxjs/operators';

describe('Blazar', () => {
  let blazar: BlazarService;
  let ipfs: IPFS;
  let app: INestApplicationContext;
  let user: UserService;

  beforeEach(async () => {
    app = await NestFactory.createApplicationContext(AppModule);

    blazar = app.get(BlazarService, { strict: false });
    ipfs = app.get<BlazarModuleOptions>(BLAZAR_OPTIONS).ipfs;
    user = app.select(UserModule).get(UserService);
  });

  afterEach(async () => {
    await app.close();
    // await new Promise(resolve => ipfs.stop(resolve));
  });

  it('test', async () => {
    const data = await user.repository.create({
      username: 'Venobo',
    } as any);

    expect(data).toBeNaN();
  });

  describe('events$', () => {
    it('should react to database write', async (done) => {
      user.repository.events$.pipe(
        ofEvent(RepositoryEvent.WRITE),
        take(1),
      ).subscribe(data => {
        expect(data).toBeDefined();
        done();
      });

      await user.repository.create({
        username: 'LOL',
      });
    });
  });
});
