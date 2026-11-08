import type { Field } from '@wordpress/dataviews';

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
 * The JavaScript parts of the fields a script module provides, keyed by field
 * id: what PHP cannot serialize, such as `render`, `Edit`, or `getElements`.
 * It is the shape of the default export of a script module registered along
 * with fields on the server.
 */
type FieldsScriptParts< Item > = Record<
	string,
	Partial< Omit< Field< Item >, 'id' > >
>;

type ModuleImporter = ( id: string ) => Promise< unknown >;

function importModule( id: string ) {
	return import( /* webpackIgnore: true */ /* @vite-ignore */ id );
}

/**
 * Imports the script modules of a fields config and merges their JavaScript
 * parts into the fields.
 *
 * The modules are imported in parallel, but applied in the order the server
 * lists them once all have settled, so a later module overrides an earlier
 * one no matter which finishes loading first. A module only contributes to
 * the fields the server lists for it: a module can hold fields that were
 * never registered, or were unregistered, and those must not show up.
 *
 * A module that fails to load is skipped: its fields keep their server data
 * and lose only their JavaScript parts.
 *
 * @param config   The fields config.
 * @param importer How to import a script module by id.
 * @return The fields, in the server order.
 */
export async function resolveFieldsConfig< Item >(
	config: FieldsConfig,
	importer: ModuleImporter = importModule
): Promise< Field< Item >[] > {
	const modules = config.script_modules ?? [];
	const results = await Promise.allSettled(
		modules.map( ( { id } ) => importer( id ) )
	);

	const partsById = new Map< string, FieldsScriptParts< Item >[ string ] >();
	results.forEach( ( result, index ) => {
		const { id: moduleId, fields: fieldIds } = modules[ index ];
		if ( result.status === 'rejected' ) {
			// eslint-disable-next-line no-console
			console.warn(
				`Could not load the script module ${ moduleId } of the fields of ${ config.kind }/${ config.name }.`,
				result.reason
			);
			return;
		}
		const parts =
			( result.value as { default?: FieldsScriptParts< Item > } )
				?.default ?? {};
		for ( const fieldId of fieldIds ?? [] ) {
			if ( parts[ fieldId ] ) {
				partsById.set( fieldId, {
					...partsById.get( fieldId ),
					...parts[ fieldId ],
				} );
			}
		}
	} );

	return ( config.fields ?? [] ).map(
		( field ) =>
			( {
				...field,
				...partsById.get( field.id ),
			} ) as Field< Item >
	);
}
