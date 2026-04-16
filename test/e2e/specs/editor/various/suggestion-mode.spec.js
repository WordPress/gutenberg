/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

async function switchIntent( page, intentLabel ) {
	await page.click(
		'role=region[name="Editor top bar"i] >> role=button[name="Options"i]'
	);
	await page
		.getByRole( 'menuitemradio', { name: intentLabel, exact: true } )
		.click();
}

test.describe( 'Suggestion mode', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllComments( 'note' );
	} );

	test( 'captures edits as an overlay without mutating the block', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Original content' },
		} );

		await switchIntent( page, 'Suggest' );

		// Focus the paragraph and type additional text.
		const paragraph = editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.first();
		await paragraph.click();
		await page.keyboard.press( 'End' );
		await page.keyboard.type( ' plus suggested' );

		// The rendered block reflects the overlayed suggestion.
		await expect( paragraph ).toContainText(
			'Original content plus suggested'
		);

		// The serialized post content still shows the baseline — the overlay
		// never touched the block-editor store.
		const serialized = await editor.getEditedPostContent();
		expect( serialized ).toContain( 'Original content' );
		expect( serialized ).not.toContain( 'plus suggested' );

		// Submit suggestion via the block toolbar.
		await page
			.getByRole( 'toolbar', { name: 'Block tools' } )
			.getByRole( 'button', { name: 'Submit suggestion' } )
			.click();

		// Snackbar confirms.
		await expect(
			page.getByRole( 'button', { name: 'Dismiss this notice' } )
		).toBeVisible();

		// A note comment now exists on this post with a _wp_suggestion meta.
		// Implementation detail: the block is linked via metadata.noteId,
		// which the commit-bar wires after the REST create succeeds.
	} );

	test( 'captures non-text attribute changes (heading level)', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/heading',
			attributes: { content: 'My Heading', level: 2 },
		} );

		await switchIntent( page, 'Suggest' );

		// Select the heading block.
		const heading = editor.canvas
			.getByRole( 'document', { name: 'Block: Heading' } )
			.first();
		await heading.click();

		// Change heading level to H3 via the block toolbar.
		await page
			.getByRole( 'toolbar', { name: 'Block tools' } )
			.getByRole( 'button', { name: 'Change level' } )
			.click();
		await page.getByRole( 'radio', { name: 'Heading 3' } ).click();

		// The overlay should have captured the level change — the rendered
		// block should show H3, but serialized content stays at H2.
		await expect( heading ).toBeVisible();
		const serialized = await editor.getEditedPostContent();
		expect( serialized ).toContain( '<!-- wp:heading' );
		expect( serialized ).not.toContain( '"level":3' );

		// Submit the suggestion.
		await page
			.getByRole( 'toolbar', { name: 'Block tools' } )
			.getByRole( 'button', { name: 'Submit suggestion' } )
			.click();

		await expect(
			page.getByRole( 'button', { name: 'Dismiss this notice' } )
		).toBeVisible();
	} );

	test( 'discards overlay without creating a note', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Keep as is' },
		} );

		await switchIntent( page, 'Suggest' );

		const paragraph = editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.first();
		await paragraph.click();
		await page.keyboard.press( 'End' );
		await page.keyboard.type( '!' );
		await expect( paragraph ).toContainText( 'Keep as is!' );

		await page
			.getByRole( 'toolbar', { name: 'Block tools' } )
			.getByRole( 'button', { name: 'Discard' } )
			.click();

		await expect( paragraph ).toContainText( 'Keep as is' );
		// Discard button disappears once the overlay is cleared.
		await expect(
			page
				.getByRole( 'toolbar', { name: 'Block tools' } )
				.getByRole( 'button', { name: 'Discard' } )
		).toBeHidden();
	} );
} );
