export { loadEntityFields, useEntityFields } from './entity-fields';

/**
 * The JavaScript parts of the fields a script module provides, keyed by field
 * id: what PHP cannot serialize, such as `render`, `Edit`, or `getElements`.
 * It is the shape of the default export of a script module registered along
 * with fields on the server.
 */
export type { FieldsScriptParts } from './entity-fields';
