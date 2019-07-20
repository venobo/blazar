import { Entity, Field, FieldArray, } from '../decorators';
import { emptyObj, forwardRef, getEntitySchema } from '../utils';
import { RegisteredEntities } from '../enums';

import { BlazarService } from '../blazar.service';

describe('BlazarService', () => {
  let blazar: any;

  beforeEach(() => {
    emptyObj(RegisteredEntities);
    // @ts-ignore
    blazar = new BlazarService({});
  });

  describe('getEntityRelations', () => {
    it('should not return any relations', () => {
      @Entity('post')
      class Post {}

      const schema = getEntitySchema(Post);
      expect(blazar.getEntityRelations(schema)).toHaveLength(0);
    });

    it('should return entity relations', () => {
      @Entity('post')
      class Post {}

      @Entity('user')
      class User {
        @FieldArray(Post)
        posts: Post[] = [];
      }

      const schema = getEntitySchema(User);
      expect(blazar.getEntityRelations(schema)).toMatchObject([{
        propertyName: 'posts',
        classType: Post,
      }]);
    });

    it('should resolve forward referenced classes as entity relations', () => {
      @Entity('user')
      class User {
        @FieldArray(forwardRef(() => Post))
        posts: Post[] = [];
      }

      @Entity('post')
      class Post {
        @Field(forwardRef(() => User))
        // @ParentReference()
        user: User;
      }

      const userSchema = getEntitySchema(User);
      expect(blazar.getEntityRelations(userSchema)).toMatchObject([{
        propertyName: 'posts',
        classType: Post,
      }]);

      const postSchema = getEntitySchema(Post);
      expect(blazar.getEntityRelations(postSchema)).toMatchObject([{
        propertyName: 'user',
        classType: User,
      }]);
    });
  });
});
