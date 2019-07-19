import { Inject, Type } from '@nestjs/common';
import { getRepositoryToken } from '../utils';

export const InjectRepository = (entity: Type<any>) => Inject(getRepositoryToken(entity));
