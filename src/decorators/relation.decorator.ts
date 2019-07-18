import { BLAZAR_ENTITY_RELATION } from '../tokens';
import { RelationOptions } from '../interfaces';

export function Relation(options: RelationOptions = {}): PropertyDecorator {
  return (target: Object, property: string) => {
    Reflect.defineMetadata(BLAZAR_ENTITY_RELATION, options, target, property);
  };
}
