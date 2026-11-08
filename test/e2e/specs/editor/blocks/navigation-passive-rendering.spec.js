/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

async function getDirtyEntityRecords( page ) {
	return page.evaluate( () =>
		window.wp.data
			.select( 'core' )
			.__experimentalGetDirtyEntityRecords()
			.map( ( { kind, name, key } ) => ( { kind, name, key } ) )
	);
}

async function enableShowTemplate( page, editor ) {
	await page.evaluate( () => {
		window.wp.data.dispatch( 'core/block-editor' ).clearSelectedBlock();
	} );
	await editor.openDocumentSettingsSidebar();

	await page
		.getByRole( 'region', { name: 'Editor settings' } )
		.getByRole( 'button', { name: 'Template options' } )
		.click();

	const showTemplateButton = page.getByRole( 'menuitemcheckbox', {
		name: 'Show template',
	} );
	const isChecked = await showTemplateButton.getAttribute( 'aria-checked' );
	if ( isChecked !== 'true' ) {
		await showTemplateButton.click();
	} else {
		await page.keyboard.press( 'Escape' );
	}
}

test.describe( 'Navigation passive rendering', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.beforeEach( async ( { requestUtils } ) => {
		await requestUtils.resetPreferences();
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.deleteAllPosts(),
			requestUtils.deleteAllPages(),
			requestUtils.deleteAllMenus(),
			requestUtils.deleteAllTemplates( 'wp_template' ),
			requestUtils.deleteAllTemplates( 'wp_template_part' ),
			requestUtils.resetPreferences(),
		] );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'does not dirty related template parts or navigation menus when rendered in the post editor', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const parentPage = await requestUtils.createPage( {
			title: 'Products',
			status: 'publish',
		} );
		await requestUtils.createPage( {
			title: 'Laptops',
			status: 'publish',
			parent: parentPage.id,
		} );

		const menu = await requestUtils.createNavigationMenu( {
			title: 'Related menu',
			content: '<!-- wp:page-list {"isNested":true} /-->',
		} );

		await requestUtils.createTemplate( 'wp_template_part', {
			slug: 'header',
			title: 'Header',
			content: `<!-- wp:navigation {"ref":${ menu.id },"overlayMenu":"off","submenuVisibility":"always"} /-->`,
		} );

		await requestUtils.createTemplate( 'wp_template', {
			slug: 'singular',
			title: 'Singular',
			content: [
				'<!-- wp:template-part {"slug":"header","tagName":"header","theme":"emptytheme"} /-->',
				'<!-- wp:post-content {"layout":{"inherit":true}} /-->',
			].join( '\n' ),
		} );

		const post = await requestUtils.createPost( {
			title: 'Passive render test',
			content:
				'<!-- wp:paragraph --><p>Original content.</p><!-- /wp:paragraph -->',
			status: 'draft',
		} );

		await admin.editPost( post.id );
		await enableShowTemplate( page, editor );

		await expect(
			editor.canvas.getByRole( 'document', {
				name: 'Block: Navigation',
			} )
		).toBeVisible();
		await expect(
			editor.canvas.getByRole( 'document', {
				name: 'Block: Page List',
			} )
		).toBeVisible();

		await editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.click();
		await page.keyboard.press( 'End' );
		await page.keyboard.type( ' Edited.' );

		await expect
			.poll( () => getDirtyEntityRecords( page ) )
			.toEqual( [ { kind: 'postType', name: 'post', key: post.id } ] );
	} );
} );
