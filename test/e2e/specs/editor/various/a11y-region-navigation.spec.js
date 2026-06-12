/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

function expectBlockToHoldSelection( locator ) {
	return expect
		.poll( () =>
			locator.evaluate( ( element ) => {
				const { activeElement } = element.ownerDocument;
				if ( element === activeElement ) {
					return true;
				}
				const selection =
					element.ownerDocument.defaultView.getSelection();
				return (
					!! activeElement?.isContentEditable &&
					activeElement.contains( element ) &&
					!! selection.anchorNode &&
					element.contains( selection.anchorNode )
				);
			} )
		)
		.toBe( true );
}

test.describe( 'Region navigation (@firefox, @webkit)', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPosts();
	} );

	test( 'navigates forward and back again', async ( {
		editor,
		page,
	}, testInfo ) => {
		// Insert a paragraph block.
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Dummy text' },
		} );

		const dummyParagraph = editor.canvas
			.getByRole( 'document', {
				name: 'Block: Paragraph',
			} )
			.filter( { hasText: 'Dummy text' } );

		await expectBlockToHoldSelection( dummyParagraph );

		// Navigate to first region and check that we made it. Must navigate forward 4 times as initial focus is placed in post title field.
		await page.keyboard.press( 'Control+`' );
		await page.keyboard.press( 'Control+`' );
		await page.keyboard.press( 'Control+`' );
		await page.keyboard.press( 'Control+`' );
		const editorTopBar = page.locator(
			'role=region[name="Editor top bar"i]'
		);
		await expect( editorTopBar ).toBeFocused();

		// Navigate to next/second region and check that we made it.
		await page.keyboard.press( 'Control+`' );
		const editorContent = page.locator(
			'role=region[name="Editor content"i]'
		);
		await expect( editorContent ).toBeFocused();

		// Navigate to previous/first region and check that we made it.
		// Make sure navigating backwards works also with the tilde character,
		// as browsers interpret the combination of the crtl+shift+backtick keys
		// and assign it to event.key inconsistently.
		// See https://github.com/WordPress/gutenberg/pull/45019
		if ( testInfo.project.name === 'chromium' ) {
			await page.keyboard.press( 'Control+Shift+`' );
		} else {
			await page.keyboard.press( 'Control+Shift+~' );
		}

		await expect( editorTopBar ).toBeFocused();
	} );
} );
