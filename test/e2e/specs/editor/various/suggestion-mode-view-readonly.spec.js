/**
 * E2E coverage for the Viewing intent being genuinely read-only (#73411,
 * findings F-01 and F-02). Viewing is described in the Mode menu as a
 * "Read-only preview of the content", so no keystroke and no header control
 * may mutate blocks or dirty the post.
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

test.describe( 'Suggestion mode - Viewing intent is read-only', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( [
			'gutenberg-suggestion-mode',
		] );
	} );

	test.beforeEach( async ( { admin, editor } ) => {
		await admin.createNewPost();
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'First paragraph' },
		} );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Second paragraph' },
		} );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( [] );
	} );

	test( 'no keystroke changes the blocks in Viewing mode', async ( {
		editor,
		page,
	} ) => {
		await switchIntent( page, 'Viewing' );

		const paragraph = editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.first();
		await paragraph.click();
		for ( const key of [ 'Enter', 'a', 'Backspace', 'Delete', 'Enter' ] ) {
			await page.keyboard.press( key );
		}

		const blocks = await editor.getBlocks();
		expect( blocks ).toHaveLength( 2 );
		expect( blocks[ 0 ].attributes.content ).toBe( 'First paragraph' );
		expect( blocks[ 1 ].attributes.content ).toBe( 'Second paragraph' );
	} );

	test( 'the block inserter is disabled in Viewing mode', async ( {
		page,
	} ) => {
		const inserterToggle = page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Block Inserter' } );

		await expect( inserterToggle ).toBeEnabled();

		await switchIntent( page, 'Viewing' );
		await expect( inserterToggle ).toBeDisabled();

		// Returning to Editing restores it: the read-only state follows the
		// intent rather than being a one-way trip.
		await switchIntent( page, 'Editing' );
		await expect( inserterToggle ).toBeEnabled();
	} );

	test( 'an inserter opened over a Viewing canvas offers nothing', async ( {
		editor,
		page,
	} ) => {
		await switchIntent( page, 'Viewing' );

		// The header toggle is disabled by now, so drive the inserter open
		// through the store: that proves insertion is refused by the editor
		// itself and not only hidden behind a disabled control.
		await page.evaluate( () =>
			window.wp.data.dispatch( 'core/editor' ).setIsInserterOpened( true )
		);

		const library = page.getByRole( 'region', { name: 'Block Library' } );
		await expect( library ).toBeVisible();
		await expect( library.getByRole( 'option' ) ).toHaveCount( 0 );

		const blocks = await editor.getBlocks();
		expect( blocks ).toHaveLength( 2 );
	} );

	test( 'switching to Viewing closes an open inserter', async ( {
		page,
	} ) => {
		await page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Block Inserter' } )
			.click();
		const library = page.getByRole( 'region', { name: 'Block Library' } );
		await expect( library ).toBeVisible();

		await switchIntent( page, 'Viewing' );
		await expect( library ).toBeHidden();
	} );
} );
