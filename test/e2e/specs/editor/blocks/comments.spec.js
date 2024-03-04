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
} );

test.describe( 'Comments', () => {
	let previousOptions;

	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.beforeEach( async ( { commentsBlockUtils } ) => {
		// Ideally, we'd set options in beforeAll or afterAll. Unfortunately, these
		// aren't exposed via the REST API, so we have to set them through the
		// relevant wp-admin screen, which involves page utils; but those are
		// prohibited from beforeAll/afterAll.
		previousOptions = await commentsBlockUtils.setOptions( {
			page_comments: '1',
			comments_per_page: '1',
			default_comments_page: 'newest',
		} );
	} );

	test.afterEach( async ( { requestUtils, commentsBlockUtils } ) => {
		await commentsBlockUtils.setOptions( previousOptions );
		await requestUtils.deleteAllComments();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'We show no results message if there are no comments', async ( {
		admin,
		editor,
		requestUtils,
	} ) => {
		await requestUtils.deleteAllComments();
		await admin.createNewPost();
		await editor.insertBlock( { name: 'core/comments' } );
		await expect(
			editor.canvas.locator(
				'role=document[name="Block: Comment Template"i]'
			)
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

	test( 'A button allows the block to switch from legacy mode to editable mode', async ( {
		admin,
		editor,
	} ) => {
		await admin.createNewPost();
		await editor.insertBlock( {
			name: 'core/comments',
			attributes: { legacy: true, textColor: 'vivid-purple' },
		} );

		const block = editor.canvas.locator(
			'role=document[name="Block: Comments"i]'
		);
		const warning = block.locator( '.block-editor-warning' );
		const placeholder = block.locator(
			'.wp-block-comments__legacy-placeholder'
		);

		await expect( block ).toHaveClass( /has-vivid-purple-color/ );
		await expect( warning ).toBeVisible();
		await expect( placeholder ).toBeVisible();

		await editor.canvas
			.locator( 'role=button[name="Switch to editable mode"i]' )
			.click();

		const commentTemplate = editor.canvas.locator(
			'role=document[name="Block: Comment Template"i]'
		);
		await expect( block ).toHaveClass( /has-vivid-purple-color/ );
		await expect( commentTemplate ).toBeVisible();
		await expect( warning ).toBeHidden();
		await expect( placeholder ).toBeHidden();
	} );

	test( 'The editable block version is rendered if the legacy attribute is false', async ( {
		page,
		admin,
		editor,
		requestUtils,
	} ) => {
		await admin.createNewPost();
		await editor.insertBlock( { name: 'core/comments' } );
		const postId = await editor.publishPost();

		// Create a comments for that post.
		await requestUtils.createComment( {
			content: 'This is an automated comment',
			post: postId,
		} );

		// Visit the post that was just published.
		await page.click(
			'role=region[name="Editor publish"] >> role=link[name="View Post"i]'
		);

		// Check that the Comment Template block (an inner block) is rendered.
		await expect(
			page.locator( '.wp-block-comment-template' )
		).toBeVisible();
		await expect( page.locator( '.commentlist' ) ).toBeHidden();
	} );

	test( 'The PHP version is rendered if the legacy attribute is true', async ( {
		page,
		admin,
		editor,
		requestUtils,
	} ) => {
		await admin.createNewPost();
		await editor.insertBlock( {
			name: 'core/comments',
			attributes: { legacy: true },
		} );
		const postId = await editor.publishPost();

		// Create a comments for that post.
		await requestUtils.createComment( {
			content: 'This is an automated comment',
			post: postId,
		} );

		// Visit the post that was just published.
		await page.click(
			'role=region[name="Editor publish"] >> role=link[name="View Post"i]'
		);

		// Check that the Comment Template block (an inner block) is NOT rendered.
		await expect(
			page.locator( '.wp-block-comment-template' )
		).toBeHidden();
		await expect( page.locator( '.commentlist' ) ).toBeVisible();
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
		editor,
		requestUtils,
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

		// Check that the Post Comments block has been replaced with Comments.
		await expect(
			editor.canvas.locator( '.wp-block-post-comments' )
		).toBeHidden();
		await expect(
			editor.canvas.locator( '.wp-block-comments' )
		).toBeVisible();

		// Check the block definition has changed.
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/comments',
				attributes: {
					legacy: true,
				},
			},
		] );

		// Visit post
		await page.goto( `/?p=${ postId }` );

		// Rendered block should be the same as Post Comments.
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
	}

	/**
	 * Sets a group of site options, from the options-general admin page.
	 *
	 * This is a temporary solution until we can handle options through the REST
	 * API.
	 *
	 * @param {Record<string, string>} options Options in key-value format.
	 * @return {Record<string, string>} Previous options.
	 */
	async setOptions( options ) {
		const previousValues = {};
		for ( const [ key, value ] of Object.entries( options ) ) {
			previousValues[ key ] = await this.setOption( key, value );
		}
		return previousValues;
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
