/**
 * WordPress dependencies
 */
import {
	createNewPost,
	openGlobalBlockInserter,
} from '@wordpress/e2e-test-utils';

describe( 'Inserter', () => {
	it( 'shows block preview when hovering over block in inserter', async () => {
		await createNewPost();
		await openGlobalBlockInserter();
		await page.focus( '.editor-block-list-item-paragraph' );
		await page.waitForSelector( '.block-editor-inserter__preview', {
			visible: true,
		} );
		const preview = await page.$( '.block-editor-inserter__preview' );
		const isPreviewVisible = await preview.isIntersectingViewport();
		expect( isPreviewVisible ).toBe( true );
	} );
} );
