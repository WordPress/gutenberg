import type { Field } from '@wordpress/dataviews';

/**
 * The JavaScript parts of the fields a script module provides, keyed by field
 * id: what PHP cannot serialize, such as `render`, `Edit`, or `getElements`.
 *
 * It is the shape of the default export of a script module registered along
 * with fields on the server. The script modules of this package are the
 * reference implementation of such modules; a plugin's own field module
 * follows the same shape.
 */
export interface FieldsScriptParts< Item = any > {
	[ fieldId: string ]: Partial< Omit< Field< Item >, 'id' > >;
}
