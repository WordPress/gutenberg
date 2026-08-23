/**
 * E2E coverage for how pending block-level suggestions surface in List View
 * (#73411, finding F-24). The canvas carries the whole story of a structural
 * suggestion - outline, strikethrough, move tab - and every one of those cues
 * is colour and decoration. List View is the primary way to perceive
 * structural change and the main non-visual navigation surface, so a row whose
 * block is slated for removal has to say so both in its class and in its
 * accessible description.
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

/**
 * Opens List View and returns its treegrid locator.
 *
 * @param {import('@playwright/test').Page} page      Page under test.
 * @param {Object}                          pageUtils Playwright page utils.
 * @return {Promise<import('@playwright/test').Locator>} The List View treegrid.
 */
async function openListView( page, pageUtils ) {
	await pageUtils.pressKeys( 'access+o' );
	const listView = page.getByRole( 'treegrid', {
		name: 'Block navigation structure',
	} );
	await expect( listView ).toBeVisible();
	return listView;
}

/**
 * Finds the List View row belonging to a canvas block. Keys off the block's
 * client id rather than its index, since every paragraph row shares the same
 * accessible name.
 *
 * @param {import('@playwright/test').Locator} listView    List View treegrid.
 * @param {import('@playwright/test').Locator} canvasBlock The block in the canvas.
 * @return {Promise<import('@playwright/test').Locator>} The matching row.
 */
async function rowForBlock( listView, canvasBlock ) {
	await expect( canvasBlock ).toHaveAttribute( 'data-block', /.+/ );
	const clientId = await canvasBlock.getAttribute( 'data-block' );
	return listView.locator( `[role="row"][data-block="${ clientId }"]` );
}

test.describe( 'Suggestion mode - List View', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( [
			'gutenberg-suggestion-mode',
		] );
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllComments( 'note' );
		await requestUtils.setGutenbergExperiments( [] );
	} );

	test( 'marks a pending removal in List View, and leaves untouched rows alone', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Keep me' },
		} );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Remove me' },
		} );

		await switchIntent( page, 'Suggesting' );

		const doomed = editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.filter( { hasText: 'Remove me' } );
		await doomed.click();
		await editor.clickBlockOptionsMenuItem( 'Delete' );

		// Anchor on the canvas treatment first: once the block carries the
		// pending-remove class the marker is committed, so a later assertion
		// about List View cannot land before the store has caught up.
		await expect( doomed ).toHaveClass( /is-suggestion-pending-remove/ );

		const listView = await openListView( page, pageUtils );
		const doomedRow = await rowForBlock( listView, doomed );

		await expect( doomedRow ).toHaveClass( /is-suggestion-pending-remove/ );
		await expect(
			doomedRow.getByRole( 'link' )
		).toHaveAccessibleDescription( /Suggested removal\./ );

		// The surviving paragraph is untouched - no class, nothing announced.
		const keeper = editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.filter( { hasText: 'Keep me' } );
		const keeperRow = await rowForBlock( listView, keeper );
		await expect( keeperRow ).not.toHaveClass( /is-suggestion-pending/ );
		await expect(
			keeperRow.getByRole( 'link' )
		).not.toHaveAccessibleDescription( /Suggested/ );
	} );

	test( 'marks a pending insertion in List View', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Existing paragraph' },
		} );

		await switchIntent( page, 'Suggesting' );

		const paragraph = editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.first();
		await paragraph.click();
		await page.keyboard.press( 'End' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Newly suggested paragraph' );

		const added = editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.filter( { hasText: 'Newly suggested paragraph' } );
		await expect( added ).toHaveClass( /is-suggestion-pending-insert/ );

		const listView = await openListView( page, pageUtils );
		const addedRow = await rowForBlock( listView, added );

		await expect( addedRow ).toHaveClass( /is-suggestion-pending-insert/ );
		await expect(
			addedRow.getByRole( 'link' )
		).toHaveAccessibleDescription( /Suggested insertion\./ );
	} );

	test( 'marks a pending move in List View', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'First paragraph' },
		} );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Second paragraph' },
		} );

		await switchIntent( page, 'Suggesting' );

		const mover = editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.filter( { hasText: 'First paragraph' } );
		// Select via the store: the freshly-inserted second block's floating
		// toolbar hovers over the first paragraph and intercepts a raw click.
		await editor.selectBlocks( mover );
		await editor.clickBlockToolbarButton( 'Move down' );
		await expect( mover ).toHaveClass( /is-suggestion-pending-move/ );

		const listView = await openListView( page, pageUtils );
		const moverRow = await rowForBlock( listView, mover );

		await expect( moverRow ).toHaveClass( /is-suggestion-pending-move/ );
		await expect(
			moverRow.getByRole( 'link' )
		).toHaveAccessibleDescription( /Suggested move destination\./ );
	} );
} );
