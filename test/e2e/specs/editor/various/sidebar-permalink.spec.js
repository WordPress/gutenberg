const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

// This tests are not together with the remaining sidebar tests,
// because we need to publish/save a post, to correctly test the permalink row.
// The sidebar test suit enforces that focus is never lost, but during save operations
// the focus is lost and a new element is focused once the save is completed.
test.describe( 'Sidebar Permalink', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin( 'gutenberg-test-custom-post-types' );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPosts();
		await requestUtils.deactivatePlugin(
			'gutenberg-test-custom-post-types'
		);
	} );

	test( 'should not render URL when post is publicly queryable but not public', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.createNewPost( { postType: 'public_q_not_public' } );
		await editor.openDocumentSettingsSidebar();
		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.fill( 'aaaaa' );
		await editor.publishPost();
		// Start editing again.
		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.fill( 'aaaa (Updated)' );
		await expect(
			page.getByRole( 'button', { name: 'Change link' } )
		).toBeHidden();
	} );

	test( 'should not render URL when post is public but not publicly queryable', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.createNewPost( { postType: 'not_public_q_public' } );
		await editor.openDocumentSettingsSidebar();
		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.fill( 'aaaaa' );
		await editor.publishPost();
		// Start editing again.
		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.fill( 'aaaa (Updated)' );
		await expect(
			page.getByRole( 'button', { name: 'Change link' } )
		).toBeHidden();
	} );

	test( 'should render URL when post is public and publicly queryable', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.createNewPost( { postType: 'public_q_public' } );
		await editor.openDocumentSettingsSidebar();
		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.fill( 'aaaaa' );
		await editor.publishPost();

		// Start editing again.
		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.fill( 'aaaa (Updated)' );
		await expect(
			page.getByRole( 'button', { name: 'Change link' } )
		).toBeVisible();
	} );

	test( 'should not save the placeholder slug of a new post when the slug field loses focus', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		await admin.createNewPost();
		await editor.openDocumentSettingsSidebar();
		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.fill( 'Hello Slug' );

		await page.getByRole( 'button', { name: /^Change link/ } ).click();
		await page.getByRole( 'textbox', { name: 'Slug' } ).click();
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Escape' );

		const postId = await editor.publishPost();
		const post = await requestUtils.rest( {
			path: `/wp/v2/posts/${ postId }`,
		} );
		expect( post.slug ).toBe( 'hello-slug' );
	} );

	test( 'should not clean a slug the user did not change when the slug field loses focus', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		// The server keeps the emoji in the slug, but `cleanForSlug()` strips it.
		const { id: postId, slug } = await requestUtils.createPost( {
			title: 'Hello ❤️',
			status: 'publish',
		} );
		expect( slug ).toBe( 'hello-%e2%9d%a4%ef%b8%8f' );

		await admin.editPost( postId );
		await editor.openDocumentSettingsSidebar();
		await page.getByRole( 'button', { name: /^Change link/ } ).click();
		await page.getByRole( 'textbox', { name: 'Slug' } ).click();
		await page.keyboard.press( 'Tab' );

		const editedSlug = await page.evaluate( () =>
			window.wp.data
				.select( 'core/editor' )
				.getEditedPostAttribute( 'slug' )
		);
		expect( editedSlug ).toBe( slug );
	} );

	test( 'should clean a slug the user changed when the slug field loses focus', async ( {
		admin,
		page,
		editor,
	} ) => {
		await admin.createNewPost();
		await editor.openDocumentSettingsSidebar();
		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.fill( 'Hello Slug' );

		await page.getByRole( 'button', { name: /^Change link/ } ).click();
		await page.getByRole( 'textbox', { name: 'Slug' } ).fill( 'Foo Bar' );
		await page.keyboard.press( 'Tab' );

		await expect(
			page.getByRole( 'textbox', { name: 'Slug' } )
		).toHaveValue( 'foo-bar' );
	} );

	test( 'should derive the slug from the title after an autosave', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.createNewPost();
		await editor.openDocumentSettingsSidebar();
		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.fill( 'Hello Slug' );

		// An autosave of a new post saves the title to the post itself.
		await page.evaluate( () =>
			window.wp.data.dispatch( 'core/editor' ).autosave()
		);

		await expect(
			page.getByRole( 'button', { name: 'Change link: hello-slug' } )
		).toBeVisible();
	} );

	test( 'should not show a slug for a post without a title', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.createNewPost();
		await editor.openDocumentSettingsSidebar();

		await page.getByRole( 'button', { name: 'Change link: None' } ).click();

		// Without a slug, the post only has its plain permalink.
		await expect(
			page.getByRole( 'textbox', { name: 'Slug' } )
		).toHaveValue( '' );
		await expect(
			page.getByRole( 'link', { name: /\?p=\d+/ } )
		).toBeVisible();
	} );
} );
