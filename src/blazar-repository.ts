import { Type } from '@nestjs/common';
import arrify = require('arrify');

import { plainToClass, PropertySchema, uuid, validate, ValidationFailed } from './marshal';
import { InvalidRelationFieldException, UnknownFieldException } from './exceptions';
import { BlazarService } from './blazar.service';
import { deferredPromise, fromChain } from './utils';
import {
  EntityMetadata,
  RelationMetadata,
  RepositoryDeferredQueryBuilder,
  RepositoryQueryBuilder,
  GraphNode,
} from './interfaces';

export class BlazarRepository<T = any> {
  constructor(
    private readonly entity: Type<T>,
    private readonly metadata: EntityMetadata,
    private readonly graph: GraphNode<T>,
    private readonly manager: BlazarService,
  ) {}

  private getPropertySchema(field: string): PropertySchema {
    return this.metadata.schema.getProperty(field);
  }

  private getIdField() {
    return this.metadata.schema.idField;
  }

  private getIndices() {
    return this.metadata.schema.indices;
  }

  private getRelationMetadata(key: string): RelationMetadata {
    return this.metadata.relations.find(({ propertyName }) => propertyName === key);
  }

  /*private getRelationRepository<R = any>(entity: Type<R>): BlazarRepository<R> {
    return this.manager.repositories.get(entity);
  }*/

  private isIdField(key: string) {
    return this.metadata.schema.idField === key;
  }

  private hasField(key: string): boolean {
    return this.metadata.schema.hasProperty(key);
  }

  private isIndexField(key: string): boolean {
    return this.metadata.schema.indices.some(({ name }) => name === key);
  }

  private isRelationField(key: string): boolean {
    return this.metadata.relations.some(({ propertyName }) => propertyName === key);
  }

  private getRelationFields(): string[] {
    return this.metadata.relations.map(({ propertyName }) => propertyName);
  }

  private getRepositoryByField<K extends keyof T>(field: string): BlazarRepository<T[K]> {
    const { classType } = this.getRelationMetadata(field);
    return this.manager.repositories.get(classType);
  }

  private getEntityGraph<K extends keyof T>(field: string): GraphNode<T[K]> {
    const { classType } = this.getRelationMetadata(field);
    return this.manager.entityGraphs.get(classType);
  }

  private getRootNode(root: T) {
    const idField = this.getIdField();
    return this.graph.get(root[idField]);
  }

  /*private getRelatedDataHash(insertion: T): string[] {
    return this.manager.entityHashMap.get(insertion);
  }*/

  private createQueryBuilder(
    { root, connect, select, include }: RepositoryDeferredQueryBuilder<this, T>,
  ): RepositoryQueryBuilder<T> {
    const promise = deferredPromise(this, root) as RepositoryQueryBuilder<T>;

    if (connect) {
      promise.connect = async (where: T) => await connect.bind(this)(await promise, where);
    }

    if (include) {
      promise.include = async (where: T) => await include.bind(this)(await promise, where);
    }

    if (select) {
      promise.select = async (where: T) => await select.bind(this)(await promise, where);
    }

    // subscribe

    return promise;
  }

  /*private async createRelations(relations: EntityRelation[]) {
    await Promise.all(relations.map(async (relation) => {
      // @ts-ignore
      await this.relations.put(relation);
    }));
  }*/

  private validate(data: T): T {
    const errors = validate(this.entity, { ...data });

    if (errors.length > 0) {
      throw new ValidationFailed(errors);
    }

    return data;
  }

  /*find(where: T): RepositoryQueryBuilder<T> {
    const { indices, getIndex } = this.metadata.schema;

    return this.createQueryBuilder({
      async resolve() {
        for (const [key, value] of Object.entries(where)) {
          if (!this.hasField(key)) {
            throw new UnknownFieldException(this.entity, key);
          }

          if (this.isIndexField(key)) {

          }

          if (this.isIdField(key)) {

          }
        }
      },
      async include(data: T, where: T) {
        const findHash = this.getRelatedDataHash(data);
        // use data id
        const relations = await this.relations.get(findHash);

        for (const [key, value] of Object.entries(where)) {

          if (!this.isRelationField(key)) {
            throw new InvalidRelationFieldException(this.entity, key);
          }

          const { target } = this.getRelationMetadata(key);
          const repository = this.getRelationRepository(target);

          if (!!value) {
            data[key] = repository.find();
          } else if (typeof value === 'object') {
            // @TODO: Find
            data[key] = repository.find().include(value);
          } else {
            throw new Error('test');
          }
        }
      }
    });
  }
 */

  find(id: string): RepositoryQueryBuilder<null | T>;
  find(where: string | T ): RepositoryQueryBuilder<null | T | T[]> {
    const idField = this.getIdField();

    return this.createQueryBuilder({
      async root() {
        if (typeof where === 'string') {
          try {
            return await fromChain(this.graph.get(where));
          } catch {}

          return null;
        }
      }
    });
  }

  /**
   const data = await userRepository
    .create({ username: 'Venobo' })
    .connect({ invitedBy: { username: 'Github' } });
   */
  create(input: T): RepositoryQueryBuilder<T> {
    // const relationFields = this.getRelationFields();
    const idField = this.getIdField();

    return this.createQueryBuilder({
      async root() {
        const id = input[idField] || (input[idField] = uuid());
        const data = this.validate(input);

        const relatedPropertyNodes: { id: string, property: PropertySchema, node: GraphNode }[] = [];
        const nodeData: Partial<T> = {};

        // @TODO: Make diagram over relation tables
        await Promise.all(Object.entries(data).map(async ([field, value]) => {
          const property = this.getPropertySchema(field);

          if (this.isRelationField(field)) {
            const repository = this.getRepositoryByField(field);

            await Promise.all(arrify(value).map(async (value) => {
              // @ts-ignore
              const { id } = await repository.create(value);
              const graph = this.getEntityGraph(field);
              const node = graph.get(id);

              relatedPropertyNodes.push({
                property,
                node,
                id,
              });
            }));

            nodeData[field] = data[field];
            delete data[field];
          }
        }));

        const createdNode = await this.graph.get(id).put(data);

        await Promise.all(relatedPropertyNodes.map(async ({ property, node }) => {
          // @ts-ignore
          await createdNode.get(property.name).set(node);
        }));

        return plainToClass(this.entity, { ...data, ...nodeData });
      },
      // @TODO: Needs to be coded
      async connect(root: T, where: T) {
        const rootNode = this.getRootNode(root);

        await Promise.all(Object.entries(where).map(async ([field, value]) => {
          if (!this.hasField(field)) {
            throw new UnknownFieldException(this.entity, field);
          }

          if (!this.isRelationField(field)) {
            throw new InvalidRelationFieldException(this.entity, field);
          }

          // @TODO: Indices and querying as well
          // @TODO: Check for parent references
          const graph = this.getEntityGraph(field);
          const node = graph.get(value);

          // @ts-ignore
          await rootNode.get(field)
            .not(() => { throw new Error('Relation doesnt exist, did you mean to create it?'); })
            .set(node);
        }));

        return root;
      },
      // @TODO: Needs to be coded
      /*async include(data: T, where: T) {
        const createdHash = this.getRelatedDataHash(data);
        // data id
        const { indices } = this.metadata.schema;
        const relations = await this.relations.get(createdHash);

        for (const [key, value] of Object.entries(where)) {
          if (!this.isRelationField(key)) {
            throw new InvalidRelationFieldException(this.entity, key);
          }

          const { target } = this.getRelationMetadata(key);
          const repository = this.getRelationRepository(target);

          if (!!value) {
            data[key] = ;
          } else {
            // @TODO: Find
          }
        }

        return data;
      }*/
    });
  }
}
