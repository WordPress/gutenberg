/**
 * E2E coverage for F-34: copying blocks out of a post must not carry that
 * post's suggestion state with them.
 *
 * A suggestion is a proposal about one post. Its inline `wp-suggestion`
 * marker and the `metadata.noteId` link both point at a note comment attached
 * to that post's id, so pasting the blocks into a different post produces
 * permanently highlighted text with no note behind it and no Accept/Reject to
 * clear it. `setClipboardBlocks` runs the blocks through the
 * `blockEditor.copiedBlocks` filter, where the suggestion layer unwraps the
 * markers and drops the note link.
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

async function switchIntent( page, intentLabel ) {
	await page
		.getByRole( 'region', { name: 'Editor top bar' } )
		.getByRole( 'button', { name: 'Options' } )
		.click();
	const menuItem = page.getByRole( 'menuitemradio', {
		name: new RegExp( `^${ intentLabel }` ),
	} );
	await menuItem.waitFor( { state: 'visible', timeout: 10000 } );
	await menuItem.click();
	// `MenuItemsChoice` doesn't auto-close its dropdown on selection.
	await page.keyboard.press( 'Escape' );
}

test.describe( 'Suggestion mode clipboard', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( [
			'gutenberg-suggestion-mode',
		] );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllComments( 'note' );
		await requestUtils.setGutenbergExperiments( [] );
	} );

	test( 'copied blocks carry no suggestion markers or note ids into another post', async ( {
		admin,
		editor,
		page,
		pageUtils,
	} ) => {
		await admin.createNewPost();
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Original content' },
		} );

		await switchIntent( page, 'Suggesting' );

		const paragraph = editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.first();
		await paragraph.click();
		await page.keyboard.press( 'End' );
		await page.keyboard.type( ' COPIED' );

		/*
		 * A populated `data-suggestion-id` is race-free proof the note
		 * exists: the marker is only written once the note comment's id
		 * comes back.
		 */
		const marker = paragraph.locator(
			'mark.wp-suggestion[data-suggestion-type="add"]'
		);
		await expect( marker ).toContainText( 'COPIED' );
		await expect( marker ).toHaveAttribute( 'data-suggestion-id', /\d/ );

		// The source post holds the marker and the note link, as it should.
		const sourceContent = await editor.getEditedPostContent();
		expect( sourceContent ).toContain( 'wp-suggestion' );
		expect( sourceContent ).toContain( 'noteId' );

		await editor.saveDraft();

		// Collapsed selection inside the block copies the whole block.
		await paragraph.click();
		await pageUtils.pressKeys( 'primary+c' );

		await admin.createNewPost();
		await editor.canvas
			.locator( 'role=document[name="Add default block"i]' )
			.click();
		await pageUtils.pressKeys( 'primary+v' );

		const pastedParagraph = editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.first();
		await expect( pastedParagraph ).toContainText(
			'Original content COPIED'
		);

		const pastedContent = await editor.getEditedPostContent();
		expect( pastedContent ).toContain( 'Original content COPIED' );
		expect( pastedContent ).not.toContain( 'wp-suggestion' );
		expect( pastedContent ).not.toContain( 'data-suggestion-id' );
		expect( pastedContent ).not.toContain( 'noteId' );

		// Nothing marked means nothing to review: no orphaned markers render.
		await expect(
			editor.canvas.locator( 'mark.wp-suggestion' )
		).toHaveCount( 0 );
	} );
} );
