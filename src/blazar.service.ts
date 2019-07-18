import { Inject, Injectable, Type } from '@nestjs/common';
import OrbitDB from 'orbit-db';

import { BLAZAR_ENTITY, BLAZAR_ENTITY_RELATION, BLAZAR_OPTIONS } from './tokens';
import { BlazarRepository } from './blazar-repository';
import {
  BlazarModuleOptions,
  EntityMetadata,
  RelationMetadata,
  RelationOptions,
  RepositoryRelation,
} from './interfaces';
import { EntitySchema, getEntitySchema } from './utils';
import { Reflector } from '@nestjs/core';

@Injectable()
export class BlazarService {
  public readonly repositories = new WeakMap<Type<any>, BlazarRepository<any>>();
  public readonly entityHashMap = new WeakMap<object, string>();
  // public readonly entityMetadata = new WeakMap<Type<any>, EntityMetadata>();
  public readonly entities = new Map<string, Type<any>>();
  private readonly orbitdb: OrbitDB;
  private readonly scope?: string;

  constructor(
    @Inject(BLAZAR_OPTIONS) options: BlazarModuleOptions,
    private readonly reflector: Reflector,
  ) {
    this.orbitdb = options.orbitdb;
    this.scope = options.scope;
  }

  private getEntityRelationOptions(target: Object, propertyName: string): RelationOptions | undefined {
    return Reflect.getMetadata(BLAZAR_ENTITY_RELATION, target, propertyName);
  }

  private getEntityRelations({ propertyNames, properties, proto }: EntitySchema): RelationMetadata[] {
    return propertyNames.reduce((relations, propertyName) => {
      const { classType } = properties[propertyName];

      const options = this.getEntityRelationOptions(proto, propertyName);
      if (classType && options) {
        relations.push({
          target: classType,
          propertyName,
          options,
        });
      }

      return relations;
    }, []);
  }

  private getEntityMetadata(entity: Type<any>): EntityMetadata {
    const name = this.reflector.get<string>(BLAZAR_ENTITY, entity);
    const schema = getEntitySchema(entity);
    const relations = this.getEntityRelations(schema);

    if (!schema.idField) {
      throw new Error('You need to define one @IDField() property on ' + entity.name);
    }

    return {
      relations,
      schema,
      name,
    };
  }

  async find() {}

  async close() {
    await this.orbitdb.disconnect();
  }

  async create(): Promise<void> {
    // this.relationStore = await this.orbitdb.keyvalue(BLAZAR_RELATIONS_ADDRESS);
  }

  async createRepository<T extends { id: string }>(entity: Type<T>): Promise<BlazarRepository<T>> {
    const metadata = this.getEntityMetadata(entity);

    if (this.entities.has(metadata.name)) {
      throw new Error('An entity already exists with given name: ' + metadata.name);
    }

    const docs = await this.orbitdb.docstore<T>(metadata.name, {
      // @ts-ignore
      indexBy: metadata.schema.idField,
    });

    await docs.load();

    const relations = await this.orbitdb.kvstore<string[]>(
      metadata.name + '.relations',
    );

    await relations.load();

    const indices = await this.orbitdb.kvstore<string>(
      metadata.name + '.indices',
    );

    await indices.load();

    const repository = new BlazarRepository(
      entity,
      metadata,
      docs,
      relations,
      indices,
      this,
    );

    this.repositories.set(entity, repository);
    this.entities.set(metadata.name, entity);

    // this.repositories.set(metadata.name, repository);
    // this.entityMetadata.set(entity, metadata);
    // this.entities.set(metadata.name, entity);

    return repository;
  }
}
