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
} );
