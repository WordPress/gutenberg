import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import type { Field } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';

export { resolveFieldsConfig } from './resolve-fields-config';
export type { FieldsConfig } from './resolve-fields-config';

const EMPTY_FIELDS: Field< any >[] = [];

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
 * Returns the fields of an entity.
 *
 * Reads them with the private `getEntityFields` selector of the editor store,
 * whose resolver requests the fields registered on the server from the
 * `/wp/v2/entity-fields` route, imports the script modules registered along
 * with them, and merges their JavaScript parts in. Every caller of the same
 * entity, such as a route loader resolving the selector outside React, shares
 * that resolution.
 *
 * @param config      The entity.
 * @param config.kind Entity kind (e.g. `postType`).
 * @param config.name Entity name (e.g. `page`).
 * @return The fields, in the server order (empty until they load), whether
 *         they are still loading, and the error when they could not be
 *         requested.
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
	const { fields, isLoading, error } = useSelect(
		( select ) => {
			const {
				getEntityFields,
				hasFinishedResolution,
				getResolutionError,
			} = unlock( select( editorStore ) );
			return {
				fields: getEntityFields( kind, name ) as Field< Item >[],
				isLoading: ! hasFinishedResolution( 'getEntityFields', [
					kind,
					name,
				] ),
				error: getResolutionError( 'getEntityFields', [
					kind,
					name,
				] ) as unknown,
			};
		},
		[ kind, name ]
	);

	const normalizedError = useMemo(
		() => ( error ? toError( error ) : undefined ),
		[ error ]
	);

	if ( normalizedError ) {
		return {
			fields: EMPTY_FIELDS,
			isLoading: false,
			error: normalizedError,
		};
	}
	if ( isLoading ) {
		return { fields: EMPTY_FIELDS, isLoading: true };
	}
	return { fields, isLoading: false };
}
