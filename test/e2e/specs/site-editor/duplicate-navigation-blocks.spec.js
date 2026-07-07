/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

// Two Navigation blocks referencing the same menu are synced from the same
// wp_navigation entity, so editing one makes the other re-sync. The re-sync
// must not move the selection (and scroll) to the other block.
// See https://github.com/WordPress/gutenberg/issues/79096.
test.describe( 'Duplicate Navigation blocks using the same menu', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
		await requestUtils.deleteAllMenus();
	} );

	test( 'editing a menu item in one block does not move the selection to its duplicate', async ( {
		admin,
		editor,
		page,
		pageUtils,
		requestUtils,
	} ) => {
		const { id: menuId } = await requestUtils.createNavigationMenu( {
			title: 'Shared menu',
			content:
				'<!-- wp:navigation-link {"label":"Item","type":"custom","url":"https://example.com/","kind":"custom"} /-->',
		} );

		await admin.visitSiteEditor( {
			postId: 'emptytheme//index',
			postType: 'wp_template',
			canvas: 'edit',
		} );

		await editor.insertBlock( {
			name: 'core/navigation',
			attributes: { ref: menuId },
		} );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Content between the two menus' },
		} );
		await editor.insertBlock( {
			name: 'core/navigation',
			attributes: { ref: menuId },
		} );

		// Wait for both Navigation blocks to load the menu.
		const linkLabels = editor.canvas.locator(
			'role=textbox[name="Navigation link text"i]'
		);
		await expect( linkLabels ).toHaveCount( 2 );

		// Place the caret in the first Navigation block's link label. (A
		// content overlay covers unselected Navigation blocks, hence the
		// click on the block before the click on the label.)
		await editor.canvas
			.getByRole( 'document', { name: 'Block: Navigation' } )
			.first()
			.click();
		await linkLabels.first().click();

		// Record every time the selection enters the second Navigation
		// block. Stealing the selection is momentary (the editor scrolls as
		// soon as it happens, even if the selection later recovers), so
		// asserting on the final selection alone could miss it. This is
		// installed after the caret is placed above, because inserting the
		// blocks left the second Navigation block selected.
		await page.evaluate( () => {
			const {
				getSelectedBlockClientId,
				getBlockParents,
				getBlockOrder,
				getBlockName,
			} = window.wp.data.select( 'core/block-editor' );
			const secondNavigationClientId = getBlockOrder()
				.filter( ( id ) => getBlockName( id ) === 'core/navigation' )
				.at( -1 );
			window.__selectionsInSecondNavigation = [];
			window.wp.data.subscribe( () => {
				const selected = getSelectedBlockClientId();
				if (
					selected &&
					( selected === secondNavigationClientId ||
						getBlockParents( selected ).includes(
							secondNavigationClientId
						) ) &&
					window.__selectionsInSecondNavigation.at( -1 ) !== selected
				) {
					window.__selectionsInSecondNavigation.push( selected );
				}
			} );
		} );

		// Rewrite the link label. Every keystroke updates the shared entity
		// and re-syncs the second Navigation block, which is when it used
		// to steal the selection and scroll into view. With the selection
		// stolen, the caret snapped back to a stale position after every
		// keystroke, so the text came out reversed ("lebal weN").
		await pageUtils.pressKeys( 'primary+a' );
		await page.keyboard.type( 'New label' );

		// The edit syncs into both Navigation blocks…
		await expect( linkLabels.first() ).toHaveText( 'New label' );
		await expect( linkLabels.last() ).toHaveText( 'New label' );

		// …and the selection never enters the second one.
		expect(
			await page.evaluate( () => window.__selectionsInSecondNavigation )
		).toEqual( [] );
	} );
} );
