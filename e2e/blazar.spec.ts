import { NestFactory } from '@nestjs/core';
import { INestApplicationContext } from '@nestjs/common';
import del = require('del');
import { BlazarService, uuid } from '../src';

import { AppModule } from './app/app.module';
import { UserService } from './app/user';

describe('Blazar', () => {
  let blazar: BlazarService;
  let app: INestApplicationContext;
  let user: UserService;

  beforeAll(async () => {
    app = await NestFactory.createApplicationContext(AppModule);

    blazar = app.get(BlazarService, { strict: false });
    user = app.get(UserService, { strict: false });
  }, 10000);

  afterAll(async () => {
    await app.close();
    await del([
      __dirname + '/app/ipfs/',
      __dirname + '/app/orbitdb/',
    ]);
  });

  describe('create', () => {
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

      /*it('should create through connect', async () => {
        const invitedBy = {
          username: uuid(),
        };

        const insertion = await user.repository.create(data);

        await user.repository
          .create(invitedBy)
          .connect({
            invitedBy: {
              ...insertion,
            },
          });
      });*/

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
      });
    });
  });

  /*describe('events$', () => {
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
  });*/
});
