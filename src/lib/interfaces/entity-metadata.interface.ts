import { RelationMetadata } from './relation-metadata.interface';
import { EntitySchema } from '../utils';

export interface EntityMetadata {
  name: string;
  indexBy: string;
  relations: RelationMetadata[];
  schema: EntitySchema,
}
