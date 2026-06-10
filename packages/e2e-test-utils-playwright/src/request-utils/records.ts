/**
 * Internal dependencies
 */
import type { RequestUtils } from './index';

/**
 * Create a new record at the given REST base path.
 *
 * Generic seeding helper for per-type wrappers (createPost, createPage, etc.).
 * Call directly for content types without a dedicated wrapper:
 *
 *     requestUtils.createRecord( 'user-taxonomies', { ... } );
 *
 * @param this
 * @param restBase REST base, appended to `/wp/v2/`.
 * @param payload  Record attributes.
 */
export async function createRecord< T = unknown >(
	this: RequestUtils,
	restBase: string,
	payload: Record< string, unknown >
) {
	return this.rest< T >( {
		method: 'POST',
		path: `/wp/v2/${ restBase }`,
		data: payload,
	} );
}
