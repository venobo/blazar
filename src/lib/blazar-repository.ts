import { DocumentStore } from 'orbit-db-docstore';
import { KeyValueStore } from 'orbit-db-kvstore';
import { Type } from '@nestjs/common';
import { Subject } from 'rxjs';

import { EntityMetadata, RepositoryRelation } from './interfaces';
import { plainToClass, validate } from './utils';
import { Event, RepositoryEvent } from './enums';
import { BlazarService } from './blazar.service';

export class BlazarRepository<T extends { id: string }> {
  public readonly events$ = new Subject<Event<any>>();
  private readonly multihashes = new Set<string>();

  constructor(
    private readonly entity: Type<T>,
    private readonly metadata: EntityMetadata,
    private readonly docs: DocumentStore<T>,
    private readonly relations: KeyValueStore<RepositoryRelation>,
    private readonly blazar: BlazarService,
  ) {
    Object.values(RepositoryEvent).forEach(event => {
      this.docs.events.on(event, (...args: any[]) => {
        this.events$.next({
          event,
          data: args,
        });
      });
    });
  }

  async delete(key: string): Promise<boolean> {
    const hash = await this.docs.del(key);
    return this.multihashes.delete(hash);
  }

  async create(data: Omit<T, 'id'>): Promise<T> {
    const errors = validate(this.entity, data);

    if (errors.length > 0) {
      throw new Error('errors');
    }

    const created = plainToClass(this.entity, data);

    // @ts-ignore
    const hash = await this.docs.put(created);
    this.multihashes.add(hash);

    return created;
  }
}
