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
		await requestUtils.deleteAllPosts();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin(
			'gutenberg-test-post-template-choices'
		);
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	for ( const status of [ 'draft', 'publish' ] ) {
		test( `preserves an excluded assignment on a ${ status } post and offers one alternative`, async ( {
			admin,
			editor,
			page,
			requestUtils,
		} ) => {
			const post = await requestUtils.createPost( {
				title: 'Filtered post',
				slug: 'filtered-choices',
				status,
				template: 'filtered-current',
			} );
			await admin.editPost( post.id );
			await editor.openDocumentSettingsSidebar();
			const control = page.getByRole( 'button', {
				name: 'Template options',
			} );
			await expect( control ).toHaveText( 'Filtered current' );
			await control.click();
			await expect(
				page.getByRole( 'menuitem', { name: 'Use default template' } )
			).toHaveCount( 0 );
			await page
				.getByRole( 'menuitem', { name: 'Change template' } )
				.click();
			await page
				.getByRole( 'option', { name: 'Filtered alternative' } )
				.click();
			await expect( control ).toHaveText( 'Filtered alternative' );
			if ( status === 'draft' ) {
				await editor.publishPost();
			} else {
				await page
					.getByRole( 'region', { name: 'Editor top bar' } )
					.getByRole( 'button', { name: 'Save', exact: true } )
					.click();
				await page
					.getByRole( 'button', { name: 'Dismiss this notice' } )
					.filter( { hasText: 'updated' } )
					.waitFor();
			}
			await page.reload();
			await expect( control ).toHaveText( 'Filtered alternative' );
			const saved = await requestUtils.rest( {
				path: `/wp/v2/posts/${ post.id }`,
			} );
			expect( saved.template ).toBe( 'filtered-alternative' );
			await page.goto( `?p=${ post.id }` );
			await expect(
				page.getByText( 'Rendering filtered alternative', {
					exact: true,
				} )
			).toBeVisible();
		} );
	}

	test( 'keeps the hierarchy default when every choice is removed', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'Filtered default',
			slug: 'filtered-empty',
			status: 'draft',
		} );
		await admin.editPost( post.id );
		await editor.openDocumentSettingsSidebar();
		const control = page.getByRole( 'button', {
			name: 'Template options',
		} );
		await expect( control ).toHaveText( 'Single Entries' );
		await control.click();
		await expect(
			page.getByRole( 'menuitem', { name: 'Change template' } )
		).toBeDisabled();
	} );

	test( 'preserves a plugin-initialized template through saving and publishing', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		await admin.createNewPost();
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Initially assigned template.' },
		} );
		await editor.openDocumentSettingsSidebar();
		await page.getByRole( 'tab', { name: 'Post', exact: true } ).click();
		const control = page.getByRole( 'button', {
			name: 'Template options',
		} );
		await expect( control ).toHaveText( 'Filtered current' );
		await editor.saveDraft();
		await page.reload();
		await expect( control ).toHaveText( 'Filtered current' );
		const postId = await editor.publishPost();
		const saved = await requestUtils.rest( {
			path: `/wp/v2/posts/${ postId }`,
		} );
		expect( saved.template ).toBe( 'filtered-current' );
		await page.goto( `?p=${ postId }` );
		await expect(
			page.getByText( 'Rendering filtered current', { exact: true } )
		).toBeVisible();
	} );
} );
