import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { useEffect, useMemo, useState } from '@wordpress/element';
import type { Field } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';

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

const EMPTY_FIELDS: Field< any >[] = [];

function importModule( id: string ) {
	return import( /* webpackIgnore: true */ /* @vite-ignore */ id );
}

/**
 * Turns a rejection into an `Error` a screen can show.
 *
 * A failed `apiFetch` rejects with a plain `{ code, message, data }` object
 * rather than an `Error`, so the server's own message is used when there is
 * one. Anything else — a `Response` from `parse: false`, a rejection from a
 * custom fetch handler, nothing at all — falls back to copy of our own, so
 * the screen always has something to render.
 *
 * @param value The rejection.
 * @return An `Error` whose `cause` is the original rejection.
 */
function toError( value: unknown ): Error {
	if ( value instanceof Error ) {
		return value;
	}
	const serverMessage = ( value as { message?: unknown } )?.message;
	const message =
		typeof serverMessage === 'string' && serverMessage.trim()
			? serverMessage
			: __(
					"The fields of this screen didn't load. Reload the page to try again."
				);
	return new Error( message, { cause: value } );
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

/*
 * One resolution per fields config the store holds, so every caller gets the
 * same field objects and each module is applied once.
 */
const resolvedFieldsConfigs = new WeakMap<
	FieldsConfig,
	Promise< Field< any >[] >
>();

function getResolvedFields< Item >(
	config: FieldsConfig
): Promise< Field< Item >[] > {
	let resolved = resolvedFieldsConfigs.get( config );
	if ( ! resolved ) {
		resolved = resolveFieldsConfig( config );
		resolvedFieldsConfigs.set( config, resolved );
	}
	return resolved;
}

/**
 * Adds the fields a plugin registered on the client, with the public
 * `registerEntityField`, after the fields from the server.
 *
 * The server fields win: a plugin field whose id the server returns is left
 * out, as the server registers the defaults a plugin may have meant to
 * override. Registering fields on the client keeps working until plugins can
 * move to the server.
 *
 * @param serverFields The fields from the server.
 * @param pluginFields The fields registered on the client.
 * @return The fields, the server ones first. The server list itself when no
 *         plugin field is added, so its identity holds.
 */
export function mergePluginFields< Item >(
	serverFields: Field< Item >[],
	pluginFields: Field< Item >[]
): Field< Item >[] {
	if ( ! pluginFields.length ) {
		return serverFields;
	}
	const serverIds = new Set( serverFields.map( ( { id } ) => id ) );
	const addedFields = pluginFields.filter(
		( { id } ) => ! serverIds.has( id )
	);
	return addedFields.length
		? [ ...serverFields, ...addedFields ]
		: serverFields;
}

/**
 * Returns the fields of an entity.
 *
 * Requests the fields registered on the server from the
 * `/wp/v2/entity-fields` route through the core data store, imports the script
 * modules registered along with them, and merges their JavaScript parts in.
 * The fields a plugin registers on the client with `registerEntityField`
 * follow the server ones, unless the server returns a field with the same id,
 * and update as plugins register them.
 *
 * @param config           The entity.
 * @param config.kind      Entity kind (e.g. `postType`).
 * @param config.name      Entity name (e.g. `page`).
 * @param config.isEnabled Whether to request the fields. When `false`, the
 *                         hook requests nothing and returns no fields, for a
 *                         caller that reads them from elsewhere.
 * @return The fields, the server ones first, in the server order (empty until
 *         they load), whether they are still loading, and the error when they
 *         could not be requested.
 */
export function useFields< Item = any >( {
	kind,
	name,
	isEnabled = true,
}: {
	kind: string;
	name: string;
	isEnabled?: boolean;
} ): {
	fields: Field< Item >[];
	isLoading: boolean;
	error?: Error;
} {
	const { config, error, pluginFields } = useSelect(
		( _select ) => {
			if ( ! isEnabled ) {
				return {
					config: undefined,
					error: undefined,
					pluginFields: EMPTY_FIELDS as Field< Item >[],
				};
			}
			const { getFieldsConfig, getResolutionError } = unlock(
				_select( coreStore )
			);
			return {
				config: getFieldsConfig( kind, name ) as
					FieldsConfig | undefined,
				error: getResolutionError( 'getFieldsConfig', [
					kind,
					name,
				] ) as unknown,
				pluginFields: unlock(
					_select( editorStore )
				).getEntityPluginFields( kind, name ) as Field< Item >[],
			};
		},
		[ kind, name, isEnabled ]
	);

	const [ resolved, setResolved ] = useState< {
		config: FieldsConfig;
		fields: Field< Item >[];
	} >();

	const normalizedError = useMemo(
		() => ( error ? toError( error ) : undefined ),
		[ error ]
	);

	useEffect( () => {
		if ( ! config ) {
			return;
		}
		let isCurrent = true;
		getResolvedFields< Item >( config ).then( ( fields ) => {
			if ( isCurrent ) {
				setResolved( { config, fields } );
			}
		} );
		return () => {
			isCurrent = false;
		};
	}, [ config ] );

	const isResolved = !! config && resolved?.config === config;
	const serverFields = isResolved ? resolved.fields : undefined;
	const fields = useMemo(
		() =>
			serverFields
				? mergePluginFields( serverFields, pluginFields )
				: undefined,
		[ serverFields, pluginFields ]
	);

	if ( ! isEnabled ) {
		return { fields: EMPTY_FIELDS, isLoading: false };
	}
	if ( normalizedError ) {
		return {
			fields: EMPTY_FIELDS,
			isLoading: false,
			error: normalizedError,
		};
	}
	if ( ! fields ) {
		return { fields: EMPTY_FIELDS, isLoading: true };
	}
	return { fields, isLoading: false };
}
