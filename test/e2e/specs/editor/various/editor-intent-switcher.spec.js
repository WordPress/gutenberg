/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

async function openIntentSwitcher( page ) {
	await page.click(
		'role=region[name="Editor top bar"i] >> role=button[name="Options"i]'
	);
}

test.describe( 'Editor intent switcher', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'defaults to Edit intent and resets to Edit after reload', async ( {
		page,
		editor,
	} ) => {
		await openIntentSwitcher( page );

		// Use full accessible names (label + info) to disambiguate from the
		// sibling Visual/Code editor menuitemradios which would otherwise
		// match 'Edit' via Playwright's substring search.
		const editChoice = page.getByRole( 'menuitemradio', {
			name: /^Edit\s+Edit content directly/,
		} );
		const suggestChoice = page.getByRole( 'menuitemradio', {
			name: /^Suggest/,
		} );
		const viewChoice = page.getByRole( 'menuitemradio', {
			name: /^View\s+Read-only/,
		} );

		await expect( editChoice ).toBeVisible();
		await expect( suggestChoice ).toBeVisible();
		await expect( viewChoice ).toBeVisible();
		await expect( editChoice ).toHaveAttribute( 'aria-checked', 'true' );

		// Intent is session-scoped by design (see `setEditorIntent` and the
		// `editorIntent` reducer in @wordpress/editor): selecting Suggest
		// takes effect within the session, but reloading deliberately
		// returns to the default Edit intent rather than persisting a
		// non-default mode the user may not realize they left active.
		await suggestChoice.click();
		await expect( suggestChoice ).toHaveAttribute( 'aria-checked', 'true' );

		await page.reload();
		await editor.canvas.locator( 'body' ).waitFor();
		await openIntentSwitcher( page );
		await expect(
			page.getByRole( 'menuitemradio', {
				name: /^Edit\s+Edit content directly/,
			} )
		).toHaveAttribute( 'aria-checked', 'true' );
		await expect(
			page.getByRole( 'menuitemradio', { name: /^Suggest/ } )
		).toHaveAttribute( 'aria-checked', 'false' );
	} );

	test( 'View intent makes blocks read-only', async ( { editor, page } ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Initial content' },
		} );

		await openIntentSwitcher( page );
		await page
			.getByRole( 'menuitemradio', { name: /^View\s+Read-only/ } )
			.click();

		// In preview mode, block content is not editable — the paragraph
		// should render but clicking and typing should not change it.
		const paragraph = editor.canvas.getByText( 'Initial content' );
		await expect( paragraph ).toBeVisible();
		await expect( paragraph ).not.toHaveAttribute(
			'contenteditable',
			'true'
		);
	} );

	test( 'keyboard shortcut cycles between intents', async ( { page } ) => {
		// Default is Edit.
		await page.keyboard.press( 'Control+Alt+Shift+X' );
		await openIntentSwitcher( page );
		await expect(
			page.getByRole( 'menuitemradio', { name: /^Suggest/ } )
		).toHaveAttribute( 'aria-checked', 'true' );

		// Close menu and switch to View via shortcut.
		await page.keyboard.press( 'Escape' );
		await page.keyboard.press( 'Control+Alt+Shift+C' );
		await openIntentSwitcher( page );
		await expect(
			page.getByRole( 'menuitemradio', { name: /^View\s+Read-only/ } )
		).toHaveAttribute( 'aria-checked', 'true' );

		// Back to Edit.
		await page.keyboard.press( 'Escape' );
		await page.keyboard.press( 'Control+Alt+Shift+Z' );
		await openIntentSwitcher( page );
		await expect(
			page.getByRole( 'menuitemradio', {
				name: /^Edit\s+Edit content directly/,
			} )
		).toHaveAttribute( 'aria-checked', 'true' );
	} );
} );
