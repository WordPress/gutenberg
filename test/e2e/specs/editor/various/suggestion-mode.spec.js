/**
 * WordPress dependencies
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
	// `MenuItemsChoice` doesn't auto-close its dropdown on selection, so
	// leaving the menu open would make a subsequent `Options` click toggle
	// it closed instead of reopening it.
	await page.keyboard.press( 'Escape' );
}

test.describe( 'Suggestion mode', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
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

		// The serialized post content stays at the baseline — the overlay
		// never touched the block-editor store.
		const serialized = await editor.getEditedPostContent();
		expect( serialized ).toContain( 'Original content' );
		expect( serialized ).not.toContain( 'plus suggested' );
	} );

	// The overlay HOC only intercepts `setAttributes` calls the block's own
	// `BlockEdit` receives as a prop. Heading level on web is changed via
	// the block-switcher variation picker, which dispatches
	// `updateBlockAttributes` directly on the block-editor store and
	// bypasses the HOC. Capturing store-level attribute changes requires
	// an additional interception layer in the suggestion provider and is
	// tracked as follow-up work.
	// eslint-disable-next-line playwright/no-skipped-test
	test.skip( 'captures non-text attribute changes (heading level)', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/heading',
			attributes: { content: 'My Heading', level: 2 },
		} );

		await switchIntent( page, 'Suggest' );

		const serialized = await editor.getEditedPostContent();
		expect( serialized ).toContain( '<!-- wp:heading' );
		expect( serialized ).not.toContain( '"level":3' );
	} );

	test( 'restores baseline when switching back to Edit intent', async ( {
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

		// Switching out of Suggest intent un-merges the overlay; the block
		// renders the real attributes again.
		await switchIntent( page, 'Edit' );
		await expect( paragraph ).toContainText( 'Keep as is' );
		await expect( paragraph ).not.toContainText( 'Keep as is!' );
	} );
} );
