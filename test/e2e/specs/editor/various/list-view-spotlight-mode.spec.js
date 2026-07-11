/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'List View Spotlight Mode', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllBlocks();
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllBlocks();
	} );

	/**
	 * Helper function to create a Group block with two paragraphs and convert it to an unsynced pattern.
	 *
	 * @param {Object} editor Editor utilities
	 * @param {Object} page   Page object
	 */
	async function createPatternWithContent( editor, page ) {
		// Create a Group block with two paragraphs inside
		await editor.insertBlock( { name: 'core/group' } );
		await editor.canvas
			.locator(
				'role=button[name="Group: Gather blocks in a container."i]'
			)
			.click();

		// Add first paragraph inside the group
		await editor.canvas.locator( 'role=button[name="Add block"i]' ).click();
		await page
			.getByRole( 'listbox', { name: 'Blocks' } )
			.getByRole( 'option', { name: 'Paragraph' } )
			.click();
		await page.keyboard.type( 'Pattern paragraph 1' );
		await page.keyboard.press( 'Enter' );

		// Add second paragraph inside the group
		await page.keyboard.type( 'Pattern paragraph 2' );

		// Create an unsynced pattern from the Group block
		await editor.selectBlocks(
			editor.canvas.getByRole( 'document', {
				name: 'Block: Group',
			} )
		);

		// Create pattern from block options
		await editor.showBlockToolbar();
		await page
			.getByRole( 'toolbar', { name: 'Block tools' } )
			.getByRole( 'button', { name: 'Options' } )
			.click();
		await page.getByRole( 'menuitem', { name: 'Create pattern' } ).click();

		const createPatternDialog = page.getByRole( 'dialog', {
			name: 'add pattern',
		} );
		await createPatternDialog
			.getByRole( 'textbox', { name: 'Name' } )
			.fill( 'Test Pattern for Spotlight' );
		await createPatternDialog
			.getByRole( 'checkbox', { name: 'Synced' } )
			.setChecked( false ); // Make it unsynced

		await page.keyboard.press( 'Enter' );
	}

	/**
	 * Helper function to enter spotlight mode and open list view.
	 *
	 * @param {Object} editor    Editor utilities
	 * @param {Object} page      Page object
	 * @param {Object} pageUtils Page utilities
	 */
	async function enterSpotlightModeAndOpenListView(
		editor,
		page,
		pageUtils
	) {
		// Enter spotlight mode by selecting the Group block and clicking "Edit pattern" in the toolbar.
		await editor.selectBlocks(
			editor.canvas.getByRole( 'document', {
				name: 'Block: Group',
			} )
		);

		await editor.clickBlockToolbarButton( 'Edit pattern' );

		// Open the list view
		await pageUtils.pressKeys( 'access+o' );
		const listView = page.getByRole( 'treegrid', {
			name: 'Block navigation structure',
		} );
		await expect( listView ).toBeVisible();
	}

	test( 'shows disabled blocks in list view and constrains keyboard navigation', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await createPatternWithContent( editor, page );

		await editor.insertBlock( { name: 'core/paragraph' } );
		await page.keyboard.type( 'Block beneath pattern' );

		await enterSpotlightModeAndOpenListView( editor, page, pageUtils );

		const listView = page.getByRole( 'treegrid', {
			name: 'Block navigation structure',
		} );

		const groupBlock = listView.getByRole( 'gridcell', {
			name: 'Test Pattern for Spotlight',
			exact: true,
		} );
		await expect( groupBlock ).toBeVisible();

		// The block beneath the pattern is the only disabled row (outside the edited section).
		const disabledBlockRow = listView
			.locator( '[role=row].is-disabled' )
			.first();
		await expect( disabledBlockRow ).toBeVisible();
		const blockBeneathPattern = disabledBlockRow.locator(
			'.block-editor-list-view-block-contents'
		);
		await expect( blockBeneathPattern ).toBeVisible();
		await expect( blockBeneathPattern ).toHaveAttribute(
			'aria-disabled',
			'true'
		);

		await groupBlock
			.locator( '.block-editor-list-view-block-contents' )
			.focus();
		await page.keyboard.press( 'End' );
		await expect( blockBeneathPattern ).not.toBeFocused();
		await expect(
			listView.locator( '[role=row].is-disabled:has(:focus)' )
		).toHaveCount( 0 );

		// Keyboard navigation is constrained to the pattern.
		await editor.canvas
			.getByRole( 'document', {
				name: 'Block: Paragraph',
			} )
			.first()
			.click();

		await page.keyboard.press( 'ArrowDown' );

		const patternParagraph2 = editor.canvas
			.getByRole( 'document', {
				name: 'Block: Paragraph',
			} )
			.filter( { hasText: 'Pattern paragraph 2' } );
		await expect( patternParagraph2 ).toBeFocused();

		// Attempting to navigate beyond the pattern is prevented.
		await page.keyboard.press( 'ArrowDown' );
		await expect( patternParagraph2 ).toBeFocused();

		const blockBeneath = editor.canvas
			.getByRole( 'document', {
				name: 'Block: Paragraph',
			} )
			.filter( { hasText: 'Block beneath pattern' } );
		await expect( blockBeneath ).not.toBeFocused();
	} );

	test( 'exits spotlight mode when clicking disabled block in list view', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await createPatternWithContent( editor, page );

		await editor.insertBlock( { name: 'core/paragraph' } );
		await page.keyboard.type( 'Block beneath pattern' );

		await enterSpotlightModeAndOpenListView( editor, page, pageUtils );

		const listView = page.getByRole( 'treegrid', {
			name: 'Block navigation structure',
		} );
		const disabledBlockRow = listView
			.locator( '[role=row].is-disabled' )
			.first();
		await expect( disabledBlockRow ).toBeVisible();
		const disabledBlockButton = disabledBlockRow.locator(
			'.block-editor-list-view-block-contents'
		);
		await expect( disabledBlockButton ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
		await disabledBlockButton.click();

		// Spotlight exited: no rows remain disabled.
		await expect(
			listView.locator( '[role=row].is-disabled' )
		).toHaveCount( 0 );

		const blockBeneath = editor.canvas
			.getByRole( 'document', {
				name: 'Block: Paragraph',
			} )
			.filter( { hasText: 'Block beneath pattern' } );
		await expect( blockBeneath ).toBeVisible();
		await expect( blockBeneath ).toHaveClass( /is-selected/ );
	} );

	test( 'exits spotlight mode when pressing Escape key', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await createPatternWithContent( editor, page );

		await editor.insertBlock( { name: 'core/paragraph' } );
		await page.keyboard.type( 'Block beneath pattern' );

		await enterSpotlightModeAndOpenListView( editor, page, pageUtils );

		const listView = page.getByRole( 'treegrid', {
			name: 'Block navigation structure',
		} );
		const disabledBlockRow = listView
			.locator( '[role=row].is-disabled' )
			.first();
		await expect( disabledBlockRow ).toBeVisible();
		await expect(
			disabledBlockRow.locator( '.block-editor-list-view-block-contents' )
		).toHaveAttribute( 'aria-disabled', 'true' );

		await editor.canvas
			.getByRole( 'document', {
				name: 'Block: Paragraph',
			} )
			.first()
			.click();

		await page.keyboard.press( 'Escape' );

		// Spotlight exited: no rows remain disabled.
		await expect(
			listView.locator( '[role=row].is-disabled' )
		).toHaveCount( 0 );

		const blockBeneath = editor.canvas
			.getByRole( 'document', {
				name: 'Block: Paragraph',
			} )
			.filter( { hasText: 'Block beneath pattern' } );

		await blockBeneath.click();
		await expect( blockBeneath ).toBeFocused();
	} );

	test( 'exits spotlight mode when pressing Escape key in list view', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await createPatternWithContent( editor, page );

		await editor.insertBlock( { name: 'core/paragraph' } );
		await page.keyboard.type( 'Block beneath pattern' );

		await enterSpotlightModeAndOpenListView( editor, page, pageUtils );

		const listView = page.getByRole( 'treegrid', {
			name: 'Block navigation structure',
		} );
		const disabledBlockRow = listView
			.locator( '[role=row].is-disabled' )
			.first();
		await expect( disabledBlockRow ).toBeVisible();
		await expect(
			disabledBlockRow.locator( '.block-editor-list-view-block-contents' )
		).toHaveAttribute( 'aria-disabled', 'true' );

		const groupBlock = listView.getByRole( 'gridcell', {
			name: 'Test Pattern for Spotlight',
			exact: true,
		} );
		await groupBlock
			.locator( '.block-editor-list-view-block-contents' )
			.focus();

		await page.keyboard.press( 'Escape' );

		await expect(
			listView.locator( '[role=row].is-disabled' )
		).toHaveCount( 0 );
	} );
} );
