/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Spacer', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'can be created by typing "/spacer"', async ( { editor, page } ) => {
		// Create a spacer with the slash block shortcut.
		await editor.canvas
			.locator( 'role=button[name="Add default block"i]' )
			.click();
		await page.keyboard.type( '/spacer' );
		await page.keyboard.press( 'Enter' );

		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'can be resized using the drag handle and remains selected after being dragged', async ( {
		page,
		editor,
	} ) => {
		// Create a spacer with the slash block shortcut.
		await editor.canvas
			.locator( 'role=button[name="Add default block"i]' )
			.click();
		await page.keyboard.type( '/spacer' );
		await page.keyboard.press( 'Enter' );

		const resizableHandle = editor.canvas.locator(
			// Use class name selector until we have `data-testid` for the resize handles.
			'role=document[name="Block: Spacer"i] >> css=.components-resizable-box__handle'
		);
		const elementPoint = await resizableHandle.boundingBox();
		await page.mouse.move( elementPoint.x, elementPoint.y );
		await page.mouse.down();
		await page.mouse.move( elementPoint.x + 0, elementPoint.y + 50 );
		await page.mouse.up();

		expect( await editor.getEditedPostContent() ).toMatchSnapshot();

		await expect(
			editor.canvas.locator( 'role=document[name="Block: Spacer"i]' )
		).toBeFocused();
	} );
} );
