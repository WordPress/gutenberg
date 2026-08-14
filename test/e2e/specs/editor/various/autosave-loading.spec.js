const {
	test,
	expect,
	Editor,
	RequestUtils,
} = require( '@wordpress/e2e-test-utils-playwright' );

/**
 * Second editor, used to prove the request stays scoped to one author.
 */
const SECOND_USER = {
	username: 'autosaveeditor',
	email: 'autosaveeditor@example.com',
	firstName: 'Autosave',
	lastName: 'Editor',
	password: 'password',
	roles: [ 'editor' ],
};

const POST_CONTENT = `<!-- wp:paragraph -->
<p>Autosave loading</p>
<!-- /wp:paragraph -->`;

const BASE_URL = process.env.WP_BASE_URL || 'http://localhost:8889';

/**
 * Reads the REST route out of a request URL.
 *
 * REST requests reach the server either as `/wp-json/<route>` or as
 * `index.php?rest_route=<route>`, depending on the permalink structure.
 *
 * @param {string} url Request URL.
 * @return {string} The REST route.
 */
function getRestRoute( url ) {
	const parsed = new URL( url );

	return parsed.searchParams.get( 'rest_route' ) ?? parsed.pathname;
}

/**
 * Records every GET to a post's autosaves collection made by a page.
 *
 * @param {import('@playwright/test').Page} page Page to observe.
 * @return {URL[]} Live array, appended to as requests are made.
 */
function trackAutosaveRequests( page ) {
	const requests = [];

	page.on( 'request', ( request ) => {
		if (
			request.method() === 'GET' &&
			/\/autosaves\/?$/.test( getRestRoute( request.url() ) )
		) {
			requests.push( new URL( request.url() ) );
		}
	} );

	return requests;
}

/**
 * Waits for the editor to finish resolving autosaves for a post.
 *
 * @param {import('@playwright/test').Page} page   Page to poll.
 * @param {number}                          postId Post being edited.
 */
async function waitForAutosaveResolution( page, postId ) {
	await page.waitForFunction( () => window?.wp?.data );
	await expect
		.poll( () =>
			page.evaluate( ( id ) => {
				const { select } = window.wp.data;
				const authorId = select( 'core' ).getCurrentUser()?.id;

				return select( 'core' ).hasFetchedAutosave(
					'post',
					id,
					authorId
				);
			}, postId )
		)
		.toBe( true );
}

/**
 * Discards the resolved autosave and asks for it again, so the next request
 * goes to the network.
 *
 * The preload cache serves each entry once, so a re-resolution is the only way
 * to observe the request the editor makes on a page that was preloaded.
 *
 * @param {import('@playwright/test').Page} page   Page to refetch in.
 * @param {number}                          postId Post being edited.
 */
async function refetchAutosave( page, postId ) {
	await page.evaluate( ( id ) => {
		const { dispatch, resolveSelect, select } = window.wp.data;
		const authorId = select( 'core' ).getCurrentUser()?.id;

		dispatch( 'core' ).invalidateResolution( 'getAutosave', [
			'post',
			id,
			authorId,
		] );

		return resolveSelect( 'core' ).getAutosave( 'post', id, authorId );
	}, postId );
}

/**
 * Logs a user in through the login form in a fresh browser context.
 *
 * @param {import('@playwright/test').Browser} browser Browser to open in.
 * @param {Object}                             user    Credentials.
 * @return {Promise<{page: import('@playwright/test').Page, editor: Editor, context: import('@playwright/test').BrowserContext}>} The session.
 */
async function loginAs( browser, user ) {
	// Persist the preferences that suppress the welcome guide before the
	// editor ever mounts. Dispatching them after load races the guide, which
	// then swallows clicks on the canvas.
	const userRequestUtils = await RequestUtils.setup( {
		user: { username: user.username, password: user.password },
		baseURL: BASE_URL,
	} );
	await userRequestUtils.setupRest();
	await userRequestUtils.setPreferences( 'core/edit-post', {
		welcomeGuide: false,
		welcomeGuideTemplate: false,
		fullscreenMode: false,
	} );

	const context = await browser.newContext( {
		baseURL: BASE_URL,
		storageState: { cookies: [], origins: [] },
	} );
	const page = await context.newPage();

	await page.goto( '/wp-login.php' );
	await page.locator( '#user_login' ).fill( user.username );
	await page.locator( '#user_pass' ).fill( user.password );
	await page.getByRole( 'button', { name: 'Log In' } ).click();
	await page.waitForURL( '**/wp-admin/**' );

	return { page, editor: new Editor( { page } ), context };
}

/**
 * Navigates an already-authenticated page to the post editor.
 *
 * @param {import('@playwright/test').Page} page   Page to navigate.
 * @param {number}                          postId Post to edit.
 */
async function gotoPostEditor( page, postId ) {
	await page.goto( `/wp-admin/post.php?post=${ postId }&action=edit` );
	await page.waitForFunction( () => window?.wp?.data && window?.wp?.blocks );
	await expect(
		page.locator( '.components-modal__screen-overlay' )
	).toBeHidden();
}

/**
 * Types into the post's first paragraph and triggers a server autosave.
 *
 * @param {import('@playwright/test').Page} page   Page to edit in.
 * @param {Editor}                          editor Editor utils for that page.
 * @param {string}                          text   Text to append.
 */
async function editAndAutosave( page, editor, text ) {
	await editor.canvas
		.getByRole( 'document', { name: 'Block: Paragraph' } )
		.click();
	await page.keyboard.press( 'End' );
	await page.keyboard.type( text );
	await page.evaluate( () =>
		window.wp.data.dispatch( 'core/editor' ).autosave()
	);
}

test.describe( 'Autosave loading', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllUsers();
		await requestUtils.createUser( SECOND_USER );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPosts();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllUsers();
		await requestUtils.deleteAllPosts();
	} );

	test( 'serves the author-scoped autosave from the preload cache', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'Autosave loading',
			content: POST_CONTENT,
			status: 'draft',
		} );

		const requests = trackAutosaveRequests( page );

		await admin.editPost( post.id );
		await waitForAutosaveResolution( page, post.id );

		// No request at all. The preloaded path and the one the editor asks
		// for have to agree exactly, or the preload goes unused and the
		// editor fetches over the network what it was already handed.
		expect( requests ).toHaveLength( 0 );

		const currentUserId = await page.evaluate(
			() => window.wp.data.select( 'core' ).getCurrentUser()?.id
		);

		// Ask again with the preload spent, to see the request itself. One,
		// not two: the editor's preload kickoff and `isEditedPostAutosaveable`
		// have to ask for the same record under the same resolution key, or
		// each fetches its own.
		await refetchAutosave( page, post.id );

		expect( requests ).toHaveLength( 1 );
		expect( requests[ 0 ].searchParams.get( 'context' ) ).toBe( 'edit' );
		expect( requests[ 0 ].searchParams.get( 'author' ) ).toBe(
			String( currentUserId )
		);
	} );

	test( 'enables autosaving once the request resolves', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'Autosave loading',
			content: POST_CONTENT,
			status: 'draft',
		} );

		await admin.editPost( post.id );
		await waitForAutosaveResolution( page, post.id );

		await editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.click();
		await page.keyboard.press( 'End' );
		await page.keyboard.type( ' edited' );

		// `isEditedPostAutosaveable` returns false for as long as
		// `hasFetchedAutosave` is false, which is how a resolution recorded
		// under a key nothing reads disables autosaving with no visible error.
		await expect
			.poll( () =>
				page.evaluate( () =>
					window.wp.data
						.select( 'core/editor' )
						.isEditedPostAutosaveable()
				)
			)
			.toBe( true );

		const autosaved = page.waitForResponse(
			( response ) =>
				response.request().method() === 'POST' &&
				/\/autosaves\/?$/.test( getRestRoute( response.url() ) )
		);
		await page.evaluate( () =>
			window.wp.data.dispatch( 'core/editor' ).autosave()
		);
		expect( ( await autosaved ).ok() ).toBe( true );
	} );

	test( "returns the current user's autosave, not a newer one by another author", async ( {
		browser,
		requestUtils,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'Autosave loading',
			content: POST_CONTENT,
			status: 'draft',
		} );

		const {
			page: secondUserPage,
			editor: secondUserEditor,
			context,
		} = await loginAs( browser, SECOND_USER );

		try {
			// The second user autosaves first, so the administrator's autosave
			// ends up being the most recent one on the post.
			await gotoPostEditor( secondUserPage, post.id );
			await waitForAutosaveResolution( secondUserPage, post.id );

			const secondUserId = await secondUserPage.evaluate(
				() => window.wp.data.select( 'core' ).getCurrentUser()?.id
			);

			await editAndAutosave(
				secondUserPage,
				secondUserEditor,
				' by the second user'
			);
			await expect
				.poll( () =>
					secondUserPage.evaluate(
						( [ id, authorId ] ) =>
							!! window.wp.data
								.select( 'core' )
								.getAutosave( 'post', id, authorId ),
						[ post.id, secondUserId ]
					)
				)
				.toBe( true );

			// The administrator autosaves over REST rather than in a second
			// editor: two editors open on one post trip the post lock, and all
			// this needs is a newer autosave belonging to somebody else.
			await requestUtils.rest( {
				method: 'POST',
				path: `/wp/v2/posts/${ post.id }/autosaves`,
				data: {
					content: `${ POST_CONTENT }\n<!-- wp:paragraph -->\n<p>By the administrator</p>\n<!-- /wp:paragraph -->`,
				},
			} );

			// Reload the second user's editor. Asking for a single record
			// without scoping it to an author would return the
			// administrator's, which the selector then filters out — leaving
			// the second user with no autosave at all.
			const requests = trackAutosaveRequests( secondUserPage );
			await gotoPostEditor( secondUserPage, post.id );
			await waitForAutosaveResolution( secondUserPage, post.id );

			// Unlike the administrator case above, this one is not served from
			// the preload cache. For this user the kickoff's second phase lands
			// after the cache is cleared, so none of the paths it carries are
			// consumed — autosaves, the post author, the template lookup and
			// global styles alike. That is pre-existing and not specific to
			// autosaves; it reproduces on trunk with the other four.
			expect( requests ).toHaveLength( 1 );
			expect( requests[ 0 ].searchParams.get( 'author' ) ).toBe(
				String( secondUserId )
			);

			const autosave = await secondUserPage.evaluate(
				( [ id, authorId ] ) =>
					window.wp.data
						.select( 'core' )
						.getAutosave( 'post', id, authorId ),
				[ post.id, secondUserId ]
			);

			expect( autosave ).toBeTruthy();
			expect( autosave.author ).toBe( secondUserId );
			expect( autosave.content.raw ).toContain( 'by the second user' );
		} finally {
			await context.close();
		}
	} );
} );
