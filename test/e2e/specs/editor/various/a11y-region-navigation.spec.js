const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

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

		await expect
			.poll( () => editor.ownsSelection( dummyParagraph ) )
			.toBe( true );

		// Navigate to the top bar region and check that we made it. Focus
		// starts in the selected paragraph, so five stops lie ahead: the
		// block toolbar, settings, publish, footer, then the top bar.
		await page.keyboard.press( 'Control+`' );
		await page.keyboard.press( 'Control+`' );
		await page.keyboard.press( 'Control+`' );
		await page.keyboard.press( 'Control+`' );
		await page.keyboard.press( 'Control+`' );
		const editorTopBar = page.locator(
			'role=region[name="Editor top bar"i]'
		);
		await expect( editorTopBar ).toBeFocused();

		// Navigate to the content region and check that we made it.
		await page.keyboard.press( 'Control+`' );
		const editorContent = page.locator(
			'role=region[name="Editor content"i]'
		);
		await expect( editorContent ).toBeFocused();

		// Navigate to the next region: the selected block's toolbar floats
		// within the content region, so it comes right after it.
		await page.keyboard.press( 'Control+`' );
		await expect(
			page.locator( 'role=region[name="Block toolbar"i]' )
		).toBeFocused();

		// Navigate two regions back and check that we made it.
		// Make sure navigating backwards works also with the tilde character,
		// as browsers interpret the combination of the crtl+shift+backtick keys
		// and assign it to event.key inconsistently.
		// See https://github.com/WordPress/gutenberg/pull/45019
		for ( let i = 0; i < 2; i++ ) {
			if ( testInfo.project.name === 'chromium' ) {
				await page.keyboard.press( 'Control+Shift+`' );
			} else {
				await page.keyboard.press( 'Control+Shift+~' );
			}
		}

		await expect( editorTopBar ).toBeFocused();
	} );
} );
