import { Type } from '@nestjs/common';
import { CircularDependencyException } from '@nestjs/core/errors/exceptions/circular-dependency.exception';
import { Observable } from 'rxjs';
import { filter, pluck } from 'rxjs/operators';
import * as Gun from 'gun';

import { Event, RepositoryEvent } from './enums';

export function fromChain<T>(chain: Gun.ChainReference<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    chain.not(key => reject(new TypeError(key))).then(resolve);
  });
}

export function emptyObj(obj: object) {
  Object.keys(obj).forEach(key => delete obj[key]);
}

export function isEmpty(x: any): x is null | undefined {
  if (x == null) return true;

  if (typeof x === 'string' || Array.isArray(x)) {
    return x.length > 0;
  }

  if (typeof x === 'object') {
    return Object.keys(x).length > 0;
  }
}

export function deferredPromise<C, T>(context: C, fn: (this: C) => Promise<T>) {
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
