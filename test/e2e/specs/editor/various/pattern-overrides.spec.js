/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Pattern Overrides', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.activateTheme( 'emptytheme' ),
			requestUtils.deleteAllBlocks(),
		] );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllBlocks();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.activateTheme( 'twentytwentyone' ),
		] );
	} );

	test( 'Create a pattern with overrides', async ( {
		page,
		admin,
		editor,
	} ) => {
		let patternId;
		let editableParagraphId;

		await test.step( 'Create a synced pattern and assign blocks to allow overrides', async () => {
			await admin.visitSiteEditor( { path: '/patterns' } );

			await page
				.getByRole( 'region', { name: 'Navigation' } )
				.getByRole( 'button', { name: 'Create pattern' } )
				.click();

			await page
				.getByRole( 'menu', { name: 'Create pattern' } )
				.getByRole( 'menuitem', { name: 'Create pattern' } )
				.click();

			const createPatternDialog = page.getByRole( 'dialog', {
				name: 'Create pattern',
			} );
			await createPatternDialog
				.getByRole( 'textbox', { name: 'Name' } )
				.fill( 'Pattern with overrides' );
			await createPatternDialog
				.getByRole( 'checkbox', { name: 'Synced' } )
				.setChecked( true );
			await createPatternDialog
				.getByRole( 'button', { name: 'Create' } )
				.click();

			await editor.canvas
				.getByRole( 'button', { name: 'Add default block' } )
				.click();
			await page.keyboard.type( 'This paragraph can be edited' );
			await page.keyboard.press( 'Enter' );
			await page.keyboard.type( "This one can't" );

			await editor.canvas
				.getByRole( 'document', { name: 'Block: Paragraph' } )
				.filter( { hasText: 'This paragraph can be edited' } )
				.focus();
			await editor.openDocumentSettingsSidebar();
			const editorSettings = page.getByRole( 'region', {
				name: 'Editor settings',
			} );
			const advancedPanel = editorSettings.getByRole( 'button', {
				name: 'Advanced',
			} );
			if (
				( await advancedPanel.getAttribute( 'aria-expanded' ) ) ===
				'false'
			) {
				await advancedPanel.click();
			}
			await editorSettings
				.getByRole( 'checkbox', { name: 'Allow instance overrides' } )
				.setChecked( true );

			await expect.poll( editor.getBlocks ).toMatchObject( [
				{
					name: 'core/paragraph',
					attributes: {
						content: 'This paragraph can be edited',
						metadata: {
							id: expect.any( String ),
							bindings: {
								content: {
									source: 'core/pattern-overrides',
								},
							},
						},
					},
				},
				{
					name: 'core/paragraph',
					attributes: { content: "This one can't" },
				},
			] );

			await page
				.getByRole( 'region', { name: 'Editor top bar' } )
				.getByRole( 'button', { name: 'Save' } )
				.click();
			await page
				.getByRole( 'region', { name: 'Save panel' } )
				.getByRole( 'button', { name: 'Save' } )
				.click();

			await expect(
				page.getByRole( 'button', { name: 'Dismiss this notice' } )
			).toBeVisible();

			patternId = new URL( page.url() ).searchParams.get( 'postId' );
			const blocks = await editor.getBlocks();
			editableParagraphId = blocks[ 0 ].attributes.metadata.id;
		} );

		await test.step( 'Create a post and insert the pattern with overrides', async () => {
			await admin.createNewPost();

			await editor.insertBlock( {
				name: 'core/block',
				attributes: { ref: patternId },
			} );
			await editor.insertBlock( {
				name: 'core/block',
				attributes: { ref: patternId },
			} );

			const patternBlocks = editor.canvas.getByRole( 'document', {
				name: 'Block: Pattern',
			} );
			const paragraphs = patternBlocks.first().getByRole( 'document', {
				name: 'Block: Paragraph',
			} );
			await expect( paragraphs.first() ).not.toHaveAttribute(
				'inert',
				'true'
			);
			await expect( paragraphs.last() ).toHaveAttribute(
				'inert',
				'true'
			);

			await expect( paragraphs.first() ).toHaveText(
				'This paragraph can be edited'
			);

			await paragraphs.first().selectText();
			await page.keyboard.type( 'I would word it this way' );

			await patternBlocks
				.last()
				.getByRole( 'document', {
					name: 'Block: Paragraph',
				} )
				.first()
				.selectText();
			await page.keyboard.type( 'This one is different' );

			await expect.poll( editor.getBlocks ).toMatchObject( [
				{
					name: 'core/block',
					attributes: {
						ref: patternId,
						content: {
							[ editableParagraphId ]: {
								values: {
									content: 'I would word it this way',
								},
							},
						},
					},
				},
				{
					name: 'core/block',
					attributes: {
						ref: patternId,
						content: {
							[ editableParagraphId ]: {
								values: {
									content: 'This one is different',
								},
							},
						},
					},
				},
			] );

			await page
				.getByRole( 'region', { name: 'Editor top bar' } )
				.getByRole( 'button', { name: 'Publish' } )
				.click();
			const editorPublishPanel = page.getByRole( 'region', {
				name: 'Editor publish',
			} );
			await editorPublishPanel
				.getByRole( 'button', { name: 'Publish', exact: true } )
				.click();
			await editorPublishPanel
				.getByRole( 'link', { name: 'View post' } )
				.click();

			await expect( page.locator( 'p' ) ).toContainText( [
				'I would word it this way',
				'This one can’t',
				'This one is different',
				'This one can’t',
			] );
		} );
	} );

	test( 'retains override values when converting a pattern block to regular blocks', async ( {
		page,
		admin,
		requestUtils,
		editor,
	} ) => {
		const paragraphId = 'paragraph-id';
		const { id } = await requestUtils.createBlock( {
			title: 'Pattern',
			content: `<!-- wp:paragraph {"metadata":{"id":"${ paragraphId }","bindings":{"content":{"source":"core/pattern-overrides"}}}} -->
<p>Editable</p>
<!-- /wp:paragraph -->`,
			status: 'publish',
		} );

		await admin.createNewPost();

		await editor.insertBlock( {
			name: 'core/block',
			attributes: { ref: id },
		} );

		// Make an edit to the pattern.
		await editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.focus();
		await page.keyboard.type( 'edited ' );

		// Convert back to regular blocks.
		await editor.selectBlocks(
			editor.canvas.getByRole( 'document', { name: 'Block: Pattern' } )
		);
		await editor.showBlockToolbar();
		await editor.clickBlockOptionsMenuItem( 'Detach' );

		// Check that the overrides remain.
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: {
					content: 'edited Editable',
					metadata: undefined,
				},
			},
		] );
	} );
} );
