import { BLAZAR_ENTITY } from '../tokens';

export function Entity(name?: string): ClassDecorator {
  return (target: Function) => {
    const entityName = name ? name : target.name.toLowerCase();
    Reflect.defineMetadata(BLAZAR_ENTITY, entityName, target);
  };
}
