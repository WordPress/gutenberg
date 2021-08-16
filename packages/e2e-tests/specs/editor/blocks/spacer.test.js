/**
 * WordPress dependencies
 */
import {
	clickBlockAppender,
	getEditedPostContent,
	createNewPost,
	dragAndResize,
} from '@wordpress/e2e-test-utils';

describe( 'Spacer', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'can be created by typing "/spacer"', async () => {
		// Create a spacer with the slash block shortcut.
		await clickBlockAppender();
		await page.keyboard.type( '/spacer' );
		await page.waitForSelector(
			'button[aria-selected="true"]:text-is("Spacer")'
		);
		await page.keyboard.press( 'Enter' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'can be resized using the drag handle and remains selected after being dragged', async () => {
		// Create a spacer with the slash block shortcut.
		await clickBlockAppender();
		await page.keyboard.type( '/spacer' );
		await page.waitForSelector(
			'button[aria-selected="true"]:text-is("Spacer")'
		);
		await page.keyboard.press( 'Enter' );

		const resizableHandle = await page.waitForSelector(
			'.block-library-spacer__resize-container .components-resizable-box__handle'
		);
		await dragAndResize( resizableHandle, { x: 0, y: 50 } );
		expect( await getEditedPostContent() ).toMatchSnapshot();

		await page.waitForSelector( '[data-type="core/spacer"].is-selected' );
	} );
} );
