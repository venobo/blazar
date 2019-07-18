import { Type } from '@nestjs/common';

export interface RelationMetadata {
  entity: Type<any>;
  optional: boolean;
  array: boolean;
}
