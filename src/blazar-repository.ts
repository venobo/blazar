import { DocumentStore } from 'orbit-db-docstore';
import { KeyValueStore } from 'orbit-db-kvstore';
import { Type } from '@nestjs/common';
import { Subject } from 'rxjs';

import { EntityMetadata, RelationMetadata, RepositoryDeferredQueryBuilder, RepositoryQueryBuilder } from './interfaces';
import { plainToClass, uuid, validate, ValidationFailed } from './utils';
import { Event, RepositoryEvent } from './enums';
import { BlazarService } from './blazar.service';

export class BlazarRepository<T extends object> {
  public readonly events$ = new Subject<Event<any>>();

  constructor(
    private readonly entity: Type<T>,
    private readonly metadata: EntityMetadata,
    private readonly docs: DocumentStore<T>,
    private readonly relations: KeyValueStore<string[]>,
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

  private isRelation(key: string): boolean {
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

  private getRelatedDataHash(insertion: T) {
    return this.manager.entityHashMap.get(insertion);
  }

  private createQueryBuilder(
    { parent, connect, select }: RepositoryDeferredQueryBuilder<this, T>,
  ): RepositoryQueryBuilder<T> {
    const promise = new Promise<T>(async (resolve, reject) => {
      try {
        resolve(await parent.bind(this)());
      } catch (e) {
        reject(e);
      }
    }) as RepositoryQueryBuilder<T>;

    if (connect) {
      promise.connect = async (where: T) => await connect.bind(this)(where, await promise);
    }

    promise.select = async (where: T) => await select.bind(this)(where, await promise);

    return promise;
  }

  private validate(data: T): T {
    const errors = validate(this.entity, { ...data });

    if (errors.length > 0) {
      throw new ValidationFailed(errors);
    }

    return data;
  }

  /**
   const data = await userRepository
    .create({ username: 'Venobo' })
    .connect({ invitedBy: { username: 'Github' } });
   */
  create(input: T): RepositoryQueryBuilder<T> {
    const { idField } = this.metadata.schema;
    input[idField] = uuid();

    const data = this.validate(input);

    return this.createQueryBuilder({
      async parent() {
        const relationHashes: string[] = [];

        // @TODO: Make diagram over relation tables
        for (const [key, value] of Object.entries(data)) {
          if (value != null && this.isRelation(key)) {
            const { target } = this.getRelationMetadata(key);
            const repository = this.getRelationRepository(target);

            const insertedRelation = await repository.create(value);
            const relationHash = this.getRelatedDataHash(insertedRelation);

            relationHashes.push(relationHash);

            this.manager.entityHashMap.delete(insertedRelation);
            delete data[key];
          }
        }

        const created = plainToClass(this.entity, data);

        // @ts-ignore
        const createdHash = await this.docs.put(created);
        await this.indices.set(created[idField], createdHash);

        this.manager.entityHashMap.set(created, createdHash);

        if (relationHashes.length > 0) {
          await this.relations.set(createdHash, relationHashes);
        }

        return created;
      },
      // @TODO: Needs to be coded
      async connect(where: T & { id: string }, parent: T) {
        const parentHash = this.getRelatedDataHash(parent);

        for (const key of Object.keys(where)) {
          if (!this.isRelation(key)) {
            throw new TypeError('invalid relation key ' + key);
          }
        }

        // const { target } = this.getRelationMetadata(key);
        // const repository = this.getRelationRepository(target);

        // imagine there only was ID right now
        const { idField } = this.metadata.schema;
        const hash = this.indices.get(idField + '.' + where[idField]);
        console.log(hash);

        await this.relations.set(parentHash, [hash]);

        // get hash by id
        /*repository.docs.query(data => {
          console.log(data);
        });*/

        // const insertedRelation = await repository.create(value);
        // const relationHash = this.getRelatedInsertionHash(insertedRelation);

        return parent;
      }
    });
  }
}
