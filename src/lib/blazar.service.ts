import { Inject, Injectable, Type } from '@nestjs/common';
import { KeyValueStore } from 'orbit-db-kvstore';
import { OrbitDB } from 'orbit-db';
import { Reflector } from '@nestjs/core';

import { BLAZAR_ENTITY, ORBIT_DB, BLAZAR_RELATIONS_ADDRESS } from './tokens';
import { BlazarRepository } from './blazar-repository';
import { EntityMetadata, RepositoryRelation } from './interfaces';
import { getEntitySchema } from './utils';

@Injectable()
export class BlazarService {
  public readonly repositories = new Map<string, BlazarRepository<any>>();
  public readonly entityMetadata = new WeakMap<Type<any>, EntityMetadata>();
  public readonly entities = new Map<string, Type<any>>();
  public relationStore: KeyValueStore<unknown>;

  constructor(
    @Inject(ORBIT_DB)
    private readonly orbit: OrbitDB,
    private readonly reflector: Reflector,
  ) {}

  private getEntityMetadata(entity: Type<any>): EntityMetadata {
    const name = this.reflector.get<string>(BLAZAR_ENTITY, entity);
    const schema = getEntitySchema(entity);
    const indexBy = schema.indices[0].name!;
    // @TODO: Get relations for lazy loading of objects
    const relations: any[] = [];

    return {
      relations,
      schema,
      name,
      indexBy,
    };
  }

  async close() {
    await this.orbit.disconnect();
  }

  async create(): Promise<void> {
    this.relationStore = await this.orbit.keyvalue(BLAZAR_RELATIONS_ADDRESS);
  }

  async createRepository<T extends { id: string }>(entity: Type<T>): Promise<BlazarRepository<T>> {
    const metadata = this.getEntityMetadata(entity);

    if (this.entities.has(metadata.name)) {
      throw new Error('An entity already exists with given name: ' + metadata.name);
    }

    const docs = await this.orbit.docstore<T>(metadata.name, {
      // @ts-ignore
      indexBy: metadata.indexBy,
    });

    await docs.load();

    const relations = await this.orbit.kvstore<RepositoryRelation>(
      metadata.name + '.relations',
    );

    await relations.load();

    const repository = new BlazarRepository(
      entity,
      metadata,
      docs,
      relations,
      this,
    );

    this.repositories.set(metadata.name, repository);
    this.entityMetadata.set(entity, metadata);
    this.entities.set(metadata.name, entity);

    return repository;
  }
}
