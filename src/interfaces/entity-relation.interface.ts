export interface EntityRelation {
  /**
   * @description entity id
   */
  _id: string;
  /**
   * @description field on entity
   */
  field: string;
  /**
   * @description entity name
   */
  name: string;
  /**
   * @description Relation hashes
   */
  relations: string[];
}
