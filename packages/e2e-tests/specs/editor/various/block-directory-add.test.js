/**
 * WordPress dependencies
 */
import {
	createNewPost,
	searchForBlock,
} from '@wordpress/e2e-test-utils';

describe( 'adding blocks', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'Should add block to document.', async () => {
		const searchTerm = 'Card';

		await searchForBlock( searchTerm );

		const addBtn = await page.waitForXPath( '//button[text()="Add block"]' );
		await addBtn.click();

		expect( true ).toBe( false );
	} );
} );
