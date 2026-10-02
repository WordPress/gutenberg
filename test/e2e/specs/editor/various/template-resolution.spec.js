const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

async function updateSiteSettings( { pageId, requestUtils } ) {
	return requestUtils.updateSiteSettings( {
		show_on_front: 'page',
		page_on_front: 0,
		page_for_posts: pageId,
	} );
}

test.describe( 'Template resolution', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.deleteAllPages(),
			requestUtils.updateSiteSettings( {
				show_on_front: 'posts',
				page_on_front: 0,
				page_for_posts: 0,
			} ),
		] );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'Site editor proper front page template resolution when we have only set posts page in settings', async ( {
		page,
		admin,
		requestUtils,
	} ) => {
		const newPage = await requestUtils.createPage( {
			title: 'Posts Page',
			status: 'publish',
		} );
		await updateSiteSettings( { requestUtils, pageId: newPage.id } );
		await admin.visitSiteEditor();
		await expect( page.locator( '.edit-site-canvas-loader' ) ).toHaveCount(
			0
		);
	} );

	test.describe( '`page_for_posts` setting', () => {
		test( 'Post editor proper template resolution', async ( {
			page,
			admin,
			editor,
			requestUtils,
		} ) => {
			const newPage = await requestUtils.createPage( {
				title: 'Posts Page',
				status: 'publish',
			} );
			await admin.editPost( newPage.id );
			await editor.openDocumentSettingsSidebar();
			await expect(
				page.getByRole( 'button', { name: 'Template options' } )
			).toHaveText( 'Single Entries' );
			await updateSiteSettings( { requestUtils, pageId: newPage.id } );
			await page.reload();
			await expect(
				page.getByRole( 'button', { name: 'Template options' } )
			).toHaveText( 'Index' );
		} );

		test( 'Site editor proper template resolution', async ( {
			page,
			editor,
			admin,
			requestUtils,
		} ) => {
			const newPage = await requestUtils.createPage( {
				title: 'Posts Page',
				status: 'publish',
			} );
			await updateSiteSettings( { requestUtils, pageId: newPage.id } );
			await admin.visitSiteEditor( {
				postId: newPage.id,
				postType: 'page',
				canvas: 'edit',
			} );
			await editor.openDocumentSettingsSidebar();
			await expect(
				page.getByRole( 'button', { name: 'Template options' } )
			).toHaveText( 'Index' );
		} );
	} );
} );

test.describe( 'Filtered template choices', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
		await requestUtils.activatePlugin(
			'gutenberg-test-post-template-choices'
		);
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPages();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin(
			'gutenberg-test-post-template-choices'
		);
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'shows only the extension template for the restricted page slug', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const post = await requestUtils.createPage( {
			title: 'Landing page',
			slug: 'landing-page',
			status: 'publish',
		} );
		await admin.editPost( post.id );
		await editor.openDocumentSettingsSidebar();
		const control = page.getByRole( 'button', {
			name: 'Template options',
		} );
		await expect( control ).toHaveText( 'Landing page' );
		await control.click();
		await expect(
			page.getByRole( 'menuitem', { name: 'Change template' } )
		).toBeDisabled();
		await expect(
			page.getByRole( 'menuitem', { name: 'Use default template' } )
		).toHaveCount( 0 );
	} );

	test( 'switches from the assigned template when the page slug becomes restricted', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const post = await requestUtils.createPage( {
			title: 'Regular page',
			slug: 'regular-page',
			status: 'publish',
			template: 'standard-page',
		} );
		await admin.editPost( post.id );
		await editor.openDocumentSettingsSidebar();
		const control = page.getByRole( 'button', {
			name: 'Template options',
		} );
		await expect( control ).toHaveText( 'Standard page' );

		await page.getByRole( 'button', { name: /^Change link/ } ).click();
		await page
			.getByRole( 'textbox', { name: 'Slug' } )
			.fill( 'landing-page' );
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Escape' );

		await expect( control ).toHaveText( 'Landing page' );
		await control.click();
		await expect(
			page.getByRole( 'menuitem', { name: 'Change template' } )
		).toBeDisabled();
		await expect(
			page.getByRole( 'menuitem', { name: 'Use default template' } )
		).toHaveCount( 0 );
	} );
} );
