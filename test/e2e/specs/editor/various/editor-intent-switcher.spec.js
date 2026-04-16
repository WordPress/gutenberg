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

	test( 'defaults to Edit intent and persists across reload', async ( {
		page,
		editor,
	} ) => {
		await openIntentSwitcher( page );

		const editChoice = page.getByRole( 'menuitemradio', { name: 'Edit' } );
		const suggestChoice = page.getByRole( 'menuitemradio', {
			name: 'Suggest',
		} );
		const viewChoice = page.getByRole( 'menuitemradio', { name: 'View' } );

		await expect( editChoice ).toBeVisible();
		await expect( suggestChoice ).toBeVisible();
		await expect( viewChoice ).toBeVisible();
		await expect( editChoice ).toHaveAttribute( 'aria-checked', 'true' );

		// Select Suggest and confirm selection persists across reload.
		await suggestChoice.click();
		await page.reload();
		await editor.canvas.locator( 'body' ).waitFor();
		await openIntentSwitcher( page );
		await expect(
			page.getByRole( 'menuitemradio', { name: 'Suggest' } )
		).toHaveAttribute( 'aria-checked', 'true' );
	} );

	test( 'View intent makes blocks read-only', async ( { editor, page } ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Initial content' },
		} );

		await openIntentSwitcher( page );
		await page.getByRole( 'menuitemradio', { name: 'View' } ).click();

		// In preview mode, block content is not editable — the paragraph
		// should render but clicking and typing should not change it.
		const paragraph = editor.canvas.getByText( 'Initial content' );
		await expect( paragraph ).toBeVisible();
		await expect( paragraph ).not.toHaveAttribute(
			'contenteditable',
			'true'
		);
	} );

	test( 'View intent prevents suggestion overlay and commit bar', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Protected content' },
		} );

		// First enter Suggest mode and type to create an overlay.
		await openIntentSwitcher( page );
		await page.getByRole( 'menuitemradio', { name: 'Suggest' } ).click();

		const paragraph = editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.first();
		await paragraph.click();
		await page.keyboard.press( 'End' );
		await page.keyboard.type( ' added' );
		await expect( paragraph ).toContainText( 'Protected content added' );

		// Submit suggestion button should be visible in Suggest mode.
		const submitButton = page
			.getByRole( 'toolbar', { name: 'Block tools' } )
			.getByRole( 'button', { name: 'Submit suggestion' } );
		await expect( submitButton ).toBeVisible();

		// Switch to View — the editor becomes read-only and the commit
		// bar should disappear because isSuggestMode === false.
		await openIntentSwitcher( page );
		await page.getByRole( 'menuitemradio', { name: 'View' } ).click();

		await expect( submitButton ).toBeHidden();

		// The serialized content is unchanged — no suggestion leaked.
		const serialized = await editor.getEditedPostContent();
		expect( serialized ).toContain( 'Protected content' );
		expect( serialized ).not.toContain( 'added' );
	} );
} );
