/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const documentToolbarButton = ( page ) => {
	return page.getByRole( 'button', {
		name: 'Toggle block inserter',
		exact: true,
	} );
};

const documentToolbarTooltip = ( page ) => {
	return page.locator( 'text=Toggle block inserter' );
};

const blockToolbarButton = ( page ) => {
	return page.getByRole( 'button', { name: 'Paragraph', exact: true } );
};

const useSelectMode = async ( page ) => {
	await page.keyboard.press( 'Escape' );
};

const moveToToolbarShortcut = async ( pageUtils ) => {
	await pageUtils.pressKeys( 'alt+F10' );
};

test.describe( 'Focus toolbar shortcut (alt + F10)', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'Focuses correct toolbar in default view options in edit mode', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		// Test: Focus the top level toolbar from title
		await moveToToolbarShortcut( pageUtils );
		await expect( documentToolbarButton( page ) ).toBeFocused();

		// Test: Focus document toolbar from empty block
		await editor.insertBlock( { name: 'core/paragraph' } );
		await moveToToolbarShortcut( pageUtils );
		await expect( documentToolbarButton( page ) ).toBeFocused();

		// Test: Focus block toolbar from block content when block toolbar isn't visible
		await editor.insertBlock( { name: 'core/paragraph' } );
		await page.keyboard.type(
			"Focus to block toolbar when block toolbar isn't visible"
		);
		await moveToToolbarShortcut( pageUtils );
		await expect( blockToolbarButton( page ) ).toBeFocused();
		await expect( documentToolbarTooltip( page ) ).not.toBeVisible();

		// Test: Focus block toolbar from block content when block toolbar is visible
		await editor.insertBlock( { name: 'core/paragraph' } );
		await page.keyboard.type(
			'Focus to block toolbar when block toolbar is visible'
		);
		// We need to force the toolbar to show. Otherwise, the bug from
		// https://github.com/WordPress/gutenberg/pull/49644 won't surface in the e2e tests.
		await editor.showBlockToolbar();
		await moveToToolbarShortcut( pageUtils );
		await expect( blockToolbarButton( page ) ).toBeFocused();
		await expect( documentToolbarTooltip( page ) ).not.toBeVisible();
	} );

	test( 'Focuses correct toolbar in default view options in select mode', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		// Test: Focus the document toolbar from title
		await useSelectMode( page );
		await moveToToolbarShortcut( pageUtils );
		await expect( documentToolbarButton( page ) ).toBeFocused();

		// Test: Focus the top level toolbar from empty block
		await editor.insertBlock( { name: 'core/paragraph' } );
		await useSelectMode( page );
		await moveToToolbarShortcut( pageUtils );
		await expect( documentToolbarButton( page ) ).toBeFocused();

		// Test: Focus the top level toolbar from paragraph block
		await editor.insertBlock( { name: 'core/paragraph' } );
		await page.keyboard.type(
			'Focus top level toolbar from paragraph block in select mode.'
		);
		await useSelectMode( page );
		await moveToToolbarShortcut( pageUtils );
		await expect( documentToolbarButton( page ) ).toBeFocused();
	} );

	test.describe( 'In Top Toolbar option:', () => {
		test.beforeEach( async ( { editor } ) => {
			// Ensure the fixed toolbar option is on
			await editor.toggleFixedToolbar( true );
		} );

		test( 'Focuses the correct toolbar in edit mode', async ( {
			editor,
			page,
			pageUtils,
		} ) => {
			// Test: Focus the document toolbar from title
			await moveToToolbarShortcut( pageUtils );
			await expect( documentToolbarButton( page ) ).toBeFocused();

			// Test: Focus the block toolbar from empty block
			await editor.insertBlock( { name: 'core/paragraph' } );
			await moveToToolbarShortcut( pageUtils );
			await expect( blockToolbarButton( page ) ).toBeFocused();
			await expect( documentToolbarTooltip( page ) ).not.toBeVisible();

			// Test: Focus the block toolbar from paragraph block with content
			await editor.insertBlock( { name: 'core/paragraph' } );
			await page.keyboard.type(
				'Focus the block toolbar from paragraph block with content'
			);
			await moveToToolbarShortcut( pageUtils );
			await expect( blockToolbarButton( page ) ).toBeFocused();
			await expect( documentToolbarTooltip( page ) ).not.toBeVisible();
		} );

		test( 'Focuses the correct toolbar in select mode', async ( {
			editor,
			page,
			pageUtils,
		} ) => {
			// Test: Focus the document toolbar from title
			await useSelectMode( page );
			await moveToToolbarShortcut( pageUtils );
			await expect( documentToolbarButton( page ) ).toBeFocused();

			// Test: Focus the block toolbar from empty block
			await editor.insertBlock( { name: 'core/paragraph' } );
			await useSelectMode( page );
			await moveToToolbarShortcut( pageUtils );
			await expect( blockToolbarButton( page ) ).toBeFocused();
			await expect( documentToolbarTooltip( page ) ).not.toBeVisible();

			// Test: Focus the block toolbar from paragraph in select mode
			await editor.insertBlock( { name: 'core/paragraph' } );
			await page.keyboard.type(
				'Focus the block toolbar from paragraph in select mode'
			);
			await useSelectMode( page );
			await moveToToolbarShortcut( pageUtils );
			await expect( blockToolbarButton( page ) ).toBeFocused();
			await expect( documentToolbarTooltip( page ) ).not.toBeVisible();
		} );
	} );
} );
