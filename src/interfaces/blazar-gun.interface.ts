export interface BlazarGun {
  [entity: string]: {
    schema: {
      [id: string]: {
        [field: string]: any;
      };
    };
    indices: any;
  };
}
