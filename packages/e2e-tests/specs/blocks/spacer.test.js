/**
 * WordPress dependencies
 */
import {
	clickBlockAppender,
	getEditedPostContent,
	createNewPost,
} from '@wordpress/e2e-test-utils';

/**
 * Clicks an element, drags a particular distance and releases the mouse button.
 *
 * @param {Object} element The puppeteer element handle.
 * @param {number} delta   Object containing movement distances.
 * @param {number} delta.x Horizontal distance to drag.
 * @param {number} delta.y Vertical distance to drag.
 *
 * @return {Promise} Promise resolving when drag completes.
 */
export async function dragAngDrop( element, delta ) {
	const {
		x: elementX,
		y: elementY,
		width: elementWidth,
		height: elementHeight,
	} = await element.boundingBox();

	const originX = elementX + ( elementWidth / 2 );
	const originY = elementY + ( elementHeight / 2 );

	await page.mouse.move( originX, originY );
	await page.mouse.down();
	await page.mouse.move( originX + delta.x, originY + delta.y );
	await page.mouse.up();
}

describe( 'Spacer', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'can be created by typing "/spacer"', async () => {
		// Create a spacer with the slash block shortcut.
		await clickBlockAppender();
		await page.keyboard.type( '/spacer' );
		await page.keyboard.press( 'Enter' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'can be resized using the drag handle and remains selected being dragged', async () => {
		// Create a spacer with the slash block shortcut.
		await clickBlockAppender();
		await page.keyboard.type( '/spacer' );
		await page.keyboard.press( 'Enter' );

		const resizableHandle = await page.$( '.block-library-spacer__resize-container .components-resizable-box__handle' );
		await dragAngDrop( resizableHandle, { x: 0, y: 50 } );

		expect( await getEditedPostContent() ).toMatchSnapshot();

		const selectedSpacer = await page.$( '[data-type="core/spacer"].is-selected' );
		expect( selectedSpacer ).not.toBe( null );
	} );
} );
