import type { Field } from '@wordpress/dataviews';
import { resolveScriptModuleParts } from '../resolve-script-module-parts';
import type { ModuleImporter } from '../resolve-script-module-parts';

/**
 * The fields registered on the server for an entity, as the
 * `/wp/v2/entity-fields` route returns them and the private `getFieldsConfig`
 * selector of the core data store holds them.
 */
export type FieldsConfig = {
	kind: string;
	name: string;
	fields: Array< { id: string } & Record< string, any > >;
	script_modules: Array< { id: string; fields: string[] } >;
};

/**
 * The JavaScript parts of a field: what PHP cannot serialize, such as
 * `render`, `Edit`, or `getElements`. The default export of a script module
 * registered along with fields on the server maps field ids to them.
 */
type FieldScriptParts< Item > = Partial< Omit< Field< Item >, 'id' > >;

/**
 * Imports the script modules of a fields config and merges their JavaScript
 * parts into the fields, see `resolveScriptModuleParts`.
 *
 * @param config   The fields config.
 * @param importer How to import a script module by id.
 * @return The fields, in the server order.
 */
export async function resolveFieldsConfig< Item >(
	config: FieldsConfig,
	importer?: ModuleImporter
): Promise< Field< Item >[] > {
	const fields = await resolveScriptModuleParts<
		FieldsConfig[ 'fields' ][ number ],
		FieldScriptParts< Item >
	>(
		config.fields ?? [],
		( config.script_modules ?? [] ).map( ( { id, fields: ids } ) => ( {
			id,
			ids,
		} ) ),
		`fields of ${ config.kind }/${ config.name }`,
		importer
	);
	return fields as Field< Item >[];
}
