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
			name: 'Create pattern',
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
		await page.getByLabel( 'Toggle block inserter' ).click();
		await page
			.getByRole( 'tab', {
				name: 'Patterns',
			} )
			.click();
		await page
			.getByRole( 'button', {
				name: newCategory,
			} )
			.click();
		await page.getByLabel( 'My unsynced pattern' ).click();

		await expect
			.poll( editor.getBlocks )
			.toEqual( [ ...before, ...before ] );
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
		await requestUtils.deleteAllBlocks();
		await requestUtils.deleteAllPatternCategories();
	} );

	test( 'create a new synced pattern via the block options menu', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'A useful paragraph to reuse' },
		} );

		// Create a synced pattern from the paragraph block.
		await editor.showBlockToolbar();
		await page
			.getByRole( 'toolbar', { name: 'Block tools' } )
			.getByRole( 'button', { name: 'Options' } )
			.click();
		await page.getByRole( 'menuitem', { name: 'Create pattern' } ).click();

		const createPatternDialog = page.getByRole( 'dialog', {
			name: 'Create pattern',
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
			.getByRole( 'button', { name: 'Create' } )
			.click();

		await expect
			.poll(
				editor.getBlocks,
				'The block content should be wrapped by a pattern block wrapper'
			)
			.toEqual( [
				{
					name: 'core/block',
					attributes: { ref: expect.any( Number ) },
					innerBlocks: [
						{
							attributes: {
								content: 'A useful paragraph to reuse',
								dropCap: false,
							},
							innerBlocks: [],
							name: 'core/paragraph',
						},
					],
				},
			] );
		const after = await editor.getBlocks();

		const patternBlock = editor.canvas.getByRole( 'document', {
			name: 'Block: Pattern',
		} );
		await expect( patternBlock ).toBeFocused();

		// Check that the new pattern is available in the inserter.
		await page.getByLabel( 'Toggle block inserter' ).click();
		await page
			.getByRole( 'tab', {
				name: 'Patterns',
			} )
			.click();
		await page
			.getByRole( 'button', {
				name: newCategory,
			} )
			.click();
		await page.getByRole( 'option', { name: 'My synced pattern' } ).click();

		await expect.poll( editor.getBlocks ).toEqual( [ ...after, ...after ] );
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
				'<!-- wp:paragraph -->\n<p>Guten Tag!</p>\n<!-- /wp:paragraph -->',
			status: 'publish',
		} );

		await editor.insertBlock( {
			name: 'core/block',
			attributes: { ref: id },
		} );

		await editor.publishPost();

		await editor.selectBlocks(
			editor.canvas.getByRole( 'document', { name: 'Block: Pattern' } )
		);
		await editor.showBlockToolbar();
		await page
			.getByRole( 'toolbar', { name: 'Block tools' } )
			.getByRole( 'link', { name: 'Edit original' } )
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
		await editorTopBar.getByRole( 'button', { name: 'Update' } ).click();
		await page
			.getByRole( 'button', { name: 'Dismiss this notice' } )
			.filter( { hasText: 'Pattern updated.' } )
			.click();

		// Go back to the post.
		await editorTopBar.getByRole( 'button', { name: 'Back' } ).click();

		await expect.poll( editor.getBlocks ).toEqual( [
			{
				name: 'core/block',
				attributes: { ref: id },
				innerBlocks: [
					{
						name: 'core/paragraph',
						attributes: {
							content: 'Einen Guten Tag!',
							dropCap: false,
						},
						innerBlocks: [],
					},
				],
			},
		] );
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
			.getByRole( 'link', { name: 'Edit original' } )
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

		const expectedParagraphBlock = {
			name: 'core/paragraph',
			attributes: { content: 'After Edit' },
		};

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/block',
				attributes: { ref: id },
				innerBlocks: [ expectedParagraphBlock ],
			},
		] );

		await editor.selectBlocks(
			editor.canvas.getByRole( 'document', { name: 'Block: Pattern' } )
		);
		await editor.clickBlockOptionsMenuItem( 'Detach' );

		await expect
			.poll( editor.getBlocks )
			.toMatchObject( [ expectedParagraphBlock ] );
	} );
} );
