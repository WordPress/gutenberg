/**
 * WordPress dependencies
 */
import {
	createNewPost,
	clickBlockToolbarButton,
	insertBlock,
	getEditedPostContent,
} from '@wordpress/e2e-test-utils';

describe( 'adding blocks', () => {
	beforeAll( async () => {
		await createNewPost();
	} );

	it( 'Should switch to the large style of the quote block', async () => {
		// Inserting a quote block
		await insertBlock( 'Quote' );
		await page.keyboard.type( 'Quote content' );

		await clickBlockToolbarButton( 'Quote' );

		const largeStyleButton = await page.waitForXPath(
			'//*[@role="menuitem"][contains(., "Large")]'
		);
		await largeStyleButton.click();

		// Check the content
		const content = await getEditedPostContent();
		expect( content ).toMatchSnapshot();
	} );
} );
