/**
 * WordPress dependencies
 */
import {
	createNewPost,
	pressKeyWithModifier,
} from '@wordpress/e2e-test-utils';

describe( 'Writing Flow', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'should navigate native inputs vertically, not horizontally', async () => {
		// See: https://github.com/WordPress/gutenberg/issues/9626

		// Title is within the editor's writing flow, and is a <textarea>
		await page.click( '.editor-post-title' );

		// Should remain in title upon ArrowRight:
		await page.keyboard.press( 'ArrowRight' );
		let isInTitle = await page.evaluate( () => (
			!! document.activeElement.closest( '.editor-post-title' )
		) );
		expect( isInTitle ).toBe( true );

		// Should remain in title upon modifier + ArrowDown:
		await pressKeyWithModifier( 'primary', 'ArrowDown' );
		isInTitle = await page.evaluate( () => (
			!! document.activeElement.closest( '.editor-post-title' )
		) );
		expect( isInTitle ).toBe( true );

		// Should navigate into blocks list upon ArrowDown:
		await page.keyboard.press( 'ArrowDown' );
		const isInBlock = await page.evaluate( () => (
			!! document.activeElement.closest( '[data-type]' )
		) );
		expect( isInBlock ).toBe( true );
	} );
} );
