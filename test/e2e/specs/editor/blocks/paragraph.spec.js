/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Paragraph', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'should output unwrapped editable paragraph', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
		} );
		await page.keyboard.type( '1' );

		const firstBlock = await page.locator( 'block=*' );
		const firstBlockTagName = await firstBlock.evaluate( ( element ) => {
			return element.tagName;
		} );

		// The outer element should be a paragraph. Blocks should never have any
		// additional div wrappers so the markup remains simple and easy to
		// style.
		expect( firstBlockTagName ).toBe( 'P' );
	} );
} );
