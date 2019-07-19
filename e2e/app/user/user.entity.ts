import { Index, Entity, Optional, IDField, Field, Relation, uuid } from '../../../src';

@Entity()
export class User {
  @IDField()
  id?: string = uuid();

  @Field()
  @Index({ unique: true })
  username: string;

  @Optional()
  @Field(User)
  @Relation()
  invitedBy?: User;
}
