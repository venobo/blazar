import { RelationMetadata } from './relation-metadata.interface';
import { EntitySchema } from '../marshal';

export interface EntityMetadata {
  relations: RelationMetadata[];
  schema: EntitySchema;
}
