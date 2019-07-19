export interface RepositoryQueryBuilder<T> extends Promise<T> {
  connect?(where: Partial<T>): Promise<T>;
  select?(where: Partial<T>): Promise<T>;
  include?(where: Partial<T>): Promise<T>;
}
