/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Site editor url navigation', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test.describe( 'Redirection after template and template part creation', () => {
		test.afterEach( async ( { requestUtils } ) => {
			await Promise.all( [
				requestUtils.deleteAllPosts(),
				requestUtils.deleteAllTemplates( 'wp_template' ),
				requestUtils.deleteAllTemplates( 'wp_template_part' ),
			] );
		} );
		test( 'Redirection after template creation', async ( {
			admin,
			page,
			requestUtils,
		} ) => {
			await requestUtils.createPost( {
				title: 'Demo',
				status: 'publish',
			} );
			await admin.visitSiteEditor();
			// We need to wait the response from the `posts` request in order to click the augmented menu item,
			// that includes the options for creating templates for specific posts.
			await Promise.all( [
				page.waitForResponse(
					( resp ) =>
						resp
							.url()
							.includes(
								'/index.php?rest_route=%2Fwp%2Fv2%2Fposts&context=view'
							) && resp.status() === 200
				),
				page.click( 'role=button[name="Templates"]' ),
			] );
			await page.click( 'role=button[name="Add New Template"i]' );
			await page
				.getByRole( 'button', {
					name: 'Single item: Post',
				} )
				.click();
			await page
				.getByRole( 'button', { name: 'For a specific item' } )
				.click();
			await page.getByRole( 'option', { name: 'Demo' } ).click();
			await expect( page ).toHaveURL(
				'/wp-admin/site-editor.php?postId=emptytheme%2F%2Fsingle-post-demo&postType=wp_template&canvas=edit'
			);
		} );
		test( 'Redirection after template part creation', async ( {
			admin,
			page,
		} ) => {
			await admin.visitSiteEditor();
			await page.click( 'role=button[name="Patterns"i]' );
			await page.click( 'role=button[name="Create pattern"i]' );
			await page
				.getByRole( 'menu', { name: 'Create pattern' } )
				.getByRole( 'menuitem', { name: 'Create template part' } )
				.click();
			// Fill in a name in the dialog that pops up.
			await page.type(
				'role=dialog >> role=textbox[name="Name"i]',
				'Demo'
			);
			await page.keyboard.press( 'Enter' );
			await expect( page ).toHaveURL(
				'/wp-admin/site-editor.php?postId=emptytheme%2F%2Fdemo&postType=wp_template_part&canvas=edit'
			);
		} );
	} );
} );
