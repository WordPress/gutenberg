/**
 * WordPress dependencies
 */
import {
	createNewPost,
	openGlobalBlockInserter,
	insertBlock,
} from '@wordpress/e2e-test-utils';

describe( 'Inserter', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'shows block preview when hovering over block in inserter', async () => {
		await openGlobalBlockInserter();
		await page.focus( '.editor-block-list-item-paragraph' );
		const preview = await page.waitForSelector(
			'.block-editor-inserter__preview',
			{
				visible: true,
			}
		);
		const isPreviewVisible = await preview.isIntersectingViewport();
		expect( isPreviewVisible ).toBe( true );
	} );

	it( 'last-inserted block should be given and keep the focus', async () => {
		await page.type(
			'.block-editor-default-block-appender__content',
			'Testing inserted block focus'
		);

		await insertBlock( 'Image' );

		await page.waitForSelector( 'figure[data-type="core/image"]' );

		const selectedBlock = await page.evaluate( () => {
			return wp.data.select( 'core/block-editor' ).getSelectedBlock();
		} );

		expect( selectedBlock.name ).toBe( 'core/image' );
	} );
} );
