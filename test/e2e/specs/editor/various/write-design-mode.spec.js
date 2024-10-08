/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Write/Design mode', () => {
	test.beforeEach( async ( { admin, editor } ) => {
		await admin.createNewPost();
		await expect(
			editor.canvas.getByRole( 'textbox', { name: 'Add title' } )
		).toBeFocused();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPosts();
	} );

	test( 'Should prevent selecting intermediary blocks', async ( {
		editor,
		page,
	} ) => {
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
} );
