import { Type } from '@nestjs/common';

export class InvalidRelationFieldException extends TypeError {
  constructor(entity: Type<any>, field: string) {
    super(`Invalid relation field ${field} on ${entity.name}`);
  }
}
