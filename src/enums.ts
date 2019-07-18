export interface Event<T> {
  event: RepositoryEvent;
  data: T;
}

export enum RepositoryEvent {
  REPLICATED = 'replicated',
  REPLICATE = 'replicate',
  REPLICATE_PROGRESS = 'replicate.progress',
  LOAD = 'load',
  LOAD_PROGRESS = 'load.progress',
  READY = 'ready',
  WRITE = 'write',
  CLOSED = 'closed',
}
