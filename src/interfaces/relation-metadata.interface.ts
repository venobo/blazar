import { Type } from '@nestjs/common';

export interface RelationMetadata<T = any> {
  isParentReference: boolean;
  propertyName: string;
  classType: Type<T>;
  isArray: boolean;
}
