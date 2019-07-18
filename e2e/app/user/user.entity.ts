import { Index, Entity, Optional, IDField, Field, Relation } from '../../../src';

@Entity('blazar.users')
export class User {
  @IDField()
  id?: string;

  @Field()
  @Index({ unique: true })
  username: string;

  @Optional()
  @Field(User)
  @Relation()
  invitedBy?: User;
}
