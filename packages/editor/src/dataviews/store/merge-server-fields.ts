import type { Field } from '@wordpress/dataviews';

/**
 * Merges the fields registered on the server into the fields the editor
 * derives itself.
 *
 * The server fields follow the client fields, in the server order: the
 * consumers of the fields lay them out in their own order (the fields of a
 * view, a form), so the order of registration only shows in lists such as
 * the properties and filters menus of DataViews. A server field with the id
 * of a client field replaces it, in its place: the server is the source of
 * truth, and ships its JavaScript parts along with its data.
 *
 * @param clientFields The fields the editor derives.
 * @param serverFields The fields registered on the server.
 * @return The merged fields.
 */
export function mergeServerFields< Item >(
	clientFields: Field< Item >[],
	serverFields: Field< Item >[]
): Field< Item >[] {
	const serverFieldsById = new Map(
		serverFields.map( ( field ) => [ field.id, field ] )
	);

	return [
		...clientFields.map(
			( field ) => serverFieldsById.get( field.id ) ?? field
		),
		...serverFields.filter(
			( field ) => ! clientFields.some( ( { id } ) => id === field.id )
		),
	];
}
