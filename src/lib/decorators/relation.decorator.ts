import { SetMetadata, Type } from '@nestjs/common';

import { BLAZAR_ENTITY_RELATION } from '../tokens';
import { RelationMetadata } from '../interfaces';

export function Relation(type: () => Type<any> | Type<any>[]): PropertyDecorator {
  return (target: Object, propertyKey: string | symbol) => {
    const entity = type();
    const array = Array.isArray(entity);

    const metadata: RelationMetadata = {
      optional: false,
      entity: array ?
        (entity as Type<any>[])[0]
        : entity as Type<any>,
      array,
    };

    SetMetadata(BLAZAR_ENTITY_RELATION, metadata)(target, propertyKey);
  };
}
