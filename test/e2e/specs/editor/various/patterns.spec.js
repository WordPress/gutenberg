/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Unsynced pattern', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllBlocks();
		await requestUtils.deleteAllPatternCategories();
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllBlocks();
		await requestUtils.deleteAllPatternCategories();
	} );

	test( 'create a new unsynced pattern via the block options menu', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'A useful paragraph to reuse' },
		} );
		const before = await editor.getBlocks();

		// Create an unsynced pattern from the paragraph block.
		await editor.showBlockToolbar();
		await page
			.getByRole( 'toolbar', { name: 'Block tools' } )
			.getByRole( 'button', { name: 'Options' } )
			.click();
		await page.getByRole( 'menuitem', { name: 'Create pattern' } ).click();

		const createPatternDialog = page.getByRole( 'dialog', {
			name: 'add new pattern',
		} );
		await createPatternDialog
			.getByRole( 'textbox', { name: 'Name' } )
			.fill( 'My unsynced pattern' );
		const newCategory = 'Contact details';
		await createPatternDialog
			.getByRole( 'combobox', { name: 'Categories' } )
			.fill( newCategory );
		await createPatternDialog
			.getByRole( 'checkbox', { name: 'Synced' } )
			.setChecked( false );

		await page.keyboard.press( 'Enter' );

		// Check that the block content is still the same. If the pattern was added as synced
		// the content would be wrapped by a pattern block.
		await expect
			.poll(
				editor.getBlocks,
				'The block content should be the same after converting to an unsynced pattern'
			)
			.toEqual( before );

		// Check that the new pattern is available in the inserter and that it gets inserted as
		// a plain paragraph block.
		await page.getByLabel( 'Block Inserter' ).click();
		await page
			.getByRole( 'tab', {
				name: 'Patterns',
			} )
			.click();
		await page
			.getByRole( 'tab', {
				name: newCategory,
			} )
			.click();
		const pattern = page.getByLabel( 'My unsynced pattern' ).first();

		const insertedPatternId = await pattern.evaluate(
			( element ) => element.id
		);

		await pattern.click();

		await expect.poll( editor.getBlocks ).toEqual( [
			...before,
			{
				...before[ 0 ],
				attributes: {
					...before[ 0 ].attributes,
					metadata: {
						categories: [ 'contact-details' ],
						name: 'My unsynced pattern',
						patternName: insertedPatternId,
					},
				},
			},
		] );
	} );
} );

test.describe( 'Synced pattern', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllBlocks();
		await requestUtils.deleteAllPatternCategories();
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPosts();
		await requestUtils.deleteAllBlocks();
		await requestUtils.deleteAllPatternCategories();
	} );

	test( 'create a new synced pattern via the block options menu', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: {
				anchor: 'reused-paragraph',
				content: 'A useful paragraph to reuse',
			},
		} );

		// Create a synced pattern from the paragraph block.
		await editor.showBlockToolbar();
		await page
			.getByRole( 'toolbar', { name: 'Block tools' } )
			.getByRole( 'button', { name: 'Options' } )
			.click();
		await page.getByRole( 'menuitem', { name: 'Create pattern' } ).click();

		const createPatternDialog = page.getByRole( 'dialog', {
			name: 'add new pattern',
		} );
		await createPatternDialog
			.getByRole( 'textbox', { name: 'Name' } )
			.fill( 'My synced pattern' );
		const newCategory = 'Contact details';
		await createPatternDialog
			.getByRole( 'combobox', { name: 'Categories' } )
			.fill( newCategory );
		await createPatternDialog
			.getByRole( 'checkbox', { name: 'Synced' } )
			.setChecked( true );

		await createPatternDialog
			.getByRole( 'button', { name: 'Add' } )
			.click();

		// Check the pattern is focused.
		const patternBlock = editor.canvas.getByRole( 'document', {
			name: 'Block: Pattern',
		} );
		await expect( patternBlock ).toBeFocused();

		// Check that only the pattern block is present.
		const existingBlocks = await editor.getBlocks();
		expect(
			existingBlocks.every( ( block ) => block.name === 'core/block' )
		).toBe( true );

		// Check that the new pattern is available in the inserter.
		await page.getByLabel( 'Block Inserter' ).click();
		await page
			.getByRole( 'tab', {
				name: 'Patterns',
			} )
			.click();
		await page
			.getByRole( 'tab', {
				name: newCategory,
			} )
			.click();
		await page.getByRole( 'option', { name: 'My synced pattern' } ).click();

		const [ firstSyncedPattern, secondSyncedPattern ] =
			await editor.getBlocks();
		// Check they are both patterns.
		expect( firstSyncedPattern.name ).toBe( 'core/block' );
		expect( secondSyncedPattern.name ).toBe( 'core/block' );
		// Check they have the same ref.
		expect( firstSyncedPattern.attributes.ref ).toEqual(
			secondSyncedPattern.attributes.ref
		);

		// Check that the frontend shows the content of the pattern.
		const postId = await editor.publishPost();
		await page.goto( `/?p=${ postId }` );
		const [ firstParagraph, secondParagraph ] = await page
			.locator( '#reused-paragraph' )
			.all();

		await expect( firstParagraph ).toHaveText(
			'A useful paragraph to reuse'
		);
		await expect( secondParagraph ).toHaveText(
			'A useful paragraph to reuse'
		);
	} );

	// Check for regressions of https://github.com/WordPress/gutenberg/issues/33072.
	test( 'can be saved when modified inside of a published post', async ( {
		page,
		requestUtils,
		editor,
	} ) => {
		const { id } = await requestUtils.createBlock( {
			title: 'Alternative greeting block',
			content:
				'<!-- wp:paragraph -->\n<p id="reused-paragraph">Guten Tag!</p>\n<!-- /wp:paragraph -->',
			status: 'publish',
		} );

		await editor.insertBlock( {
			name: 'core/block',
			attributes: { ref: id },
		} );

		const postId = await editor.publishPost();

		await editor.selectBlocks(
			editor.canvas.getByRole( 'document', { name: 'Block: Pattern' } )
		);
		await editor.showBlockToolbar();
		await page
			.getByRole( 'toolbar', { name: 'Block tools' } )
			.getByRole( 'button', {
				name: 'Edit original',
			} )
			.click();

		const editorTopBar = page.getByRole( 'region', {
			name: 'Editor top bar',
		} );

		// Navigate to the pattern focus mode.
		await expect(
			editorTopBar.getByRole( 'heading', {
				name: 'Alternative greeting block',
				level: 1,
			} )
		).toBeVisible();

		await editor.selectBlocks(
			editor.canvas.getByRole( 'document', { name: 'Block: Paragraph' } )
		);

		// Change the block's content.
		await page.keyboard.type( 'Einen ' );

		// Save the reusable block and update the post.
		await editorTopBar.getByRole( 'button', { name: 'Save' } ).click();
		await page
			.getByRole( 'button', { name: 'Dismiss this notice' } )
			.filter( { hasText: 'Pattern updated.' } )
			.click();

		// Check that the frontend shows the updated content.
		await page.goto( `/?p=${ postId }` );
		await expect( page.locator( '#reused-paragraph' ) ).toHaveText(
			'Einen Guten Tag!'
		);
	} );

	// Check for regressions of https://github.com/WordPress/gutenberg/issues/26421.
	test( 'allows conversion back to blocks when the reusable block has unsaved edits', async ( {
		page,
		requestUtils,
		editor,
	} ) => {
		const { id } = await requestUtils.createBlock( {
			title: 'Synced pattern',
			content:
				'<!-- wp:paragraph -->\n<p>Before Edit</p>\n<!-- /wp:paragraph -->',
			status: 'publish',
		} );

		await editor.insertBlock( {
			name: 'core/block',
			attributes: { ref: id },
		} );

		await editor.selectBlocks(
			editor.canvas.getByRole( 'document', { name: 'Block: Pattern' } )
		);
		await page
			.getByRole( 'toolbar', { name: 'Block tools' } )
			.getByRole( 'button', {
				name: 'Edit original',
			} )
			.click();

		const editorTopBar = page.getByRole( 'region', {
			name: 'Editor top bar',
		} );

		// Navigate to the pattern focus mode.
		await expect(
			editorTopBar.getByRole( 'heading', {
				name: 'Synced pattern',
				level: 1,
			} )
		).toBeVisible();

		// Make an edit to the source pattern.
		await editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.fill( 'After Edit' );

		// Go back to the post.
		await editorTopBar.getByRole( 'button', { name: 'Back' } ).click();

		await editor.selectBlocks(
			editor.canvas.getByRole( 'document', { name: 'Block: Pattern' } )
		);
		await editor.clickBlockOptionsMenuItem( 'Detach' );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { content: 'After Edit' },
			},
		] );
	} );

	test( 'can be created, inserted, and converted to a regular block', async ( {
		editor,
		requestUtils,
	} ) => {
		const { id } = await requestUtils.createBlock( {
			title: 'Greeting block',
			content:
				'<!-- wp:paragraph -->\n<p>Hello there!</p>\n<!-- /wp:paragraph -->',
			status: 'publish',
		} );

		await editor.insertBlock( {
			name: 'core/block',
			attributes: { ref: id },
		} );

		// Check that only the pattern block is present.
		const existingBlocks = await editor.getBlocks();
		expect(
			existingBlocks.every( ( block ) => block.name === 'core/block' )
		).toBe( true );

		await editor.selectBlocks(
			editor.canvas.getByRole( 'document', { name: 'Block: Pattern' } )
		);
		await editor.clickBlockOptionsMenuItem( 'Detach' );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { content: 'Hello there!' },
			},
		] );
	} );

	test( 'can be inserted after refresh', async ( {
		admin,
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Awesome Paragraph' },
		} );
		await editor.clickBlockOptionsMenuItem( 'Create pattern' );

		const createPatternDialog = page.getByRole( 'dialog', {
			name: 'add new pattern',
		} );
		await createPatternDialog
			.getByRole( 'textbox', { name: 'Name' } )
			.fill( 'Awesome block' );
		await createPatternDialog
			.getByRole( 'checkbox', { name: 'Synced' } )
			.setChecked( true );
		await createPatternDialog
			.getByRole( 'button', { name: 'Add' } )
			.click();

		// Wait until the pattern is created.
		await expect(
			editor.canvas.getByRole( 'document', {
				name: 'Block: Pattern',
			} )
		).toBeVisible();

		await admin.createNewPost();
		await editor.canvas
			.getByRole( 'button', { name: 'Add default block' } )
			.click();
		await page.keyboard.type( '/Awesome block' );
		await page.getByRole( 'option', { name: 'Awesome block' } ).click();

		// Check that the pattern block is present.
		const existingBlocks = await editor.getBlocks();
		expect(
			existingBlocks.every( ( block ) => block.name === 'core/block' )
		).toBe( true );
	} );

	test( 'can be created from multiselection and converted back to regular blocks', async ( {
		editor,
		pageUtils,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Hello there!' },
		} );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Second paragraph' },
		} );

		await pageUtils.pressKeys( 'primary+a', { times: 2 } );
		await editor.clickBlockOptionsMenuItem( 'Create pattern' );

		const createPatternDialog = editor.page.getByRole( 'dialog', {
			name: 'add new pattern',
		} );
		await createPatternDialog
			.getByRole( 'textbox', { name: 'Name' } )
			.fill( 'Multi-selection reusable block' );
		await createPatternDialog
			.getByRole( 'checkbox', { name: 'Synced' } )
			.setChecked( true );
		await createPatternDialog
			.getByRole( 'button', { name: 'Add' } )
			.click();

		// Wait until the pattern is created.
		await expect(
			editor.canvas.getByRole( 'document', {
				name: 'Block: Pattern',
			} )
		).toBeVisible();

		// Check that only the pattern block is present.
		const existingBlocks = await editor.getBlocks();
		expect(
			existingBlocks.every( ( block ) => block.name === 'core/block' )
		).toBe( true );

		// Convert the pattern back to regular blocks.
		await editor.selectBlocks(
			editor.canvas.getByRole( 'document', { name: 'Block: Pattern' } )
		);
		await editor.clickBlockOptionsMenuItem( 'Detach' );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { content: 'Hello there!' },
			},
			{
				name: 'core/paragraph',
				attributes: { content: 'Second paragraph' },
			},
		] );
	} );

	// Check for regressions of https://github.com/WordPress/gutenberg/pull/26484.
	test( 'will not break the editor if empty', async ( {
		editor,
		page,
		requestUtils,
	} ) => {
		const { id } = await requestUtils.createBlock( {
			title: 'Awesome empty',
			content: '',
			status: 'publish',
		} );

		let hasError = false;
		page.on( 'console', ( msg ) => {
			if ( msg.type() === 'error' ) {
				hasError = true;
			}
		} );

		// Need to reload the page to make pattern available in the store.
		await page.reload();
		await editor.insertBlock( {
			name: 'core/block',
			attributes: { ref: id },
		} );

		await page
			.getByRole( 'button', { name: 'Block Inserter', exact: true } )
			.click();
		await page
			.getByRole( 'searchbox', {
				name: 'Search',
			} )
			.fill( 'Awesome empty' );

		await expect(
			page
				.getByRole( 'listbox', { name: 'Block patterns' } )
				.getByRole( 'option', {
					name: 'Awesome empty',
				} )
		).toBeVisible();
		expect( hasError ).toBe( false );
	} );

	test( 'should show a proper message when the reusable block is missing', async ( {
		editor,
	} ) => {
		// Insert a non-existant reusable block.
		await editor.insertBlock( {
			name: 'core/block',
			attributes: { ref: 123456 },
		} );

		await expect(
			editor.canvas.getByRole( 'document', { name: 'Block: Pattern' } )
		).toContainText( 'Block has been deleted or is unavailable.' );
	} );

	test( 'should be able to insert a reusable block twice', async ( {
		editor,
		page,
		pageUtils,
		requestUtils,
	} ) => {
		const { id } = await requestUtils.createBlock( {
			title: 'Duplicated reusable block',
			content:
				'<!-- wp:paragraph -->\n<p>Awesome Paragraph</p>\n<!-- /wp:paragraph -->',
			status: 'publish',
		} );
		await editor.insertBlock( {
			name: 'core/block',
			attributes: { ref: id },
		} );
		await editor.insertBlock( {
			name: 'core/block',
			attributes: { ref: id },
		} );

		await editor.saveDraft();
		await editor.selectBlocks(
			editor.canvas
				.getByRole( 'document', { name: 'Block: Pattern' } )
				.first()
		);
		await editor.showBlockToolbar();
		await page
			.getByRole( 'toolbar', { name: 'Block tools' } )
			.getByRole( 'button', { name: 'Edit original' } )
			.click();

		await editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.click();
		await pageUtils.pressKeys( 'primary+a' );
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.type( ' modified' );

		const editorTopBar = page.getByRole( 'region', {
			name: 'Editor top bar',
		} );

		await editorTopBar.getByRole( 'button', { name: 'Save' } ).click();
		await page
			.getByRole( 'button', { name: 'Dismiss this notice' } )
			.filter( { hasText: 'Pattern updated.' } )
			.click();
		await editorTopBar.getByRole( 'button', { name: 'Back' } ).click();

		await expect(
			editor.canvas
				.getByRole( 'document', { name: 'Block: Paragraph' } )
				.filter( { hasText: 'Awesome Paragraph modified' } )
		).toHaveCount( 2 );
	} );

	// Check for regressions of https://github.com/WordPress/gutenberg/issues/27243.
	test( 'should allow a block with styles to be converted to a reusable block', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( { name: 'core/quote' } );
		await editor.saveDraft();
		await page.reload();

		await editor.openDocumentSettingsSidebar();
		await editor.selectBlocks(
			editor.canvas.getByRole( 'document', { name: 'Block: Quote' } )
		);

		// The quote block should have a visible preview in the sidebar for this test to be valid.
		await expect(
			page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'button', { name: 'Styles', exact: true } )
		).toBeVisible();

		await editor.clickBlockOptionsMenuItem( 'Create pattern' );

		const createPatternDialog = editor.page.getByRole( 'dialog', {
			name: 'add new pattern',
		} );
		await createPatternDialog
			.getByRole( 'textbox', { name: 'Name' } )
			.fill( 'Block with styles' );
		await createPatternDialog
			.getByRole( 'checkbox', { name: 'Synced' } )
			.setChecked( true );
		await createPatternDialog
			.getByRole( 'button', { name: 'Add' } )
			.click();

		await expect(
			editor.canvas.getByRole( 'document', { name: 'Block: Pattern' } )
		).toBeVisible();
	} );
} );
