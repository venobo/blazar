import { SetMetadata } from '@nestjs/common';
import { BLAZAR_ENTITY } from '../tokens';

export function Entity(name: string): ClassDecorator {
  return (target: Function) => SetMetadata(BLAZAR_ENTITY, name)(target);
}
