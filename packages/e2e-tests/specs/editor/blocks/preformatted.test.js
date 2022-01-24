/**
 * WordPress dependencies
 */
import {
	clickBlockToolbarButton,
	clickMenuItem,
	getEditedPostContent,
	createNewPost,
	insertBlock,
	clickBlockAppender,
} from '@wordpress/e2e-test-utils';

describe( 'Preformatted', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'should preserve character newlines', async () => {
		await insertBlock( 'Custom HTML' );
		await page.keyboard.type( '<pre>1' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '2</pre>' );

		expect( await getEditedPostContent() ).toMatchSnapshot();

		await clickBlockToolbarButton( 'Options' );
		await clickMenuItem( 'Convert to Blocks' );
		// Once it's edited, it should be saved as BR tags.
		await page.keyboard.type( '0' );
		await page.keyboard.press( 'Enter' );
		await clickBlockToolbarButton( 'Options' );
		await clickMenuItem( 'Edit as HTML' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should preserve white space when merging', async () => {
		await insertBlock( 'Preformatted' );
		await page.keyboard.type( '1' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '2' );
		await page.keyboard.press( 'Enter' );
		await clickBlockAppender();
		await page.keyboard.type( '3' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.press( 'Backspace' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should delete block when backspace in an empty preformatted', async () => {
		await insertBlock( 'Preformatted' );

		await page.keyboard.type( 'a' );

		await page.keyboard.press( 'Backspace' );
		await page.keyboard.press( 'Backspace' );

		// Expect preformatted block to be deleted.
		expect( await getEditedPostContent() ).toBe( '' );
	} );
} );
