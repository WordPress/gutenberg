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

	for ( const [ title, failure, notice ] of [
		[ 'PHP fatal error', 'fatal-error', AUTOSAVE_FAILED ],
		[
			'database connection lost',
			'database-connection-lost',
			AUTOSAVE_FAILED,
		],
		[
			'error message containing a link',
			'link-in-message',
			AUTOSAVE_FAILED,
		],
		[
			'connection dropped before a response',
			'dropped-connection',
			AUTOSAVE_FAILED,
		],
		[ 'error without a message', 'no-message', AUTOSAVE_FAILED ],
		[
			'error with a plain text message',
			'plain-message',
			withDetails( 'Something went wrong on the server.' ),
		],
		[
			'permission denied',
			'permission',
			withDetails( 'Sorry, you are not allowed to edit this post.' ),
		],
		[
			'database write failed',
			'database-write',
			withDetails( 'Could not update post in the database.' ),
		],
		[
			'HTML error page',
			'bad-gateway',
			withDetails( 'The response is not a valid JSON response.' ),
		],
		[
			'PHP fatal error printed before the JSON',
			'fatal-error-displayed',
			withDetails( 'The response is not a valid JSON response.' ),
		],
		[ 'response body of 0', 'zero', null ],
	] ) {
		test( title, async ( { autosaveFailure } ) => {
			await autosaveFailure.fail( failure );
			await autosaveFailure.autosave();
			expect( await autosaveFailure.getNotices() ).toEqual(
				notice === null ? [] : [ notice ]
			);
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

	test.describe( 'after a failure', () => {
		for ( const newEdits of [ false, true ] ) {
			test( `autosave is retried at every interval ${
				newEdits ? 'with' : 'without'
			} new edits`, async ( { autosaveFailure, page } ) => {
				let failures = 0;
				page.on( 'requestfailed', ( request ) => {
					if ( isAutosaveRequest( request ) ) {
						failures++;
					}
				} );
				await autosaveFailure.fail( 'dropped-connection' );
				await page.evaluate( () =>
					window.wp.data
						.dispatch( 'core/editor' )
						.updateEditorSettings( { autosaveInterval: 1 } )
				);
				await autosaveFailure.edit();

				for ( let attempt = 1; attempt <= 3; attempt++ ) {
					await expect
						.poll( () => failures )
						.toBeGreaterThanOrEqual( attempt );
					if ( newEdits ) {
						await autosaveFailure.edit();
					}
				}
				expect( await autosaveFailure.getNotices() ).toEqual( [
					AUTOSAVE_FAILED,
				] );
			} );
		}

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
