/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

/**
 * @typedef {import('@playwright/test').Page} Page
 * @typedef {import('@wordpress/e2e-test-utils-playwright').RequestUtils} RequestUtils
 */

test.use( {
	commentsBlockUtils: async ( { page, admin, requestUtils }, use ) => {
		await use( new CommentsBlockUtils( { page, admin, requestUtils } ) );
	},
	codeEditorUtils: async ( { page }, use ) => {
		await use( new CodeEditorUtils( { page } ) );
	},
} );

test.describe( 'Comments', () => {
	// Ideally, we'd set options in beforeAll or afterAll. Unfortunately, these
	// aren't exposed via the REST API, so we have to set them through the
	// relevant wp-admin screen, which involves page utils; but those are
	// prohibited from beforeAll/afterAll.

	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.beforeEach( async ( { commentsBlockUtils } ) => {
		await commentsBlockUtils.setOptions( {
			page_comments: '1',
			comments_per_page: '1',
			default_comments_page: 'newest',
		} );
	} );

	test.afterEach( async ( { requestUtils, commentsBlockUtils } ) => {
		await commentsBlockUtils.restorePreviousOptions();
		await requestUtils.deleteAllComments();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'We show no results message if there are no comments', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		await requestUtils.deleteAllComments();
		await admin.createNewPost();
		await editor.insertBlock( { name: 'core/comments' } );
		await expect(
			page.locator( 'role=document[name="Block: Comment Template"i]' )
		).toContainText( 'No results found.' );
	} );

	test( 'Pagination links are working as expected', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		await admin.createNewPost();
		await editor.insertBlock( { name: 'core/comments' } );
		const postId = await editor.publishPost();

		// Create three comments for that post.
		for ( let i = 0; i < 3; i++ ) {
			await requestUtils.createComment( {
				content: `This is an automated comment - ${ i }`,
				post: postId,
			} );
		}

		// Visit the post that was just published.
		await page.click(
			'role=region[name="Editor publish"] >> role=link[name="View Post"i]'
		);

		// We check that there is a previous comments page link.
		await expect(
			page.locator( 'role=link[name="Older Comments"i]' )
		).toBeVisible();
		await expect(
			page.locator( 'role=link[name="Newer Comments"i]' )
		).toBeHidden();

		await page.click( 'role=link[name="Older Comments"i]' );

		// We check that there are a previous and a next link.
		await expect(
			page.locator( 'role=link[name="Older Comments"i]' )
		).toBeVisible();
		await expect(
			page.locator( 'role=link[name="Newer Comments"i]' )
		).toBeVisible();

		await page.click( 'role=link[name="Older Comments"i]' );

		// We check that there is only have a next link
		await expect(
			page.locator( 'role=link[name="Older Comments"i]' )
		).toBeHidden();
		await expect(
			page.locator( 'role=link[name="Newer Comments"i]' )
		).toBeVisible();
	} );

	test( 'Pagination links are not appearing if break comments is not enabled', async ( {
		admin,
		editor,
		page,
		requestUtils,
		commentsBlockUtils,
	} ) => {
		await commentsBlockUtils.setOption( 'page_comments', '0' );
		await admin.createNewPost();
		await editor.insertBlock( { name: 'core/comments' } );
		const postId = await editor.publishPost();

		// Create three comments for that post.
		for ( let i = 0; i < 3; i++ ) {
			await requestUtils.createComment( {
				content: `This is an automated comment - ${ i }`,
				post: postId,
			} );
		}

		// Visit the post that was just published.
		await page.click(
			'role=region[name="Editor publish"] >> role=link[name="View Post"i]'
		);

		// We check that there are no comments page link.
		await expect(
			page.locator( 'role=link[name="Older Comments"i]' )
		).toBeHidden();
		await expect(
			page.locator( 'role=link[name="Newer Comments"i]' )
		).toBeHidden();
	} );
} );

/*
 * The following test suite ensures that the legacy Post Comments block is still
 * supported and it is converted into the Comments block on the editor.
 */
test.describe( 'Post Comments', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllComments();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'is still supported', async ( { page, requestUtils } ) => {
		// Create a post with the old "Post Comments" block.
		const { id: postId } = await requestUtils.createPost( {
			content: '<!-- wp:post-comments /-->',
			status: 'publish',
		} );

		// Publish a comment on that post.
		await requestUtils.createComment( {
			content: 'This is an automated comment',
			post: postId,
		} );

		// Visit created post.
		await page.goto( `/?p=${ postId }` );

		// Ensure that the rendered post is the legacy version of Post Comments.
		await expect( page.locator( '.wp-block-post-comments' ) ).toBeVisible();
		await expect( page.locator( '.comment-content' ) ).toContainText(
			'This is an automated comment'
		);
	} );

	test( 'is converted to Comments with legacy attribute', async ( {
		page,
		admin,
		requestUtils,
		codeEditorUtils,
		commentsBlockUtils,
	} ) => {
		// Create a post with the old "Post Comments" block.
		const { id: postId } = await requestUtils.createPost( {
			content: '<!-- wp:post-comments /-->',
			status: 'publish',
		} );
		await requestUtils.createComment( {
			content: 'This is an automated comment',
			post: postId,
		} );

		// Go to the post editor.
		await admin.visitAdminPage(
			'/post.php',
			`post=${ postId }&action=edit`
		);

		// Hide welcome guide.
		await commentsBlockUtils.hideWelcomeGuide();

		// Check that the Post Comments block has been replaced by Comments (legacy)
		await expect( page.locator( '.wp-block-post-comments' ) ).toBeHidden();
		await expect( page.locator( '.wp-block-comments' ) ).toBeVisible();

		// Open code editor and check its content.
		await codeEditorUtils.open();
		await expect( codeEditorUtils.textbox() ).toContainText(
			'<!-- wp:comments {"legacy":true} /-->'
		);
		await codeEditorUtils.close();

		// Visit post
		await page.goto( `/?p=${ postId }` );

		// Rendered block should be the same as Post Comments
		await expect( page.locator( '.wp-block-post-comments' ) ).toBeVisible();
		await expect( page.locator( '.comment-content' ) ).toContainText(
			'This is an automated comment'
		);
	} );
} );

class CommentsBlockUtils {
	constructor( { page, admin, requestUtils } ) {
		this.page = page;
		this.admin = admin;
		this.requestUtils = requestUtils;
		this.previousOptions = {};
	}

	async setOptions( options ) {
		for ( const [ key, value ] of Object.entries( options ) ) {
			const previousValue = await this.setOption( key, value );
			if ( ! this.previousOptions[ key ] ) {
				this.previousOptions[ key ] = previousValue;
			}
		}
	}

	async restorePreviousOptions() {
		for ( const [ key, value ] of Object.entries( this.previousOptions ) ) {
			await this.setOption( key, value );
		}
	}

	/**
	 * Sets a site option, from the options-general admin page.
	 *
	 * This is a temporary solution until we can handle options through the REST
	 * API.
	 *
	 * @param {string} setting The option, used to get the option by id.
	 * @param {string} value   The value to set the option to.
	 *
	 * @return {Promise<string>} A Promise that resolves to the option's
	 * previous value.
	 */
	async setOption( setting, value ) {
		await this.admin.visitAdminPage( 'options.php', '' );
		const previousValue = await this.page.inputValue( `#${ setting }` );

		await this.page.fill( `#${ setting }`, value );
		await this.page.click( '#Update' );

		return previousValue;
	}

	async hideWelcomeGuide() {
		await this.page.evaluate( async () => {
			const isWelcomeGuideActive = window.wp.data
				.select( 'core/edit-post' )
				.isFeatureActive( 'welcomeGuide' );

			if ( isWelcomeGuideActive ) {
				window.wp.data
					.dispatch( 'core/edit-post' )
					.toggleFeature( 'welcomeGuide' );
			}
		} );

		await this.page.reload();
		await this.page.waitForSelector( '.edit-post-layout' );
	}
}

class CodeEditorUtils {
	constructor( { page } ) {
		this.page = page;
	}

	async open() {
		await this.page
			.locator(
				'role=region[name="Editor top bar"i] >> role=button[name="Options"i]'
			)
			.click();
		await this.page
			.locator( 'role=menuitemradio[name*="Code editor"i]' )
			.click();
	}

	textbox() {
		return this.page.locator( 'role=textbox[name="Type text or HTML"i]' );
	}

	async close() {
		await this.page
			.locator( 'role=button[name="Exit code editor"i]' )
			.click();
	}
}
