/**
 * A `FieldPath` refers to a field in a document. The path may consist of a
 * single field name (referring to a top-level field in the document), or a
 * list of field names (referring to a nested field in the document).
 *
 * Create a `FieldPath` by providing field names. If more than one field
 * name is provided, the path will point to a nested field in a document.
 */
export declare class FieldPath {
  constructor(...fieldNames: string[]);

  isEqual(other: FieldPath): boolean;
}

/**
 * Returns a special sentinel FieldPath to refer to the ID of a document
 * It can be used in queries to sort or filter by the document ID
 */

export declare function documentId(): FieldPath;
