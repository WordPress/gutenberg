import { resolveSelect, useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import type { FieldsConfig } from '@wordpress/core-data';
import { useEffect, useMemo, useState } from '@wordpress/element';
import type { Field } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';

/**
 * The JavaScript parts of the fields a script module provides, keyed by field
 * id: what PHP cannot serialize, such as `render`, `Edit`, or `getElements`.
 *
 * It is the shape of the default export of a script module registered along
 * with fields on the server.
 */
export interface FieldsScriptParts< Item = any > {
	[ fieldId: string ]: Partial< Omit< Field< Item >, 'id' > >;
}

type ModuleImporter = ( id: string ) => Promise< unknown >;

const EMPTY_FIELDS: Field< any >[] = [];

let unsupportedError: Error | undefined;

/**
 * The error both entry points report on a WordPress that cannot provide the
 * fields.
 *
 * This package is bundled, so a plugin can ship it to a site whose WordPress
 * predates the `getFieldsConfig` selector (and the `/wp/v2/fields` route).
 * There, both entry points report this error instead of throwing.
 *
 * The message is user-facing copy a screen can render, so it is built on
 * first use rather than at import time, when the translations may not have
 * loaded yet. The one instance is then kept: `useFields` returns it from a
 * `useSelect` mapping, which a fresh `Error` on every render would never
 * match.
 *
 * @return The error.
 */
function getUnsupportedError(): Error {
	if ( ! unsupportedError ) {
		unsupportedError = new Error(
			__(
				'This screen needs a newer version of WordPress to show its fields. Update WordPress, then reload the page.'
			)
		);
	}
	return unsupportedError;
}

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
					'The fields of this screen did not load. Reload the page to try again.'
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
 * Loads the fields registered on the server for an entity, in route loaders
 * and other code outside React.
 *
 * Requests the fields from the `/wp/v2/fields` route through the core data
 * store, imports the script modules registered along with them, and merges
 * their JavaScript parts in.
 *
 * @param config      The entity.
 * @param config.kind Entity kind (e.g. `postType`).
 * @param config.name Entity name (e.g. `page`).
 * @return Promise resolving to the fields, in the server order. It rejects
 *         with an `Error` when the fields cannot be requested, or when
 *         WordPress does not provide them.
 */
export async function loadFields< Item = any >( {
	kind,
	name,
}: {
	kind: string;
	name: string;
} ): Promise< Field< Item >[] > {
	const { getFieldsConfig } = resolveSelect( coreStore );
	if ( typeof getFieldsConfig !== 'function' ) {
		throw getUnsupportedError();
	}
	let config: FieldsConfig | undefined;
	try {
		config = await getFieldsConfig( kind, name );
	} catch ( error ) {
		throw toError( error );
	}
	if ( ! config ) {
		throw toError( undefined );
	}
	return getResolvedFields( config );
}

/**
 * Returns the fields registered on the server for an entity.
 *
 * The React counterpart of `loadFields`: both share the request and the
 * module imports, so a route loader warms up what the hook renders.
 *
 * @param config      The entity.
 * @param config.kind Entity kind (e.g. `postType`).
 * @param config.name Entity name (e.g. `page`).
 * @return The fields, in the server order (empty until they load), whether
 *         they are still loading, and the error when they could not be
 *         requested or WordPress does not provide them.
 */
export function useFields< Item = any >( {
	kind,
	name,
}: {
	kind: string;
	name: string;
} ): {
	fields: Field< Item >[];
	isLoading: boolean;
	error?: Error;
} {
	const { config, error } = useSelect(
		( select ) => {
			const { getFieldsConfig, getResolutionError } = select( coreStore );
			if ( typeof getFieldsConfig !== 'function' ) {
				return {
					config: undefined,
					error: getUnsupportedError(),
				};
			}
			return {
				config: getFieldsConfig( kind, name ),
				error: getResolutionError( 'getFieldsConfig', [
					kind,
					name,
				] ) as unknown,
			};
		},
		[ kind, name ]
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

	if ( normalizedError ) {
		return {
			fields: EMPTY_FIELDS,
			isLoading: false,
			error: normalizedError,
		};
	}
	if ( ! config || resolved?.config !== config ) {
		return { fields: EMPTY_FIELDS, isLoading: true };
	}
	return { fields: resolved.fields, isLoading: false };
}
