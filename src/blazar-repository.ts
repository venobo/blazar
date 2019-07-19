import { DocumentStore } from 'orbit-db-docstore';
import { KeyValueStore } from 'orbit-db-kvstore';
import { Type } from '@nestjs/common';
import { Subject } from 'rxjs';
import arrify = require('arrify');

import { plainToClass, uuid, validate, ValidationFailed, deferredPromise } from './utils';
import { Event, RepositoryEvent } from './enums';
import { BlazarService } from './blazar.service';
import { InvalidRelationFieldException, UnknownFieldException } from './exceptions';
import {
  EntityMetadata,
  RelationMetadata,
  RepositoryDeferredQueryBuilder,
  RepositoryQueryBuilder,
  EntityRelation,
} from './interfaces';

export class BlazarRepository<T extends object> {
  public readonly events$ = new Subject<Event<any>>();

  constructor(
    private readonly entity: Type<T>,
    private readonly metadata: EntityMetadata,
    private readonly docs: DocumentStore<T>,
    private readonly relations: DocumentStore<EntityRelation>,
    private readonly indices: KeyValueStore<string>,
    private readonly manager: BlazarService,
  ) {
    Object.values(RepositoryEvent).forEach(event => {
      this.docs.events.on(event, (...data: any[]) => {
        this.events$.next({
          event,
          data,
        });
      });
    });
  }

  private getRelationMetadata(key: string): RelationMetadata {
    return this.metadata.relations.find(({ propertyName }) => propertyName === key);
  }

  private getRelationRepository(entity: Type<any>): BlazarRepository<any> {
    return this.manager.repositories.get(entity);
  }

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

  // @TODO: Should event emitters be used instead ?
  async delete(key: string): Promise<string> {
    if (this.metadata.relations.length > 0) {

    }

    const hash = await this.docs.del(key);

    // if key gets deleted and it exists in relation table
    // delete all relations as well
    return hash;
  }

  private getRelatedDataHash(insertion: T): string[] {
    return this.manager.entityHashMap.get(insertion);
  }

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

    return promise;
  }

  private async createRelations(relations: EntityRelation[]) {
    await Promise.all(relations.map(async (relation) => {
      // @ts-ignore
      await this.relations.put(relation);
    }));
  }

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



    // for each index and id field
    // await this.indices.set(created[idField], createdHash);
  }*/

  /**
   const data = await userRepository
    .create({ username: 'Venobo' })
    .connect({ invitedBy: { username: 'Github' } });
   */
  create(input: T): RepositoryQueryBuilder<T> {
    const { idField } = this.metadata.schema;

    const data = this.validate(input);

    return this.createQueryBuilder({
      async root() {
        const entityRelations: EntityRelation[] = [];
        const insertedRelations: { field: string, relation: T }[] = [];
        const _id = data[idField] || (data[idField] = uuid());

        // @TODO: Make diagram over relation tables
        for (const [field, value] of Object.entries(data)) {
          if (value != null && this.isRelationField(field)) {
            const { classType } = this.getRelationMetadata(field);
            const repository = this.getRelationRepository(classType);
            const { schema: { name } } = this.manager.entityMetadata.get(classType);

            const insertedRelation = await repository.create(value);
            // could be multiple hashes
            const relations = this.getRelatedDataHash(insertedRelation);

            entityRelations.push({
              relations: arrify(relations),
              field,
              name,
              _id,
            });

            insertedRelations.push({
              relation: insertedRelation,
              field,
            });

            delete data[field];
          }
        }

        const created = plainToClass(this.entity, data);

        // @ts-ignore
        const createdHash = await this.docs.put(created);
        // for each index and id field
        await this.indices.set(_id, createdHash);

        this.manager.entityHashMap.set(created, createdHash);

        await this.createRelations(entityRelations);

        return insertedRelations.reduce((data, { field, relation }) => ({
          ...data,
          [field]: relation,
        }), created);
      },
      // @TODO: Needs to be coded
      async connect(root: T, where: T) {
        const rootHash = this.getRelatedDataHash(root);

        for (const [field, value] of Object.entries(where)) {
          if (!this.hasField(field)) {
            throw new UnknownFieldException(this.entity, field);
          }

          if (!this.isRelationField(field)) {
            throw new InvalidRelationFieldException(this.entity, field);
          }
        }

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
