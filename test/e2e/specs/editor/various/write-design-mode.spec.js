/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe.skip( 'Write/Design mode', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );
	test.beforeEach( async ( { admin, page } ) => {
		await page.addInitScript( () => {
			window.__experimentalEditorWriteMode = true;
		} );
		await admin.visitSiteEditor( {
			postId: 'emptytheme//index',
			postType: 'wp_template',
			canvas: 'edit',
		} );
	} );
	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );
	test( 'Should prevent selecting intermediary blocks', async ( {
		editor,
		page,
	} ) => {
		// Clear all content
		await editor.setContent( '' );

		// Insert a section with a nested block and an editable block.
		await editor.insertBlock( {
			name: 'core/group',
			attributes: {
				style: {
					spacing: {
						padding: '20px',
					},
					color: {
						background: 'darkgray',
					},
				},
			},
			innerBlocks: [
				{
					name: 'core/group',
					attributes: {
						style: {
							spacing: {
								padding: '20px',
							},
							color: {
								background: 'lightgray',
							},
						},
					},
					innerBlocks: [
						{
							name: 'core/paragraph',
							attributes: {
								content: 'Something',
							},
						},
					],
				},
			],
		} );

		// Switch to write mode.
		await editor.switchEditorTool( 'Write' );

		const sectionBlock = editor.canvas
			.getByRole( 'document', {
				name: 'Block: Group',
			} )
			.nth( 0 );
		const sectionClientId = await sectionBlock.getAttribute( 'data-block' );
		const nestedGroupBlock = sectionBlock.getByRole( 'document', {
			name: 'Block: Group',
		} );
		const paragraph = nestedGroupBlock.getByRole( 'document', {
			name: 'Block: Paragraph',
		} );
		const paragraphClientId = await paragraph.getAttribute( 'data-block' );

		// We should not be able to select the intermediary group block.
		// if we try to click on it (the padding area)
		// The selection should land on the top level block.
		const nestedGroupPosition = await nestedGroupBlock.boundingBox();
		await page.mouse.click(
			nestedGroupPosition.x + 5,
			nestedGroupPosition.y + 5
		);

		const getSelectedBlock = async () =>
			await page.evaluate( () =>
				window.wp.data
					.select( 'core/block-editor' )
					.getSelectedBlockClientId()
			);

		expect( await getSelectedBlock() ).toEqual( sectionClientId );

		// We should be able to select the paragraph block and write in it.
		await paragraph.click();
		await page.keyboard.type( ' something' );
		expect( await getSelectedBlock() ).toEqual( paragraphClientId );
		await expect( paragraph ).toHaveText( 'Something something' );

		// Check that the inspector still shows the group block with the content panel.
		await editor.openDocumentSettingsSidebar();
		const editorSettings = page.getByRole( 'region', {
			name: 'Editor settings',
		} );
		await expect(
			// Ideally we should not be using CSS selectors
			// but in this case there's no easy role/label
			// to retrieve the "selected block title"
			editorSettings.locator( '.block-editor-block-card__title' )
		).toHaveText( 'Group' );
		await expect(
			editorSettings.getByRole( 'button', { name: 'Content' } )
		).toBeVisible();
	} );

	test( 'hides the blocks that cannot be interacted with in List View', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.setContent( '' );

		// Insert a section with a nested block and an editable block.
		await editor.insertBlock( {
			name: 'core/group',
			attributes: {},
			innerBlocks: [
				{
					name: 'core/group',
					attributes: {
						metadata: {
							name: 'Non-content block',
						},
					},
					innerBlocks: [
						{
							name: 'core/paragraph',
							attributes: {
								content: 'Something',
							},
						},
					],
				},
			],
		} );

		// Select the inner paragraph block so that List View is expanded.
		await editor.canvas
			.getByRole( 'document', {
				name: 'Block: Paragraph',
			} )
			.click();

		// Open List View.
		await pageUtils.pressKeys( 'access+o' );
		const listView = page.getByRole( 'treegrid', {
			name: 'Block navigation structure',
		} );
		const nonContentBlock = listView.getByRole( 'link', {
			name: 'Non-content block',
		} );

		await expect( nonContentBlock ).toBeVisible();

		// Switch to write mode.
		await editor.switchEditorTool( 'Write' );

		await expect( nonContentBlock ).toBeHidden();
	} );
	test( 'prevents adding non-content blocks to content role containers', async ( {
		editor,
		page,
	} ) => {
		await editor.setContent( '' );

		// Insert a section with a nested block and an editable block.
		await editor.insertBlock( {
			name: 'core/group',
			attributes: {},
			innerBlocks: [
				{
					name: 'core/quote',
					attributes: {
						metadata: {
							name: 'Content block',
						},
					},
					innerBlocks: [
						{
							name: 'core/paragraph',
							attributes: {
								content: 'Something',
							},
						},
					],
				},
			],
		} );

		// Switch to write mode.
		await editor.switchEditorTool( 'Write' );

		// Select the inner paragraph block.
		const paragraph = editor.canvas.getByRole( 'document', {
			name: 'Block: Paragraph',
		} );

		// Select paragraph
		await paragraph.click();

		// Try inserting a Group block with the slash inserter.
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '/group' );

		// Group option should not be available.
		await expect(
			page.getByRole( 'option', { name: 'Group' } )
		).toBeHidden();
	} );
	test( 'allows adding blocks to content role containers', async ( {
		editor,
		page,
	} ) => {
		await editor.setContent( '' );

		// Insert a section with a nested block and an editable block.
		await editor.insertBlock( {
			name: 'core/group',
			attributes: {},
			innerBlocks: [
				{
					name: 'core/list',
					innerBlocks: [
						{
							name: 'core/list-item',
							attributes: {
								content: 'item 1',
							},
						},
					],
				},
			],
		} );

		// Switch to write mode.
		await editor.switchEditorTool( 'Write' );

		// Select the inner list item block.
		const listItem = editor.canvas.getByText( 'item 1' );

		// Select list item
		await listItem.click();

		// Press enter to check whether it adds a new block.
		await page.keyboard.press( 'Enter' );

		// Write something in the new list item
		await page.keyboard.type( 'item 2' );

		await expect( listItem ).not.toBeFocused();
		await expect( listItem ).not.toHaveText( 'item 2' );
	} );
} );
