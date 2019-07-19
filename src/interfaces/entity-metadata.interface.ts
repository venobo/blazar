import { RelationMetadata } from './relation-metadata.interface';
import { EntitySchema } from '../utils';

export interface EntityMetadata {
  name: string;
  relations: RelationMetadata[];
  schema: EntitySchema;
}