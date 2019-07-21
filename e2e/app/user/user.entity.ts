import { UUIDField, Index, Entity, Optional, IDField, Field, ParentReference, uuid } from '../../../src';

@Entity('user')
export class User {
  @IDField()
  @UUIDField()
  id?: string;

  @Field()
  @Index({ unique: true })
  username: string;

  //@FieldArray(forwardRef(() => Post))
  //posts: Post[] = [];

  @Optional()
  @Field(User)
  @ParentReference()
  invitedBy?: User;
}

/*@Entity('post')
export class Post {
  @IDField()
  @UUIDField()
  id: string;

  @Field(forwardRef(() => User))
  @ParentReference()
  author: User;
}*/
