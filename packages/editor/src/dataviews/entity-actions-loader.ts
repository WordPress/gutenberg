/**
 * Loads the actions registered on the server for an entity.
 *
 * It mirrors `useFields` of the fields loader
 * (https://github.com/WordPress/gutenberg/pull/84323), and is temporary: it
 * lives in the editor, which every screen showing actions loads, until the
 * place of the fields loader settles. Then it moves next to `useFields`.
 */

import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { useEffect, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import type { Action } from '@wordpress/dataviews';
import { unlock } from '../lock-unlock';

/**
 * The actions registered on the server for an entity, as returned by the
 * `/wp/v2/entity-actions` route.
 */
export interface EntityActionsConfig {
	kind: string;
	name: string;
	/**
	 * The serializable part of each action, in registration order.
	 */
	actions: Array< { id: string } & Record< string, any > >;
	/**
	 * The script modules providing the JavaScript parts of the actions, in
	 * registration order, with the ids of the actions each provides.
	 */
	script_modules: Array< { id: string; actions: string[] } >;
}

/**
 * The JavaScript parts of the actions a script module provides, keyed by
 * action id: what PHP cannot serialize, such as `callback`, `RenderModal`,
 * or `isEligible`.
 *
 * It is the shape of the default export of a script module registered along
 * with actions on the server.
 */
type EntityActionsScriptParts = Record< string, Record< string, unknown > >;

type ModuleImporter = ( id: string ) => Promise< unknown >;

const EMPTY_ACTIONS: Action< any >[] = [];

function importModule( id: string ) {
	return import( /* webpackIgnore: true */ /* @vite-ignore */ id );
}

/**
 * Turns the rejection of the actions request into an `Error` to show.
 *
 * A failed `apiFetch` rejects with a plain `{ code, message, data }` object
 * rather than an `Error`, so the server's own message is used when there is
 * one. Anything else, such as a `Response` from `parse: false` or a rejection
 * from a custom fetch handler, falls back to copy of our own, so there is
 * always something to show.
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
					'The actions of this screen did not load. Reload the page to try again.'
				);
	return new Error( message, { cause: value } );
}

/**
 * Imports the script modules of an actions config and merges their
 * JavaScript parts into the actions.
 *
 * The modules are imported in parallel, but applied in the order the server
 * lists them once all have settled, so a later module overrides an earlier
 * one no matter which finishes loading first. A module only contributes to
 * the actions the server lists for it: a module can hold actions that were
 * never registered, or were unregistered, and those must not show up.
 *
 * An action is performed by its `callback` or its `RenderModal`, which only
 * a script module provides, so an action left without both is skipped: when
 * its module fails to load, which is reported, or when no module provides
 * them.
 *
 * @param config   The actions config.
 * @param importer How to import a script module by id.
 * @return The actions, in the server order.
 */
export async function resolveEntityActionsConfig< Item >(
	config: EntityActionsConfig,
	importer: ModuleImporter = importModule
): Promise< Action< Item >[] > {
	const modules = config.script_modules ?? [];
	const results = await Promise.allSettled(
		modules.map( ( { id } ) => importer( id ) )
	);

	const partsById = new Map< string, EntityActionsScriptParts[ string ] >();
	const failedIds = new Set< string >();
	results.forEach( ( result, index ) => {
		const { id: moduleId, actions: actionIds } = modules[ index ];
		if ( result.status === 'rejected' ) {
			// eslint-disable-next-line no-console
			console.warn(
				`Could not load the script module ${ moduleId } of the actions of ${ config.kind }/${ config.name }.`,
				result.reason
			);
			( actionIds ?? [] ).forEach( ( actionId ) =>
				failedIds.add( actionId )
			);
			return;
		}
		const parts =
			( result.value as { default?: EntityActionsScriptParts } )
				?.default ?? {};
		for ( const actionId of actionIds ?? [] ) {
			if ( parts[ actionId ] ) {
				partsById.set( actionId, {
					...partsById.get( actionId ),
					...parts[ actionId ],
				} );
			}
		}
	} );

	return ( config.actions ?? [] ).flatMap( ( definition ) => {
		const action: Record< string, any > = {
			...definition,
			...partsById.get( definition.id ),
			// The server identifies the action, not its module.
			id: definition.id,
		};
		if ( action.callback || action.RenderModal ) {
			return [ action as Action< Item > ];
		}
		if ( ! failedIds.has( action.id ) ) {
			// eslint-disable-next-line no-console
			console.warn(
				`The action ${ action.id } of ${ config.kind }/${ config.name } is skipped: no script module provides its \`callback\` or \`RenderModal\`.`
			);
		}
		return [];
	} );
}

/*
 * One resolution per actions config the store holds, so every caller gets the
 * same action objects and each module is applied once.
 */
const resolvedEntityActionsConfigs = new WeakMap<
	EntityActionsConfig,
	Promise< Action< any >[] >
>();

function getResolvedActions< Item >(
	config: EntityActionsConfig
): Promise< Action< Item >[] > {
	let resolved = resolvedEntityActionsConfigs.get( config );
	if ( ! resolved ) {
		resolved = resolveEntityActionsConfig( config );
		resolvedEntityActionsConfigs.set( config, resolved );
	}
	return resolved;
}

/**
 * Returns the actions registered on the server for an entity.
 *
 * Requests the actions from the `/wp/v2/entity-actions` route through the core data
 * store, imports the script modules registered along with them, and merges
 * their JavaScript parts in.
 *
 * @param entity      The entity.
 * @param entity.kind Entity kind (e.g. `postType`).
 * @param entity.name Entity name (e.g. `page`).
 * @return The actions, in the server order (empty until they load), and the
 *         error when they could not be requested.
 */
export function useEntityActions< Item = any >( {
	kind,
	name,
}: {
	kind: string;
	name: string;
} ): {
	actions: Action< Item >[];
	error?: Error;
} {
	const { config, error } = useSelect(
		( select ) => {
			const { getEntityActionsConfig, getResolutionError } = unlock(
				select( coreStore )
			);
			return {
				config: getEntityActionsConfig( kind, name ) as
					EntityActionsConfig | undefined,
				error: getResolutionError( 'getEntityActionsConfig', [
					kind,
					name,
				] ) as unknown,
			};
		},
		[ kind, name ]
	);

	const [ resolved, setResolved ] = useState< {
		config: EntityActionsConfig;
		actions: Action< Item >[];
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
		getResolvedActions< Item >( config ).then( ( actions ) => {
			if ( isCurrent ) {
				setResolved( { config, actions } );
			}
		} );
		return () => {
			isCurrent = false;
		};
	}, [ config ] );

	if ( normalizedError ) {
		return { actions: EMPTY_ACTIONS, error: normalizedError };
	}
	if ( ! config || resolved?.config !== config ) {
		return { actions: EMPTY_ACTIONS };
	}
	return { actions: resolved.actions };
}
