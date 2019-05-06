/**
 * WordPress dependencies
 */
import {
	createNewPost,
	getAllBlockInserterItemTitles,
	insertBlock,
	openAllBlockInserterCategories,
	openGlobalBlockInserter,
} from '@wordpress/e2e-test-utils';

describe( 'Media Text', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'restricts blocks that can be inserted', async () => {
		await insertBlock( 'Media & Text' );
		await page.click( '.wp-block-media-text .block-editor-rich-text' );
		await openGlobalBlockInserter();
		await openAllBlockInserterCategories();
		expect( await getAllBlockInserterItemTitles() ).toMatchSnapshot();
	} );
} );
