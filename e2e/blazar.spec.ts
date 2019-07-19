import { NestFactory } from '@nestjs/core';
import { INestApplicationContext } from '@nestjs/common';
import { take } from 'rxjs/operators';
import del = require('del');
import { BlazarService, ofEvent, uuid } from '../src';

import { AppModule } from './app/app.module';
import { UserService } from './app/user';
import { RepositoryEvent } from '../src/enums';

describe('Blazar', () => {
  let blazar: BlazarService;
  let app: INestApplicationContext;
  let user: UserService;

  beforeEach(async () => {
    app = await NestFactory.createApplicationContext(AppModule);

    blazar = app.get(BlazarService, { strict: false });
    user = app.get(UserService, { strict: false });
  }, 10000);

  afterEach(async () => {
    await app.close();
    await del([
      __dirname + '/app/ipfs/',
      __dirname + '/app/orbitdb/',
    ]);
  });

  it('should create user', async () => {
    const data = await user.repository.create({
      username: 'Venobo',
    });

    expect(data).toMatchObject({
      id: expect.any(String),
      username: 'Venobo',
    });
  });

  describe('relations', () => {
    let data: any;

    beforeEach(() => {
      data = {
        username: uuid(),
      };
    });

    it('should create through connect', async () => {
      const invitedBy = {
        username: uuid(),
      };

      const insertion = await user.repository.create(data);

      await user.repository
        .create(invitedBy)
        .connect({
          lol: '',
          /*invitedBy: {
            ...insertion,
          },*/
        } as any);
    });

    it('should add entry for relation', async () => {
      const insertion = await user.repository.create({
        ...data,
        invitedBy: {
          username: uuid(),
        },
      });

      expect(insertion).toMatchObject({
        id: expect.any(String),
        username: data.username,
        invitedBy: expect.objectContaining(insertion.invitedBy),
      });
    }, 10000);
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
