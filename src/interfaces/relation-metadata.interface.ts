import { Type } from '@nestjs/common';

import { RelationOptions } from './relation-options.interface';

export interface RelationMetadata {
  propertyName: string;
  options: RelationOptions;
  target: Type<any>;
}
