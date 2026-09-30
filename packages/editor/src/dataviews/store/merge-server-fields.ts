import type { Field } from '@wordpress/dataviews';

/**
 * Merges the fields registered on the server into the fields the editor
 * derives itself.
 *
 * The client list holds the ids of the fields ported to the server where
 * those fields go, so they keep their position. A server field with the id of
 * a client field overrides its properties, keeping its position, so the data
 * the server declares (label, type, elements, filter operators…) wins while
 * the client keeps providing the JavaScript parts the server does not ship.
 * An id the server does not list (the field was unregistered, or the entity
 * does not have it) is dropped. A server field the client does not know
 * about is appended, in the server order.
 *
 * @param clientFields The fields the editor derives, and the ids of the
 *                     server fields in their position.
 * @param serverFields The fields registered on the server.
 * @return The merged fields.
 */
export function mergeServerFields< Item >(
	clientFields: Array< Field< Item > | string >,
	serverFields: Field< Item >[]
): Field< Item >[] {
	const serverFieldsById = new Map(
		serverFields.map( ( field ) => [ field.id, field ] )
	);

	const merged = new Map< string, Field< Item > >();
	for ( const entry of clientFields ) {
		const id = typeof entry === 'string' ? entry : entry.id;
		// A server field placed by id takes the place of a later client
		// field with the same id.
		if ( merged.has( id ) ) {
			continue;
		}
		const serverField = serverFieldsById.get( id );
		serverFieldsById.delete( id );
		if ( typeof entry !== 'string' ) {
			merged.set(
				id,
				serverField ? { ...entry, ...serverField } : entry
			);
		} else if ( serverField ) {
			merged.set( id, serverField );
		}
	}

	return [ ...merged.values(), ...serverFieldsById.values() ];
}
