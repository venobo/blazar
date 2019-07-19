import { RelationMetadata } from './relation-metadata.interface';
import { EntitySchema } from '../utils';

export interface EntityMetadata {
  relations: RelationMetadata[];
  schema: EntitySchema;
}
