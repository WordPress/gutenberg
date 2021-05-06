/**
 * WordPress dependencies
 */
import { createNewPost, insertBlock } from '@wordpress/e2e-test-utils';

describe( 'Paragraph', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'should output unwrapped editable paragraph', async () => {
		await insertBlock( 'Paragraph' );
		await page.keyboard.type( '1' );

		const firstBlockTagName = await page.evaluate( () => {
			return document.querySelector(
				'.block-editor-block-list__layout .wp-block'
			).tagName;
		} );

		// The outer element should be a paragraph. Blocks should never have any
		// additional div wrappers so the markup remains simple and easy to
		// style.
		expect( firstBlockTagName ).toBe( 'P' );
	} );
} );
