import * as Gun from 'gun';

export type GraphNode<T = any> = Gun.ChainReference<{ [id: string]: T }>;
