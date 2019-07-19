import { Type } from '@nestjs/common';
import { CircularDependencyException } from '@nestjs/core/errors/exceptions/circular-dependency.exception';
import { Observable } from 'rxjs';
import { filter, pluck } from 'rxjs/operators';

import { Event, RepositoryEvent } from './enums';

export { validate, plainToClass, classToPlain, getEntitySchema, Types, EntitySchema, uuid, ValidationError, ValidationFailed, RegisteredEntities } from '@marcj/marshal';

export function deferredPromise<C, T>(context: C, fn: () => Promise<T>) {
  return new Promise<T>((resolve, reject) => fn.bind(context)().then(resolve, reject));
}

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
