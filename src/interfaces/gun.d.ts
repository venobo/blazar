declare module 'gun' {
  export type ArrayOf<T> = T extends Array<infer U> ? U : never;
  export type AllowArray<T> = ArrayOf<T> extends never ? T : ArrayOf<T>;
  export type DisallowArray<T> = ArrayOf<T> extends never ? T : never;
  export type AlwaysDisallowedType<T> = T extends (...args: any[]) => void
    ? never
    : T extends { new (...args: any[]): any }
      ? never
      : AccessObject<T>;
  export type AccessObject<T> = T extends object
    ? { [key in keyof T]: (AlwaysDisallowedType<T[key]> extends never ? never : AccessObject<T[key]>) }
    : T;
  export type DisallowPrimitives<Open, T> = Open extends false
    ? T
    : T extends string
      ? never
      : T extends number
        ? never
        : T extends boolean
          ? never
          : T extends null
            ? never
            : T extends undefined
              ? never
              : T;
  export type ArrayAsRecord<DataType> = ArrayOf<DataType> extends never ? DataType : Record<string, any>;

  export type ConstructorOptions = Partial<{
    file: string;
    web: any;
    s3: {
      key: any;
      secret: any;
      bucket: any;
    };
    peers: Record<string, {}>;
    radisk: boolean;
    localStorage: boolean;
    uuid(): string;
    node: {
      is(anything: any): anything is ChainReference;

      soul(data: ChainReference): string;

      ify(json: any): any;
    };
    /** @see https://gun.eco/docs/SEA */
    SEA: {
      throw?: boolean;
      err?: Error;
      work(
        data: any,
        pair?: any,
        callback?: (data: string | undefined) => void,
        opt?: Partial<{
          name: 'SHA-256' | 'PBKDF2';
          encode: 'base64' | 'base32' | 'base16';
          iterations: number;
          salt: any;
          hash: string;
          length: any;
        }>
      ): Promise<string | undefined>;
      pair(cb: (data: CryptoKeyPair) => void, opt?: {}): Promise<CryptoKeyPair | undefined>;
      sign(data: any, pair: CryptoKeyPair): Promise<string | undefined>;
      verify(message: any, pair: CryptoKeyPair | string): Promise<unknown>;
      encrypt(data: any, pair: CryptoKeyPair | string): Promise<string>;
      decrypt(message: any, pair: CryptoKeyPair | string): Promise<unknown>;
    };
  }>;
  export type Saveable<DataType> = Partial<DataType> | string | number | boolean | null | ChainReference<DataType>;
  export type AckCallback = (ack: { err: Error; ok: any } | { err: undefined; ok: string }) => void;
  export type Parameters<T extends (...args: any[]) => any> = T extends (...args: infer P) => any ? P : never;
  export interface ChainReference<DataType = any, ReferenceKey = any, IsTop extends 'pre_root' | 'root' | false = false> {

    put(
      data: Partial<AlwaysDisallowedType<DisallowPrimitives<IsTop, DisallowArray<DataType>>>>,
      callback?: AckCallback
    ): ChainReference<DataType, ReferenceKey, IsTop>;

    get<K extends keyof DataType>(
      key: ArrayOf<DataType> extends never ? K : never,
      callback?: (
        paramA: Record<
          'gun' | '$' | 'root' | 'id' | 'back' | 'on' | 'tag' | 'get' | 'soul' | 'ack' | 'put',
          any
          >,
        paramB: Record<'off' | 'to' | 'next' | 'the' | 'on' | 'as' | 'back' | 'rid' | 'id', any>
      ) => void
    ): ChainReference<DataType[K], K, IsTop extends 'pre_root' ? 'root' : false>;

    opt(options: ConstructorOptions): ChainReference<DataType, ReferenceKey>;

    back(amount?: number): ChainReference;

    on(
      callback: (
        data: DisallowPrimitives<IsTop, AlwaysDisallowedType<ArrayAsRecord<DataType>>>,
        key: ReferenceKey
      ) => void,
      option?: { change: boolean } | boolean
    ): ChainReference<DataType, ReferenceKey>;

    once(
      callback?: (
        data: (DisallowPrimitives<IsTop, AlwaysDisallowedType<ArrayAsRecord<DataType>>>) | undefined,
        key: ReferenceKey
      ) => void,
      option?: { wait: number }
    ): ChainReference<DataType, ReferenceKey>;

    set(
      data: AlwaysDisallowedType<
        DataType extends Array<infer U>
          ? U extends { [key: string]: any; [key: number]: any }
          ? ArrayOf<DataType>
          : never
          : never
        >,
      callback?: AckCallback
    ): ChainReference<ArrayOf<DataType>>;

    map(
      callback?: (value: ArrayOf<DataType>, key: DataType) => ArrayOf<DataType> | undefined
    ): ChainReference<ArrayOf<DataType>, ReferenceKey>;

    off(): void;

    path?(path: string | string[]): ChainReference;

    not?(callback?: (key: ReferenceKey) => void): ChainReference<DataType, ReferenceKey>;

    open?(callback: (data: ArrayAsRecord<DataType>) => void): ChainReference<DataType, ReferenceKey>;

    load?(callback: (data: ArrayAsRecord<DataType>) => void): ChainReference<DataType, ReferenceKey>;

    then?<TResult1 = ArrayAsRecord<DataType>>(
      onfulfilled?: (value: TResult1) => TResult1 | PromiseLike<TResult1> | void
    ): Promise<TResult1>;

    promise?<
      TResult1 = { put: ArrayAsRecord<DataType>; key: ReferenceKey; gun: ChainReference<DataType, ReferenceKey> }
      >(
      onfulfilled?: (value: TResult1) => TResult1 | PromiseLike<TResult1>
    ): Promise<TResult1>;

    bye?(): {
      put(data: DisallowArray<Saveable<DataType>>): void;
    };

    later?(
      callback: (
        this: ChainReference<DataType, ReferenceKey>,
        data: ArrayAsRecord<DataType>,
        key: ReferenceKey
      ) => void,
      seconds: number
    ): ChainReference<DataType, ReferenceKey>;

    unset?(data: ArrayOf<DataType>): ChainReference<DataType, ReferenceKey>;

    time?(
      callback: (data: ArrayOf<DataType>, key: ReferenceKey, time: number) => void,
      alsoReceiveNOldEvents?: number
    ): ChainReference<DataType, ReferenceKey>;

    time?(data: ArrayOf<DataType>): void;

    create(
      alias: string,
      pass: string,
      cb?: (ack: { ok: 0; pub: string } | { err: string }) => void,
      opt?: {}
    ): ChainReference;

    auth(
      alias: string,
      pass: string,
      cb?: (
        ack:
          | {
          ack: 2;
          get: string;
          on: (...args: [unknown, unknown, unknown]) => unknown;
          put: { alias: string; auth: any; epub: string; pub: string };
          sea: CryptoKeyPair;
          soul: string;
        }
          | { err: string }
      ) => void,
      opt?: {}
    ): ChainReference;

    pair(): CryptoKeyPair;

    leave(opt?: never, cb?: never): ChainReference;

    delete(alias: string, pass: string, cb?: (ack: { ok: 0 }) => void): Promise<void>;

    recall(opt?: { sessionStorage: boolean }, cb?: Parameters<ChainReference['auth']>[2]): ChainReference;

    user(publicKey?: string): ChainReference;
  }

  export type CryptoKeyPair = Record<'pub' | 'priv' | 'epub' | 'epriv', string>;

  function Gun<DataType = any>(options?: string | string[] | ConstructorOptions): ChainReference<DataType, any, 'pre_root'>;

  export = Gun;
}
