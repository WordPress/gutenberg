/**
 * Delete all blocks using REST API.
 *
 * @see https://developer.wordpress.org/rest-api/reference/blocks/#list-editor-blocks
 * @this {import('./index').RequestUtils}
 */
export async function deleteAllBlocks() {
	// List all blocks.
	// https://developer.wordpress.org/rest-api/reference/blocks/#list-editor-blocks
	const blocks = await this.rest( {
		path: '/wp/v2/blocks',
		params: {
			per_page: 100,
			// All possible statuses.
			status: 'publish,future,draft,pending,private,trash',
		},
	} );

	// Delete blocks.
	// https://developer.wordpress.org/rest-api/reference/blocks/#delete-a-editor-block
	// "/wp/v2/posts" not yet supports batch requests.
	await this.batchRest(
		blocks.map( ( block ) => ( {
			method: 'DELETE',
			path: `/wp/v2/blocks/${ block.id }?force=true`,
		} ) )
	);
}
