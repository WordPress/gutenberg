import { test, expect } from '@wordpress/e2e-test-utils-playwright';

/*
 * Lives under `specs/site-editor/` so it also runs against the extensible
 * site editor (`test:e2e:site-editor-v2`). The fuller source suites live in
 * `specs/editor/various/block-bindings/`.
 */
test.describe( 'Block bindings in the site editor', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
		await requestUtils.activatePlugin( 'gutenberg-test-block-bindings' );
		await requestUtils.createTemplate( 'wp_template', {
			slug: 'single-movie',
			title: 'Single Movie',
			content:
				'<!-- wp:post-title /--><!-- wp:post-content {"layout":{"inherit":true}} /-->',
		} );
	} );

	test.beforeEach( async ( { admin, editor } ) => {
		await admin.visitSiteEditor( {
			postId: 'emptytheme//single-movie',
			postType: 'wp_template',
			canvas: 'edit',
		} );
		await editor.openDocumentSettingsSidebar();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllTemplates( 'wp_template' );
		await requestUtils.activateTheme( 'twentytwentyone' );
		await requestUtils.deactivatePlugin( 'gutenberg-test-block-bindings' );
	} );

	test( 'should show the value of a block bound to post meta', async ( {
		editor,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: {
				content: 'fallback content',
				metadata: {
					bindings: {
						content: {
							source: 'core/post-meta',
							args: { key: 'movie_field' },
						},
					},
				},
			},
		} );

		await expect(
			editor.canvas.getByRole( 'document', { name: 'Block: Paragraph' } )
		).toHaveText( 'Movie field default value' );
	} );

	test( 'should be possible to connect a post meta field through the attributes panel', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( { name: 'core/paragraph' } );
		await page.getByLabel( 'Attributes options' ).click();
		await page
			.getByRole( 'menuitemcheckbox', { name: 'content, show' } )
			.click();
		await page
			.getByRole( 'button', {
				name: 'content Not connected',
				exact: true,
			} )
			.click();
		await page.getByRole( 'menuitem', { name: 'Post Meta' } ).click();
		await page
			.getByRole( 'menuitemcheckbox' )
			.filter( { hasText: 'Movie field label' } )
			.click();

		await expect(
			editor.canvas.getByRole( 'document', { name: 'Block: Paragraph' } )
		).toHaveText( 'Movie field default value' );
	} );
} );
