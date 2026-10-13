const {
	test: base,
	expect,
} = require( '@wordpress/e2e-test-utils-playwright' );

const AUTOSAVE_FAILED =
	'Auto-save failed. We’ll try to save a backup in this browser. You can also save manually.';

const withDetails = ( details ) =>
	`${ AUTOSAVE_FAILED } <details class="editor-save-error-details"><summary>Show details</summary><span class="editor-save-error-details__message">${ details }</span></details>`;

const isAutosaveRequest = ( request ) =>
	request.method() === 'POST' &&
	decodeURIComponent( request.url() ).includes( '/autosaves' );

const test = base.extend( {
	autosaveFailure: async ( { page, context, editor }, use ) => {
		await use( {
			async fail( failure ) {
				await context.addCookies( [
					{
						name: 'gutenberg_test_autosave_failure',
						value: failure,
						url: new URL( page.url() ).origin,
					},
				] );
			},
			async stopFailing() {
				await context.clearCookies( {
					name: 'gutenberg_test_autosave_failure',
				} );
			},
			async edit() {
				await editor.canvas
					.getByRole( 'textbox', { name: 'Add title' } )
					.fill( `Autosave failure ${ Date.now() }` );
			},
			async autosave() {
				await this.edit();
				await page.evaluate( () =>
					window.wp.data.dispatch( 'core/editor' ).autosave()
				);
			},
			getNotices() {
				return page.evaluate( () =>
					window.wp.data
						.select( 'core/notices' )
						.getNotices()
						.map( ( { content } ) => content )
				);
			},
		} );
	},
} );

test.describe( 'Autosave failure notice', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin( 'gutenberg-test-autosave-failures' );
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin(
			'gutenberg-test-autosave-failures'
		);
	} );

	for ( const [ title, failure, details ] of [
		[ 'PHP fatal error', 'fatal-error', null ],
		[ 'database connection lost', 'database-connection', null ],
		[ 'error message containing a link', 'link-in-message', null ],
		[ 'connection dropped before a response', 'dropped-connection', null ],
		[ 'error without a message', 'no-message', null ],
		[
			'error with a plain text message',
			'plain-message',
			'Something went wrong on the server.',
		],
		[
			'permission denied',
			'permission',
			'Sorry, you are not allowed to edit this post.',
		],
		[
			'database write failed',
			'database-write',
			'Could not update post in the database.',
		],
		[
			'HTML error page',
			'bad-gateway',
			'The response is not a valid JSON response.',
		],
		[
			'PHP fatal error printed before the JSON',
			'fatal-error-displayed',
			'The response is not a valid JSON response.',
		],
	] ) {
		test( title, async ( { autosaveFailure } ) => {
			await autosaveFailure.fail( failure );
			await autosaveFailure.autosave();
			expect( await autosaveFailure.getNotices() ).toEqual( [
				details === null ? AUTOSAVE_FAILED : withDetails( details ),
			] );
		} );
	}

	test( 'offline', async ( { autosaveFailure, context } ) => {
		await context.setOffline( true );
		await autosaveFailure.autosave();
		await context.setOffline( false );
		expect( await autosaveFailure.getNotices() ).toEqual( [
			'Auto-save failed because you were offline. We’ll try to save a backup in this browser. Please verify your connection and save manually.',
		] );
	} );

	test( 'plugin hook throwing an error', async ( {
		autosaveFailure,
		page,
	} ) => {
		await page.evaluate( () =>
			window.wp.hooks.addAction(
				'editor.savePost',
				'test/autosave-failure',
				() => {
					throw new Error( 'A plugin could not save.' );
				}
			)
		);
		await autosaveFailure.autosave();
		expect( await autosaveFailure.getNotices() ).toEqual( [
			withDetails( 'A plugin could not save.' ),
		] );
	} );

	test.describe( 'no notice', () => {
		test( 'response body of 0', async ( { autosaveFailure } ) => {
			await autosaveFailure.fail( 'zero' );
			await autosaveFailure.autosave();
			expect( await autosaveFailure.getNotices() ).toEqual( [] );
		} );

		test( 'expired nonce is refreshed and the autosave retried', async ( {
			autosaveFailure,
			page,
		} ) => {
			const statuses = [];
			page.on( 'response', ( response ) => {
				if ( isAutosaveRequest( response.request() ) ) {
					statuses.push( response.status() );
				}
			} );
			await page.evaluate( () => {
				window.wp.apiFetch.nonceMiddleware.nonce = 'expired';
			} );
			await autosaveFailure.autosave();

			expect( statuses ).toEqual( [ 403, 200 ] );
			expect( await autosaveFailure.getNotices() ).toEqual( [] );
		} );
	} );

	test.describe( 'after a failure', () => {
		test( 'autosave is retried at every interval without new edits', async ( {
			autosaveFailure,
			page,
		} ) => {
			let failures = 0;
			page.on( 'requestfailed', ( request ) => {
				if ( isAutosaveRequest( request ) ) {
					failures++;
				}
			} );
			await autosaveFailure.fail( 'dropped-connection' );
			await page.clock.install();
			await page.evaluate( () =>
				window.wp.data
					.dispatch( 'core/editor' )
					.updateEditorSettings( { autosaveInterval: 61 } )
			);
			await autosaveFailure.edit();

			for ( let attempt = 1; attempt <= 3; attempt++ ) {
				await page.clock.runFor( 61_000 );
				await expect.poll( () => failures ).toBe( attempt );
				expect( await autosaveFailure.getNotices() ).toEqual( [
					AUTOSAVE_FAILED,
				] );
			}
		} );

		test( 'notice stays after a later autosave succeeds', async ( {
			autosaveFailure,
			page,
		} ) => {
			await autosaveFailure.fail( 'dropped-connection' );
			await autosaveFailure.autosave();
			expect( await autosaveFailure.getNotices() ).toEqual( [
				AUTOSAVE_FAILED,
			] );

			await autosaveFailure.stopFailing();
			await autosaveFailure.autosave();
			expect(
				await page.evaluate( () =>
					window.wp.data
						.select( 'core/editor' )
						.didPostSaveRequestFail()
				)
			).toBe( false );
			expect( await autosaveFailure.getNotices() ).toEqual( [
				AUTOSAVE_FAILED,
			] );
		} );
	} );
} );
