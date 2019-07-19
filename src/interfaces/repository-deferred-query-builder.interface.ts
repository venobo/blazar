export interface RepositoryDeferredQueryBuilder<R, T> {
  root: (this: R) => Promise<T>;
  select?: (this: R, root: T, where: Partial<T>) => Promise<T>;
  include?: (this: R, root: T, where: Partial<T>) => Promise<T>;
  connect?: (this: R, root: T, where: Partial<T>) => Promise<T>;
}
