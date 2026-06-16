/**
 * Internal dependencies
 */
import { store } from '../store';
import type { FieldCollection } from '../store/types';

/**
 * Preload field collections data and their script modules.
 *
 * Resolves the field collections for an entity and eagerly imports each
 * collection's `fields_module`, so a later `useFieldCollections` call for the
 * same entity renders without a loading flash. Intended for route loaders.
 *
 * @param kind Entity kind (e.g., 'postType', 'taxonomy', 'user').
 * @param name Entity name (e.g., 'attachment', 'post', 'category').
 * @return Promise that resolves when both data and modules are loaded.
 */
export async function preloadFieldCollections(
	kind: string,
	name: string
): Promise< void > {
	const { resolveSelect } = await import( '@wordpress/data' );

	const collections = ( await resolveSelect(
		store
	).getEntityFieldCollections( kind, name ) ) as FieldCollection< unknown >[];

	const modulePromises = collections
		.filter( ( collection ) => collection.fields_module )
		.map( async ( collection ) => {
			try {
				await import(
					/* webpackIgnore: true */
					collection.fields_module!
				);
			} catch {
				// Ignore preload failures; useFieldCollections falls back to
				// the serializable field definitions.
			}
		} );

	await Promise.all( modulePromises );
}
