import { Type } from '@nestjs/common';

export class UnknownFieldException extends TypeError {
  constructor(entity: Type<any>, field: string) {
    super(`Unknown field ${field} on ${entity.name}`);
  }
}
