import { Index, Entity, Field, uuid, forwardRef, Optional } from '../../../src';

@Entity('blazar.users')
export class User {
  @Index()
  id: string = uuid();

  @Field()
  username: string;

  @Field(forwardRef(() => User), { array: true })
  @Optional()
  invitedBy?: User[];
}
