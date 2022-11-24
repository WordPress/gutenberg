/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Block Locking', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.describe( 'General', () => {
		test( 'can prevent removal', async ( { editor, page } ) => {
			await editor.insertBlock( { name: 'core/paragraph' } );
			await page.keyboard.type( 'Some paragraph' );

			await editor.clickBlockOptionsMenuItem( 'Lock' );

			await page.click( 'role=checkbox[name="Prevent removal"]' );
			await page.click( 'role=button[name="Apply"]' );

			await expect(
				page.locator( 'role=menuitem[name="Remove Paragraph"]' )
			).not.toBeVisible();
		} );

		test( 'can disable movement', async ( { editor, page } ) => {
			await editor.insertBlock( { name: 'core/paragraph' } );
			await page.keyboard.type( 'First paragraph' );

			await editor.insertBlock( { name: 'core/paragraph' } );
			await page.keyboard.type( 'Second paragraph' );

			await editor.clickBlockOptionsMenuItem( 'Lock' );

			await page.click( 'role=checkbox[name="Disable movement"]' );
			await page.click( 'role=button[name="Apply"]' );

			// Hide options.
			await editor.clickBlockToolbarButton( 'Options' );

			// Drag handle is hidden.
			await expect(
				page.locator( 'role=button[name="Drag"]' )
			).not.toBeVisible();

			// Movers are hidden. No need to check for both.
			await expect(
				page.locator( 'role=button[name="Move up"]' )
			).not.toBeVisible();
		} );

		test( 'can lock everything', async ( { editor, page } ) => {
			await editor.insertBlock( { name: 'core/paragraph' } );
			await page.keyboard.type( 'Some paragraph' );

			await editor.clickBlockOptionsMenuItem( 'Lock' );

			await page.click( 'role=checkbox[name="Lock all"]' );
			await page.click( 'role=button[name="Apply"]' );

			expect( await editor.getEditedPostContent() )
				.toBe( `<!-- wp:paragraph {"lock":{"move":true,"remove":true}} -->
<p>Some paragraph</p>
<!-- /wp:paragraph -->` );
		} );

		test( 'can unlock from toolbar', async ( { editor, page } ) => {
			await editor.insertBlock( { name: 'core/paragraph' } );
			await page.keyboard.type( 'Some paragraph' );

			await editor.clickBlockOptionsMenuItem( 'Lock' );

			await page.click( 'role=checkbox[name="Lock all"]' );
			await page.click( 'role=button[name="Apply"]' );

			await editor.clickBlockToolbarButton( 'Unlock Paragraph' );
			await page.click( 'role=checkbox[name="Lock all"]' );
			await page.click( 'role=button[name="Apply"]' );

			expect( await editor.getEditedPostContent() )
				.toBe( `<!-- wp:paragraph {"lock":{"move":false,"remove":false}} -->
<p>Some paragraph</p>
<!-- /wp:paragraph -->` );
		} );

		test( 'Applying block templates does not create a persistent change in the editor', async ( { editor, page, pageUtils } ) => {
			// Create a new block template for the test.
			// Should this live in a different file?
			await page.evaluate( () => {
				const el = window.wp.element.createElement;
				const useState = window.wp.element.useState;
				const InnerBlocks = window.wp.blockEditor.InnerBlocks;
				const TEMPLATE_TWO_PARAGRAPHS = [
					[
						'core/paragraph',
						{
							fontSize: 'large',
							content: 'One',
						},
					],
					[
						'core/paragraph',
						{
							fontSize: 'large',
							content: 'Two',
						},
					],
				];

				window.wp.blocks.registerBlockType( 'test/test-inner-blocks-async-template', {
					title: 'Test Inner Blocks no locking',
					icon: 'cart',
					category: 'text',

					edit() {

						const [ template, setTemplate ] = useState([]);

						setInterval( () => {
							setTemplate( TEMPLATE_TWO_PARAGRAPHS );
						}, 1000 );

						return el( InnerBlocks, {
							template: template,
						} );
					},

					save() {
						return el( InnerBlocks.Content );
					},
				} );

			} );
			await editor.insertBlock( { name: 'test/test-inner-blocks-async-template' } );

			await expect( await editor.getEditedPostContent() )
				.toBe( `<!-- wp:test/test-inner-blocks-async-template /-->` );

			const undoButton = await page.locator( '.editor-history__undo' );

			// Check is that the undo button is enabled.
			// Unfortunately the button does not have a disabled attribute.
			await expect( undoButton ).toHaveAttribute( 'aria-disabled', 'false' );

			// Undo the change.
			await pageUtils.pressKeyWithModifier( 'primary', 'z' );

			await expect( await editor.getEditedPostContent() )
				.toBe( `` );

			// There should be no more undo history.
			// Unfortunately the button does not have a disabled attribute.
			await expect( undoButton ).toHaveAttribute( 'aria-disabled', 'true' );
		} );
	} );
} );
