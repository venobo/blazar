import { NestFactory } from '@nestjs/core';
import { INestApplicationContext } from '@nestjs/common';
import { BlazarService, uuid } from '../src';

import { AppModule } from './app/app.module';
import { UserService, User } from './app/user';

describe('Blazar', () => {
  let blazar: BlazarService;
  let app: INestApplicationContext;
  let user: UserService;

  beforeAll(async () => {
    app = await NestFactory.createApplicationContext(AppModule);

    blazar = app.get(BlazarService, { strict: false });
    user = app.get(UserService, { strict: false });
  });

  afterAll(() => app.close());

  describe('find', () => {
    it('should find one by id', async () => {
      const id = uuid();

      // @ts-ignore
      await blazar.entityGraphs.get(User).get(id).put({ id });

      expect(await user.repository.find(id)).toMatchObject({ id });
    });

    it('should return null if no entry was found', async () => {
      expect(await user.repository.find('Blazar')).toStrictEqual(null);
    });

    it('should find one by query');

    it('should find one by indices');

    it('should find multiple by query');
  });

  describe('create', () => {
    it('should create user', async (done) => {
      const data = await user.repository.create({
        username: 'Venobo',
      });

      blazar.entityGraphs.get(User).get(data.id).once(user => {
        expect(user).toMatchObject(data);

        done();
      });
    });

    describe('connect', () => {
      it('should throw error if relation does not exist', async () => {
        await expect(
          user.repository
            .create({ username: 'Test' })
            .connect({
              invitedBy: {
                username: 'Test2',
              },
            }),
        ).rejects.toThrow(Error);
      });

      it('should connect if relation does exist', async () => {
        await expect((async () => {
          const test = await user.repository.create({ username: 'Test' });

          const test2 = await user.repository
            .create({ username: 'Test2' })
            .connect({
              invitedBy: test,
            });

          expect(test2).toMatchObject({
            username: 'Test2',
            invitedBy: test,
          });
        })()).rejects.toThrow(Error);
      });
    });
  });
});
