/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';

/**
 * Resolver for fetching field collections from the REST API.
 * This automatically triggers when getEntityFieldCollections is called.
 *
 * @param kind Entity kind (e.g., 'postType', 'taxonomy').
 * @param name Entity name (e.g., 'post', 'category').
 * @return Promise resolving when the data is fetched.
 */
export const getEntityFieldCollections =
	( kind: string, name: string ) =>
	async ( { dispatch }: { dispatch: any } ) => {
		try {
			const path = addQueryArgs( '/wp/v2/field-collections', {
				kind,
				name,
			} );

			const response = await apiFetch( {
				path,
			} );

			dispatch.receiveEntityFieldCollections( kind, name, response );
		} catch {
			// Fall back to no collections on error.
		}
	};
