/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.use( {
	toolbarUtils: async ( { page, pageUtils }, use ) => {
		await use( new ToolbarUtils( { page, pageUtils } ) );
	},
} );

test.describe( 'Focus toolbar shortcut (alt + F10)', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'Focuses correct toolbar in default view options in edit mode', async ( {
		editor,
		page,
		toolbarUtils,
	} ) => {
		// Test: Focus the top level toolbar from title
		await toolbarUtils.moveToToolbarShortcut();
		await expect( toolbarUtils.documentToolbarButton ).toBeFocused();

		// Test: Focus document toolbar from empty block
		await editor.insertBlock( { name: 'core/paragraph' } );
		await toolbarUtils.moveToToolbarShortcut();
		await expect( toolbarUtils.documentToolbarButton ).toBeFocused();

		// Test: Focus block toolbar from block content when block toolbar isn't visible
		await editor.insertBlock( { name: 'core/paragraph' } );
		await page.keyboard.type(
			"Focus to block toolbar when block toolbar isn't visible"
		);
		await toolbarUtils.moveToToolbarShortcut();
		await expect( toolbarUtils.blockToolbarParagraphButton ).toBeFocused();
		await expect( toolbarUtils.documentToolbarTooltip ).toBeHidden();

		// Test: Focus block toolbar from block content when block toolbar is visible
		await editor.insertBlock( { name: 'core/paragraph' } );
		await page.keyboard.type(
			'Focus to block toolbar when block toolbar is visible'
		);
		// We need to force the toolbar to show. Otherwise, the bug from
		// https://github.com/WordPress/gutenberg/pull/49644 won't surface in the e2e tests.
		await editor.showBlockToolbar();
		await toolbarUtils.moveToToolbarShortcut();
		await expect( toolbarUtils.blockToolbarParagraphButton ).toBeFocused();
		await expect( toolbarUtils.documentToolbarTooltip ).toBeHidden();
	} );

	test.describe( 'In Top Toolbar option:', () => {
		test.beforeEach( async ( { editor } ) => {
			// Ensure the fixed toolbar option is on
			await editor.setIsFixedToolbar( true );
		} );

		test.afterEach( async ( { editor } ) => {
			// Ensure the fixed toolbar option is off
			await editor.setIsFixedToolbar( false );
		} );

		test( 'Focuses the correct toolbar in edit mode', async ( {
			editor,
			page,
			toolbarUtils,
		} ) => {
			// Test: Focus the document toolbar from title
			await toolbarUtils.moveToToolbarShortcut();
			await expect( toolbarUtils.documentToolbarButton ).toBeFocused();

			// Test: Focus the block toolbar from empty block
			await editor.insertBlock( { name: 'core/paragraph' } );
			// This fails if we don't wait for the block toolbar to show.
			await expect(
				toolbarUtils.blockToolbarParagraphButton
			).toBeVisible();
			await toolbarUtils.moveToToolbarShortcut();
			await expect(
				toolbarUtils.blockToolbarParagraphButton
			).toBeFocused();

			// Test: Focus the block toolbar from paragraph block with content
			await editor.insertBlock( { name: 'core/paragraph' } );
			await page.keyboard.type(
				'Focus the block toolbar from paragraph block with content'
			);
			await toolbarUtils.moveToToolbarShortcut();
			await expect(
				toolbarUtils.blockToolbarParagraphButton
			).toBeFocused();
		} );

		test( 'Focuses the correct toolbar in select mode', async ( {
			editor,
			page,
			toolbarUtils,
		} ) => {
			// Test: Focus the document toolbar from title
			await toolbarUtils.useSelectMode();
			await toolbarUtils.moveToToolbarShortcut();
			await expect( toolbarUtils.documentToolbarButton ).toBeFocused();

			// Test: Focus the block toolbar from empty block
			await editor.insertBlock( { name: 'core/paragraph' } );
			await toolbarUtils.useSelectMode();
			await toolbarUtils.moveToToolbarShortcut();
			await expect(
				toolbarUtils.blockToolbarParagraphButton
			).toBeFocused();

			// Test: Focus the block toolbar from paragraph in select mode
			await editor.insertBlock( { name: 'core/paragraph' } );
			await page.keyboard.type(
				'Focus the block toolbar from paragraph in select mode'
			);
			await toolbarUtils.useSelectMode();
			await toolbarUtils.moveToToolbarShortcut();
			await expect(
				toolbarUtils.blockToolbarParagraphButton
			).toBeFocused();
		} );
	} );

	test.describe( 'Smaller than large viewports', () => {
		test.use( {
			// Make the viewport small enough to trigger the fixed toolbar
			viewport: {
				width: 700,
				height: 700,
			},
		} );

		test( 'Focuses the correct toolbar in edit mode', async ( {
			editor,
			page,
			toolbarUtils,
		} ) => {
			// Test: Focus the document toolbar from title
			await toolbarUtils.moveToToolbarShortcut();
			await expect( toolbarUtils.documentToolbarButton ).toBeFocused();

			// Test: Focus the block toolbar from empty block
			await editor.insertBlock( { name: 'core/paragraph' } );
			await toolbarUtils.moveToToolbarShortcut();
			await expect(
				toolbarUtils.blockToolbarParagraphButton
			).toBeFocused();
			await expect( toolbarUtils.documentToolbarTooltip ).toBeHidden();

			// Test: Focus the block toolbar from paragraph block with content
			await editor.insertBlock( { name: 'core/paragraph' } );
			await page.keyboard.type(
				'Focus the block toolbar from paragraph block with content'
			);
			await toolbarUtils.moveToToolbarShortcut();
			await expect(
				toolbarUtils.blockToolbarParagraphButton
			).toBeFocused();
			await expect( toolbarUtils.documentToolbarTooltip ).toBeHidden();
		} );

		test( 'Focuses the correct toolbar in select mode', async ( {
			editor,
			page,
			toolbarUtils,
		} ) => {
			// Test: Focus the document toolbar from title
			await toolbarUtils.useSelectMode();
			await toolbarUtils.moveToToolbarShortcut();
			await expect( toolbarUtils.documentToolbarButton ).toBeFocused();

			// Test: Focus the block toolbar from empty block
			await editor.insertBlock( { name: 'core/paragraph' } );
			await toolbarUtils.useSelectMode();
			await toolbarUtils.moveToToolbarShortcut();
			await expect(
				toolbarUtils.blockToolbarParagraphButton
			).toBeFocused();
			await expect( toolbarUtils.documentToolbarTooltip ).toBeHidden();

			// Test: Focus the block toolbar from paragraph in select mode
			await editor.insertBlock( { name: 'core/paragraph' } );
			await page.keyboard.type(
				'Focus the block toolbar from paragraph in select mode'
			);
			await toolbarUtils.useSelectMode();
			await toolbarUtils.moveToToolbarShortcut();
			await expect(
				toolbarUtils.blockToolbarParagraphButton
			).toBeFocused();
			await expect( toolbarUtils.documentToolbarTooltip ).toBeHidden();
		} );
	} );
} );

class ToolbarUtils {
	constructor( { page, pageUtils } ) {
		this.page = page;
		this.pageUtils = pageUtils;

		this.documentToolbarButton = this.page.getByRole( 'button', {
			name: 'Block Inserter',
			exact: true,
		} );
		this.documentToolbarTooltip = this.page.locator(
			'text=Block Inserter'
		);
		this.blockToolbarParagraphButton = this.page.getByRole( 'button', {
			name: 'Paragraph',
			exact: true,
		} );
		this.blockToolbarShowDocumentButton = this.page.getByRole( 'button', {
			name: 'Hide block tools',
			exact: true,
		} );
	}

	async useSelectMode() {
		await this.page.keyboard.press( 'Escape' );
	}

	async moveToToolbarShortcut() {
		await this.pageUtils.pressKeys( 'alt+F10' );
	}
}
