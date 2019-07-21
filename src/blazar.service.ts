import { Inject, Injectable, Optional, Type } from '@nestjs/common';
import * as Gun from 'gun';
import 'gun/lib/then';
import 'gun/lib/unset';
import 'gun/lib/not';

import { BlazarGun, BlazarModuleOptions, EntityMetadata, GraphNode, RelationMetadata } from './interfaces';
import { RegisteredEntities, EntitySchema, getEntitySchema } from './marshal';
import { BlazarRepository } from './blazar-repository';
import { BLAZAR_OPTIONS } from './tokens';

@Injectable()
export class BlazarService {
  public readonly gundb = Gun<BlazarGun>(this.options);
  public readonly repositories = new WeakMap<Type<any>, BlazarRepository<any>>();
  public readonly entityGraphs = new WeakMap<Type<any>, GraphNode>();
  // public readonly entityHashMap = new WeakMap<object, string[]>();
  // public readonly entityRelations = new WeakMap<Type<any>, DocumentStore<EntityRelation>>();
  public readonly entityMetadata = new WeakMap<Type<any>, EntityMetadata>();
  public readonly entities = new Map<string, Type<any>>();

  constructor(
    @Optional() @Inject(BLAZAR_OPTIONS)
    private readonly options: BlazarModuleOptions,
  ) {}

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
            isParentReference: propertySchema.isParentReference,
            isArray: propertySchema.isArray,
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
    // await this.orbitdb.disconnect();
  }

  async create(): Promise<void> {}

  async createRepository(entity: Type<any>): Promise<BlazarRepository<any>> {
    const metadata = this.getEntityMetadata(entity);

    const graph = this.gundb.get(metadata.schema.name);
    const schema = graph.get('schema');
    const indices = graph.get('indices');
    // const relations = graph.get('relations');

    /*const docs = await this.orbitdb.docstore<T>(metadata.schema.name, {
      // @ts-ignore
      indexBy: metadata.schema.idField,
    });
    await docs.load();

    const relations = await this.orbitdb.docstore<EntityRelation>(metadata.schema.name + '.relations');
    await relations.load();

    const indices = await this.orbitdb.kvstore<string>(
      metadata.schema.name + '.indices',
    );
    await indices.load();*/

    const repository = new BlazarRepository(
      entity,
      metadata,
      schema,
      this,
    );

    this.repositories.set(entity, repository);
    this.entities.set(metadata.schema.name, entity);
    // this.entityRelations.set(entity, relations);
    this.entityGraphs.set(entity, schema);
    this.entityMetadata.set(entity, metadata);

    return repository;
  }
}
