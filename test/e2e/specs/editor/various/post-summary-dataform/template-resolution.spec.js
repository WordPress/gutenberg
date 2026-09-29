const {
	test,
	expect,
	Editor,
} = require( '@wordpress/e2e-test-utils-playwright' );
const { EXPERIMENTS, EDITOR_CONTEXTS, openPostSummary } = require( './utils' );

/*
 * Mirrors the '`page_for_posts` setting' tests of
 * `test/e2e/specs/editor/various/template-resolution.spec.js` with the
 * DataForm inspector experiment enabled; delete those tests when the
 * experiment graduates.
 */
async function updateSiteSettings( { pageId, requestUtils } ) {
	return requestUtils.updateSiteSettings( {
		show_on_front: 'page',
		page_on_front: 0,
		page_for_posts: pageId,
	} );
}

test.describe( 'Template resolution (DataForm inspector)', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.beforeEach( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( EXPERIMENTS );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.setGutenbergExperiments( [] ),
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

	test.describe( 'without template capabilities', () => {
		let postId;

		test.beforeAll( async ( { requestUtils } ) => {
			const editorUser = await requestUtils.createUser( {
				username: 'editoruser',
				email: 'editoruser@example.com',
				password: 'editoruserpassword',
				roles: [ 'editor' ],
			} );
			const post = await requestUtils.createPost( {
				title: 'Custom template post',
				status: 'draft',
				author: editorUser.id,
				template: 'custom-template',
			} );
			postId = post.id;
		} );

		test.afterAll( async ( { requestUtils } ) => {
			await requestUtils.deleteAllPosts();
			await requestUtils.deleteAllUsers();
		} );

		test( 'shows the assigned template to an editor', async ( {
			browser,
			requestUtils,
		} ) => {
			const context = await browser.newContext( {
				baseURL: requestUtils.baseURL,
				storageState: { cookies: [], origins: [] },
			} );
			const page = await context.newPage();
			await page.goto( '/wp-login.php' );
			await page
				.getByLabel( 'Username or Email Address' )
				.fill( 'editoruser' );
			await page
				.getByLabel( 'Password', { exact: true } )
				.fill( 'editoruserpassword' );
			await page.getByRole( 'button', { name: 'Log In' } ).click();
			await page.waitForURL( '**/wp-admin/**' );

			await page.goto(
				`/wp-admin/post.php?post=${ postId }&action=edit`
			);
			await page.waitForFunction( () => !! window.wp?.data );
			await page.evaluate( () => {
				window.wp.data
					.dispatch( 'core/preferences' )
					.set( 'core/edit-post', 'welcomeGuide', false );
			} );

			const summary = await openPostSummary( {
				editor: new Editor( { page } ),
				page,
			} );
			await expect(
				summary.getByRole( 'button', { name: 'Edit Template' } )
			).toHaveAccessibleDescription( 'Custom' );

			// The template actions panel offers no template editing or creation.
			const sidebar = page.getByRole( 'region', {
				name: 'Editor settings',
			} );
			const panelToggle = sidebar.getByRole( 'button', {
				name: 'Template: Custom',
			} );
			await panelToggle.click();
			await expect( panelToggle ).toHaveAttribute(
				'aria-expanded',
				'true'
			);
			await expect(
				sidebar.getByRole( 'button', { name: 'Edit', exact: true } )
			).toBeHidden();
			await expect(
				sidebar.getByRole( 'button', { name: 'Create new' } )
			).toBeHidden();

			await context.close();
		} );
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
			const summary = await openPostSummary( { editor, page } );
			await expect(
				summary.getByRole( 'button', { name: 'Edit Template' } )
			).toHaveAccessibleDescription( 'Single Entries' );
			await updateSiteSettings( { requestUtils, pageId: newPage.id } );
			await page.reload();
			await openPostSummary( { editor, page } );
			await expect(
				summary.getByRole( 'button', { name: 'Edit Template' } )
			).toHaveAccessibleDescription( 'Index' );
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
			const summary = await openPostSummary( { editor, page } );
			await expect(
				summary.getByRole( 'button', { name: 'Edit Template' } )
			).toHaveAccessibleDescription( 'Index' );
		} );
	} );
} );

test.describe( 'Filtered template choices (DataForm inspector)', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
		await requestUtils.activatePlugin(
			'gutenberg-test-post-template-choices'
		);
	} );

	test.beforeEach( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( EXPERIMENTS );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( [] );
		await requestUtils.deleteAllPages();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin(
			'gutenberg-test-post-template-choices'
		);
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	for ( const context of EDITOR_CONTEXTS ) {
		test( `preserves the active template and saves an alternative in the ${ context.name }`, async ( {
			admin,
			editor,
			page,
			requestUtils,
		} ) => {
			const post = await requestUtils.createPage( {
				title: 'Filtered page',
				slug: 'filtered-choices',
				status: 'publish',
				template: 'filtered-current',
			} );
			await context.open(
				{ admin },
				{ postId: post.id, postType: 'page' }
			);
			const summary = await openPostSummary( { editor, page } );
			await expect(
				summary.getByText( 'Filtered current', { exact: true } )
			).toBeVisible();
			await summary
				.getByRole( 'button', { name: 'Edit Template' } )
				.click();
			const select = page.getByRole( 'combobox', { name: 'Template' } );
			await expect( select ).toHaveValue( 'filtered-current' );
			await expect(
				select.getByRole( 'option', { name: 'Filtered current' } )
			).toBeDisabled();
			await select.selectOption( { label: 'Filtered alternative' } );
			await page.keyboard.press( 'Escape' );
			await context.save( { page, editor } );
			await context.open(
				{ admin },
				{ postId: post.id, postType: 'page' }
			);
			const reopened = await openPostSummary( { editor, page } );
			await expect(
				reopened.getByText( 'Filtered alternative', { exact: true } )
			).toBeVisible();
			const saved = await requestUtils.rest( {
				path: `/wp/v2/pages/${ post.id }`,
			} );
			expect( saved.template ).toBe( 'filtered-alternative' );
			await page.goto( `?page_id=${ post.id }` );
			await expect(
				page.getByText( 'Rendering filtered alternative', {
					exact: true,
				} )
			).toBeVisible();
		} );
	}
} );
