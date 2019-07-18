import { BLAZAR_ENTITY } from '../tokens';

export function Entity(name: string): ClassDecorator {
  return (target: Function) => Reflect.defineMetadata(BLAZAR_ENTITY, name, target);
}
