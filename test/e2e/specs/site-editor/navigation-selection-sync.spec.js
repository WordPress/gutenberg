const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const MENU_CONTENT =
	'<!-- wp:navigation-link {"label":"Item","type":"custom","url":"https://example.com/","kind":"custom"} /-->';

/**
 * Reports which Navigation block, if any, contains the current selection.
 *
 * Navigation blocks are inner block controllers: each keeps its own private
 * clones of the menu's blocks, so the selected client ID only identifies an
 * instance once it is resolved back to the Navigation block containing it.
 *
 * @param {Object} page Playwright page.
 * @return {Promise<number|null>} Index of the containing Navigation block in
 *                                document order, or null when the selection is
 *                                outside every Navigation block.
 */
function getSelectedNavigationIndex( page ) {
	return page.evaluate( () => {
		const { getSelectedBlockClientId, getBlocksByName, getBlockParents } =
			window.wp.data.select( 'core/block-editor' );
		const selected = getSelectedBlockClientId();
		if ( ! selected ) {
			return null;
		}
		const navigationBlocks = getBlocksByName( 'core/navigation' );
		const parents = getBlockParents( selected );
		const index = navigationBlocks.findIndex(
			( clientId ) =>
				clientId === selected || parents.includes( clientId )
		);
		return index === -1 ? null : index;
	} );
}

// Two Navigation blocks referencing the same menu are synced from the same
// wp_navigation entity, so editing one makes the other re-sync. Adapted from
// https://github.com/WordPress/gutenberg/pull/79929.
// See https://github.com/WordPress/gutenberg/issues/79096.
test.describe( 'Duplicate Navigation blocks using the same menu', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.beforeEach( async ( { admin, editor, requestUtils } ) => {
		const { id } = await requestUtils.createNavigationMenu( {
			title: 'Shared menu',
			content: MENU_CONTENT,
		} );

		await admin.visitSiteEditor( {
			postId: 'emptytheme//index',
			postType: 'wp_template',
			canvas: 'edit',
		} );

		await editor.insertBlock( {
			name: 'core/navigation',
			attributes: { ref: id },
		} );
		// Enough space between the two that a selection jump scrolls the canvas.
		await editor.insertBlock( {
			name: 'core/spacer',
			attributes: { height: '2000px' },
		} );
		await editor.insertBlock( {
			name: 'core/navigation',
			attributes: { ref: id },
		} );

		await expect(
			editor.canvas.locator(
				'role=textbox[name="Navigation link text"i]'
			)
		).toHaveCount( 2 );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
		await requestUtils.deleteAllMenus();
	} );

	test( 'editing a menu item leaves the caret and selection in the edited block', async ( {
		editor,
		page,
	} ) => {
		const labels = editor.canvas.locator(
			'role=textbox[name="Navigation link text"i]'
		);

		// A content overlay covers an unselected Navigation block, so the
		// block is clicked before its link label.
		await editor.canvas
			.getByRole( 'document', { name: 'Block: Navigation' } )
			.first()
			.click();
		await labels.first().click();
		await expect.poll( () => getSelectedNavigationIndex( page ) ).toBe( 0 );

		// Record every time the selection enters the duplicate. A steal is
		// momentary — the canvas scrolls as soon as it happens, even if the
		// selection later recovers — so asserting on the final selection
		// alone can miss it.
		await page.evaluate( () => {
			const {
				getSelectedBlockClientId,
				getBlocksByName,
				getBlockParents,
			} = window.wp.data.select( 'core/block-editor' );
			const duplicate = getBlocksByName( 'core/navigation' ).at( -1 );
			window.__selectionsInDuplicate = [];
			window.wp.data.subscribe( () => {
				const selected = getSelectedBlockClientId();
				if (
					selected &&
					( selected === duplicate ||
						getBlockParents( selected ).includes( duplicate ) ) &&
					window.__selectionsInDuplicate.at( -1 ) !== selected
				) {
					window.__selectionsInDuplicate.push( selected );
				}
			} );
		} );

		// Type a character in the middle of the label. The edit syncs into
		// both blocks; the selection must not follow it into the duplicate.
		await page.keyboard.press( 'End' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.type( 'X' );

		await expect( labels.first() ).toHaveText( 'IteXm' );
		await expect( labels.last() ).toHaveText( 'IteXm' );
		expect(
			await page.evaluate( () => window.__selectionsInDuplicate )
		).toEqual( [] );
		expect( await getSelectedNavigationIndex( page ) ).toBe( 0 );
	} );
} );
