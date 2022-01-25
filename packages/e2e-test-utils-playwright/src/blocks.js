/**
 * WordPress dependencies
 */
import { addQueryArgs } from '@wordpress/url';

/**
 * Delete all blocks using REST API.
 *
 * @this {import('.').TestUtils}
 */
export async function deleteAllBlocks() {
	const blocks = await this.__experimentalRest( {
		path: addQueryArgs( '/wp/v2/blocks', {
			per_page: -1,
			// All possible statuses.
			status: 'publish,future,draft,pending,private,trash',
		} ),
	} );

	// "/wp/v2/posts" not yet supports batch requests.
	await this.__experimentalBatch(
		blocks.map( ( block ) => ( {
			method: 'DELETE',
			path: `/wp/v2/blocks/${ block.id }?force=true`,
		} ) )
	);
}
