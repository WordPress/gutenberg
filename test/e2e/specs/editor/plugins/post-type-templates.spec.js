/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Post type templates', () => {
	test.describe( 'Using a CPT with a predefined template', () => {
		test.beforeAll( async ( { requestUtils } ) => {
			await requestUtils.activatePlugin(
				'gutenberg-test-plugin-templates'
			);
		} );

		test.beforeEach( async ( { admin } ) => {
			await admin.createNewPost( { postType: 'book' } );
		} );

		test.afterAll( async ( { requestUtils } ) => {
			await requestUtils.deactivatePlugin(
				'gutenberg-test-plugin-templates'
			);
		} );

		test( 'Should add a custom post types with a predefined template', async ( {
			editor,
		} ) => {
			expect( await editor.getEditedPostContent() ).toMatchSnapshot();
		} );

		test( 'Should respect user edits to not re-apply template after save (single block removal)', async ( {
			page,
			editor,
		} ) => {
			const beforeContent = await editor.getEditedPostContent();

			// Remove a block from the template to verify that it's not
			// re-added after saving and reloading the editor.
			await editor.canvas
				.locator( 'role=textbox[name="Add title"i]' )
				.focus();
			await page.keyboard.press( 'ArrowDown' );
			await page.keyboard.press( 'Backspace' );
			await editor.saveDraft();
			await page.reload();

			const expectedContent = await page.evaluate( ( content ) => {
				const blocks = window.wp.blocks.parse( content );
				blocks.splice( 0, 1 );
				return window.wp.blocks.serialize( blocks );
			}, beforeContent );

			await expect
				.poll( editor.getEditedPostContent )
				.toBe( expectedContent );
		} );

		test( 'Should respect user edits to not re-apply template after save (full delete)', async ( {
			page,
			pageUtils,
			editor,
		} ) => {
			// Remove all blocks from the template to verify that they're not
			// re-added after saving and reloading the editor.
			await editor.canvas
				.locator( 'role=textbox[name="Add title"i]' )
				.fill( 'My Empty Book' );
			await page.keyboard.press( 'ArrowDown' );
			await pageUtils.pressKeys( 'primary+A' );
			await page.keyboard.press( 'Backspace' );
			await editor.saveDraft();
			await page.reload();

			await expect.poll( editor.getEditedPostContent ).toBe( '' );
		} );
	} );

	test.describe( 'With default post format assigned', () => {
		const STANDARD_FORMAT_VALUE = '0';

		test.beforeAll( async ( { requestUtils } ) => {
			await requestUtils.activatePlugin(
				'gutenberg-test-plugin-post-formats-support'
			);
			await requestUtils.updateSiteSettings( {
				default_post_format: 'image',
			} );
		} );

		test.afterAll( async ( { requestUtils } ) => {
			await requestUtils.updateSiteSettings( {
				default_post_format: STANDARD_FORMAT_VALUE,
			} );
			await requestUtils.deactivatePlugin(
				'gutenberg-test-plugin-post-formats-support'
			);
		} );

		test( 'should populate new post with default block for format', async ( {
			admin,
			editor,
		} ) => {
			await admin.createNewPost();

			await expect.poll( editor.getEditedPostContent )
				.toBe( `<!-- wp:image -->
<figure class="wp-block-image"><img alt=""/></figure>
<!-- /wp:image -->` );
		} );

		test( 'should not populate edited post with default block for format', async ( {
			admin,
			page,
			editor,
		} ) => {
			await admin.createNewPost();

			// Remove the default block template to verify that it's not
			// re-added after saving and reloading the editor.
			await editor.canvas
				.locator( 'role=textbox[name="Add title"i]' )
				.fill( 'My Image Format' );
			await editor.canvas
				.locator( 'role=document[name="Block: Image"i]' )
				.focus();
			await page.keyboard.press( 'Backspace' );
			await editor.saveDraft();
			await page.reload();

			await expect.poll( editor.getEditedPostContent ).toBe( '' );
		} );

		test( 'should not populate new page with default block for format', async ( {
			admin,
			editor,
		} ) => {
			await admin.createNewPost( { postType: 'page' } );

			await expect.poll( editor.getEditedPostContent ).toBe( '' );
		} );
	} );
} );
