export interface RepositoryDeferredQueryBuilder<R, T> {
  parent: (this: R) => Promise<T>;
  select?: (this: R, where: Partial<T>, previous: T) => Promise<T>;
  connect?: (this: R, where: Partial<T>, previous: T) => Promise<T>;
}
