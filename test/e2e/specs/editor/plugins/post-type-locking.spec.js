/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Post-type locking', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin(
			'gutenberg-test-plugin-cpt-locking'
		);
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin(
			'gutenberg-test-plugin-cpt-locking'
		);
	} );

	test.describe( 'template_lock all', () => {
		test.beforeEach( async ( { admin } ) => {
			await admin.createNewPost( { postType: 'locked-all-post' } );
		} );

		test( 'should not allow blocks to be removed', async ( {
			editor,
			page,
		} ) => {
			await editor.canvas
				.getByRole( 'document', {
					name: 'Empty block',
				} )
				.first()
				.fill( 'p1' );

			await editor.clickBlockToolbarButton( 'Options' );

			await expect(
				page
					.getByRole( 'menu', { name: 'Options' } )
					.getByRole( 'menuitem', { name: 'Delete' } )
			).toBeHidden();
		} );

		test( 'should not allow blocks to be moved', async ( {
			editor,
			page,
		} ) => {
			await editor.canvas
				.getByRole( 'document', {
					name: 'Empty block',
				} )
				.first()
				.click();

			await expect(
				page
					.getByRole( 'toolbar', { name: 'Block tools' } )
					.getByRole( 'button', { name: 'Move up' } )
			).toBeHidden();
		} );

		test( 'should not error when deleting the contents of a paragraph', async ( {
			editor,
			page,
			pageUtils,
		} ) => {
			const firstParagraph = editor.canvas
				.getByRole( 'document', {
					name: 'Empty block',
				} )
				.first();
			await firstParagraph.click();

			const textToType = 'Paragraph';
			await page.keyboard.type( textToType );
			await pageUtils.pressKeys( 'Backspace', textToType.length + 1 );

			await expect( firstParagraph ).toHaveText( '' );
		} );

		test( 'should insert line breaks when using enter and shift-enter', async ( {
			editor,
			page,
			pageUtils,
		} ) => {
			await editor.canvas
				.getByRole( 'document', {
					name: 'Empty block',
				} )
				.first()
				.click();

			await page.keyboard.type( 'First line' );
			await page.keyboard.press( 'Enter' );
			await page.keyboard.type( 'Second line' );
			await pageUtils.pressKeys( 'shift+Enter' );
			await page.keyboard.type( 'Third line' );

			await expect.poll( editor.getBlocks ).toMatchObject( [
				{
					name: 'core/image',
				},
				{
					name: 'core/paragraph',
					attributes: {
						content: 'First line<br>Second line<br>Third line',
					},
				},
				{
					name: 'core/quote',
				},
				{
					name: 'core/columns',
				},
			] );
		} );

		test( 'should show invalid template notice if the blocks do not match the templte', async ( {
			page,
			pageUtils,
		} ) => {
			// Open the code editor.
			await pageUtils.pressKeys( 'secondary+M' );

			// Modify template.
			await page.getByRole( 'textbox', { name: 'Type text or HTML' } )
				.fill( `<!-- wp:paragraph {"placeholder":"Add a description"} -->
<p></p>
<!-- /wp:paragraph -->` );

			// Go back to the visual editor.
			await pageUtils.pressKeys( 'secondary+M' );

			await expect(
				page.locator(
					'.editor-template-validation-notice .components-notice__content'
				)
			).toContainText(
				'The content of your post doesn’t match the template assigned to your post type.'
			);
		} );
	} );

	test.describe( 'template_lock insert', () => {
		test.beforeEach( async ( { admin } ) => {
			await admin.createNewPost( { postType: 'locked-insert-post' } );
		} );

		test( 'should not allow blocks to be removed', async ( {
			editor,
			page,
		} ) => {
			await editor.canvas
				.getByRole( 'document', {
					name: 'Empty block',
				} )
				.first()
				.fill( 'p1' );

			await editor.clickBlockToolbarButton( 'Options' );

			await expect(
				page
					.getByRole( 'menu', { name: 'Options' } )
					.getByRole( 'menuitem', { name: 'Delete' } )
			).toBeHidden();
		} );

		test( 'should allow blocks to be moved', async ( { editor, page } ) => {
			await editor.canvas
				.getByRole( 'document', {
					name: 'Empty block',
				} )
				.first()
				.click();

			await page
				.getByRole( 'toolbar', { name: 'Block tools' } )
				.getByRole( 'button', { name: 'Move up' } )
				.click();

			await expect.poll( editor.getBlocks ).toMatchObject( [
				{
					name: 'core/paragraph',
				},
				{
					name: 'core/image',
				},
				{
					name: 'core/quote',
				},
				{
					name: 'core/columns',
				},
			] );
		} );
	} );

	test.describe( 'template_lock false', () => {
		test.beforeEach( async ( { admin } ) => {
			await admin.createNewPost( { postType: 'not-locked-post' } );
		} );

		test( 'should allow blocks to be inserted', async ( {
			editor,
			page,
		} ) => {
			await expect(
				page
					.getByRole( 'toolbar', { name: 'Document tools' } )
					.getByRole( 'button', {
						name: 'Block Inserter',
						exact: true,
					} )
			).toBeEnabled();

			await editor.insertBlock( { name: 'core/list' } );
			await editor.canvas
				.getByRole( 'textbox', { name: 'List text' } )
				.fill( 'List content' );

			await expect(
				editor.canvas.getByRole( 'document', {
					name: 'Block: List item',
				} )
			).toHaveText( 'List content' );
		} );

		test( 'should allow blocks to be removed', async ( { editor } ) => {
			await editor.canvas
				.getByRole( 'document', {
					name: 'Empty block',
				} )
				.first()
				.fill( 'p1' );

			await editor.clickBlockOptionsMenuItem( 'Delete' );
			await expect.poll( editor.getBlocks ).toMatchObject( [
				{
					name: 'core/image',
				},
				{
					name: 'core/quote',
				},
				{
					name: 'core/columns',
				},
			] );
		} );

		test( 'should allow blocks to be moved', async ( { editor, page } ) => {
			await editor.canvas
				.getByRole( 'document', {
					name: 'Empty block',
				} )
				.first()
				.click();

			await page
				.getByRole( 'toolbar', { name: 'Block tools' } )
				.getByRole( 'button', { name: 'Move up' } )
				.click();

			await expect.poll( editor.getBlocks ).toMatchObject( [
				{
					name: 'core/paragraph',
				},
				{
					name: 'core/image',
				},
				{
					name: 'core/quote',
				},
				{
					name: 'core/columns',
				},
			] );
		} );
	} );

	test.describe( 'template_lock all unlocked group', () => {
		test.beforeEach( async ( { admin } ) => {
			await admin.createNewPost( { postType: 'l-post-ul-group' } );
		} );

		test( 'should allow blocks to be removed', async ( { editor } ) => {
			await editor.canvas
				.getByRole( 'document', {
					name: 'Empty block',
				} )
				.last()
				.fill( 'p1' );

			await editor.clickBlockOptionsMenuItem( 'Delete' );
			await expect.poll( editor.getBlocks ).toMatchObject( [
				{
					name: 'core/group',
					innerBlocks: [
						{
							name: 'core/quote',
						},
					],
				},
			] );
		} );

		test( 'should allow blocks to be moved', async ( { editor, page } ) => {
			await editor.canvas
				.getByRole( 'document', {
					name: 'Empty block',
				} )
				.last()
				.click();

			await page
				.getByRole( 'toolbar', { name: 'Block tools' } )
				.getByRole( 'button', { name: 'Move up' } )
				.click();

			await expect.poll( editor.getBlocks ).toMatchObject( [
				{
					name: 'core/group',
					innerBlocks: [
						{
							name: 'core/paragraph',
						},
						{
							name: 'core/quote',
						},
					],
				},
			] );
		} );

		test( 'should allow blocks to be switched to other types', async ( {
			editor,
			page,
		} ) => {
			await editor.canvas
				.getByRole( 'document', {
					name: 'Empty block',
				} )
				.first()
				.fill( 'p1' );

			const blockSwitcher = page
				.getByRole( 'toolbar', { name: 'Block tools' } )
				.getByRole( 'button', { name: 'Paragraph' } );

			// Verify the block switcher exists.
			await expect( blockSwitcher ).toHaveAttribute(
				'aria-haspopup',
				'true'
			);

			// Verify the correct block transforms appear.
			await blockSwitcher.click();
			await expect(
				page
					.getByRole( 'menu', { name: 'Paragraph' } )
					.getByRole( 'menuitem' )
			).toHaveText( [
				'Heading',
				'List',
				'Quote',
				'Buttons',
				'Code',
				'Columns',
				'Details',
				'Group',
				'Preformatted',
				'Pullquote',
				'Verse',
			] );
		} );
	} );

	test.describe( 'template_lock all locked group', () => {
		test.beforeEach( async ( { admin } ) => {
			await admin.createNewPost( { postType: 'l-post-l-group' } );
		} );

		test( 'should not allow blocks to be removed', async ( {
			editor,
			page,
		} ) => {
			await editor.canvas
				.getByRole( 'document', {
					name: 'Empty block',
				} )
				.last()
				.fill( 'p1' );

			await editor.clickBlockToolbarButton( 'Options' );

			await expect(
				page
					.getByRole( 'menu', { name: 'Options' } )
					.getByRole( 'menuitem', { name: 'Delete' } )
			).toBeHidden();
		} );

		test( 'should not allow blocks to be moved', async ( {
			editor,
			page,
		} ) => {
			await editor.canvas
				.getByRole( 'document', {
					name: 'Empty block',
				} )
				.last()
				.click();

			await expect(
				page
					.getByRole( 'toolbar', { name: 'Block tools' } )
					.getByRole( 'button', { name: 'Move up' } )
			).toBeHidden();
		} );
	} );

	test.describe( 'template_lock all inherited group', () => {
		test.beforeEach( async ( { admin } ) => {
			await admin.createNewPost( { postType: 'l-post-i-group' } );
		} );

		test( 'should not allow blocks to be removed', async ( {
			editor,
			page,
		} ) => {
			await editor.canvas
				.getByRole( 'document', {
					name: 'Empty block',
				} )
				.last()
				.fill( 'p1' );

			await editor.clickBlockToolbarButton( 'Options' );

			await expect(
				page
					.getByRole( 'menu', { name: 'Options' } )
					.getByRole( 'menuitem', { name: 'Delete' } )
			).toBeHidden();
		} );

		test( 'should not allow blocks to be moved', async ( {
			editor,
			page,
		} ) => {
			await editor.canvas
				.getByRole( 'document', {
					name: 'Empty block',
				} )
				.last()
				.click();

			await expect(
				page
					.getByRole( 'toolbar', { name: 'Block tools' } )
					.getByRole( 'button', { name: 'Move up' } )
			).toBeHidden();
		} );
	} );
} );
