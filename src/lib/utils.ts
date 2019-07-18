import { Type } from '@nestjs/common';
import { CircularDependencyException } from '@nestjs/core/errors/exceptions/circular-dependency.exception';
import { Event, RepositoryEvent } from './enums';
import { Observable } from 'rxjs';
import { filter, pluck } from 'rxjs/operators';

export { validate, plainToClass, classToPlain, getEntitySchema, Types, EntitySchema, uuid } from '@marcj/marshal';

export function ofEvent<T = any>(event: RepositoryEvent) {
  return (source$: Observable<Event<T>>): Observable<T> =>
    source$.pipe(
      filter(e => e.event === event),
      pluck('data'),
    );
}

export function getRepositoryToken(entity: Type<any>): string {
  if (!entity) {
    throw new CircularDependencyException(`@InjectRepository()`);
  }

  return `${entity.name}Repository`;
}
