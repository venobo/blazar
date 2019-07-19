import { Inject, Injectable, Type } from '@nestjs/common';
import { DocumentStore } from 'orbit-db-docstore';
import OrbitDB from 'orbit-db';

import { BLAZAR_ENTITY_RELATION, BLAZAR_OPTIONS } from './tokens';
import { EntitySchema, getEntitySchema, RegisteredEntities } from './utils';
import { BlazarRepository } from './blazar-repository';
import {
  BlazarModuleOptions,
  EntityMetadata,
  RelationMetadata,
  RelationOptions,
  EntityRelation,
} from './interfaces';

@Injectable()
export class BlazarService {
  public readonly repositories = new WeakMap<Type<any>, BlazarRepository<any>>();
  public readonly entityHashMap = new WeakMap<object, string[]>();
  public readonly entityRelations = new WeakMap<Type<any>, DocumentStore<EntityRelation>>();
  public readonly entityMetadata = new WeakMap<Type<any>, EntityMetadata>();
  public readonly entities = new Map<string, Type<any>>();
  private readonly orbitdb: OrbitDB;
  private readonly scope?: string;

  constructor(@Inject(BLAZAR_OPTIONS) options: BlazarModuleOptions) {
    this.orbitdb = options.orbitdb;
    this.scope = options.scope;
  }

  /*private getEntityRelationOptions(target: Object, propertyName: string): RelationOptions | undefined {
    return Reflect.getMetadata(BLAZAR_ENTITY_RELATION, target, propertyName);
  }*/

  private getEntityRelations({ properties }: EntitySchema): RelationMetadata[] {
    const entities = Object.values(RegisteredEntities);

    return Object.entries(properties).reduce((relations, [propertyName, propertySchema]) => {
      if (propertySchema.type === 'class') {
        const classType = propertySchema.getResolvedClassType();
        // const options = this.getEntityRelationOptions(proto, propertyName);

        if (classType && entities.includes(classType)) {
          relations.push({
            propertyName,
            classType,
          });
        }
      }

      return relations;
    }, []);
  }

  private getEntityMetadata(entity: Type<any>): EntityMetadata {
    const schema = getEntitySchema(entity);
    const relations = this.getEntityRelations(schema);

    if (!('name' in schema)) {
      throw new TypeError(`You need to decorate ${entity.name} with @Entity(name)`);
    }

    if (!schema.idField) {
      throw new Error('You need to define one @IDField() property on ' + entity.name);
    }

    return {
      relations,
      schema,
    };
  }

  async close() {
    await this.orbitdb.disconnect();
  }

  async create(): Promise<void> {}

  async createRepository<T extends { id: string }>(entity: Type<T>): Promise<BlazarRepository<T>> {
    const metadata = this.getEntityMetadata(entity);

    const docs = await this.orbitdb.docstore<T>(metadata.schema.name, {
      // @ts-ignore
      indexBy: metadata.schema.idField,
    });
    await docs.load();

    const relations = await this.orbitdb.docstore<EntityRelation>(metadata.schema.name + '.relations');
    await relations.load();

    const indices = await this.orbitdb.kvstore<string>(
      metadata.schema.name + '.indices',
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
    this.entities.set(metadata.schema.name, entity);
    this.entityRelations.set(entity, relations);
    this.entityMetadata.set(entity, metadata);

    return repository;
  }
}
