/**
 * WordPress dependencies
 */
import {
	activatePlugin,
	createNewPost,
	deactivatePlugin,
	searchForBlock,
} from '@wordpress/e2e-test-utils';

describe( 'Allowed Blocks Filter', () => {
	beforeAll( async () => {
		await activatePlugin( 'gutenberg-test-allowed-blocks' );
	} );

	beforeEach( async () => {
		await createNewPost();
	} );

	afterAll( async () => {
		await deactivatePlugin( 'gutenberg-test-allowed-blocks' );
	} );

	it( 'should restrict the allowed blocks in the inserter', async () => {
		// The paragraph block is available.
		await searchForBlock( 'Paragraph' );
		const paragraphBlock = await page.$( `button[aria-label="Paragraph"]` );
		expect( paragraphBlock ).not.toBeNull();
		await paragraphBlock.click();

		// The gallery block is not available.
		await searchForBlock( 'Gallery' );
		const galleryBlock = await page.$( `button[aria-label="Gallery"]` );
		expect( galleryBlock ).toBeNull();
	} );
} );
