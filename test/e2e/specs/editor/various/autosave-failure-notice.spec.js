const {
	test: base,
	expect,
} = require( '@wordpress/e2e-test-utils-playwright' );

const AUTOSAVE_FAILED =
	'Auto-save failed. We’ll try to save a backup in this browser. You can also save manually.';

const UPDATING_FAILED_OFFLINE =
	'Updating failed because you were offline. Please verify your connection and try again.';

const withDetails = ( details ) => ( { content: AUTOSAVE_FAILED, details } );

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
				const title = `Autosave failure ${ Date.now() }`;
				await editor.canvas
					.getByRole( 'textbox', { name: 'Add title' } )
					.fill( title );
				return title;
			},
			async autosave() {
				const title = await this.edit();
				await page.evaluate( () =>
					window.wp.data.dispatch( 'core/editor' ).autosave()
				);
				return title;
			},
			getNotices() {
				return page.evaluate( () =>
					window.wp.data
						.select( 'core/notices' )
						.getNotices()
						.map( ( { content, details } ) =>
							details ? { content, details } : content
						)
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
		[
			'PHP fatal error',
			'fatal-error',
			// The stack trace's paths and line numbers depend on the
			// WordPress version, so only its start is checked.
			withDetails(
				expect.stringMatching(
					/^There has been a critical error on this website\.\nLearn more about troubleshooting WordPress\. \(https:\/\/wordpress\.org\/documentation\/article\/faq-troubleshooting\/\)\n\nUncaught Error: Call to undefined function gutenberg_test_autosave_undefined_function\(\) in .+\nStack trace:\n#0 /
				)
			),
		],
		[
			'database connection lost',
			'database-connection-lost',
			withDetails( 'Error establishing a database connection' ),
		],
		[
			'error message containing a link',
			'link-in-message',
			withDetails( 'Blocked. Learn more (https://example.com).' ),
		],
		// TODO: Say the server could not be reached, and retry right away.
		[
			'connection dropped before a response',
			'dropped-connection',
			AUTOSAVE_FAILED,
		],
		// TODO: Show the status code.
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
		// TODO: Show the status code (502) instead.
		[
			'HTML error page',
			'bad-gateway',
			withDetails( 'The response is not a valid JSON response.' ),
		],
		// TODO: Show the status code (429) instead.
		[
			'too many requests',
			'too-many-requests',
			withDetails( 'The response is not a valid JSON response.' ),
		],
		// TODO: Show the PHP error the response includes in `data.error`.
		[
			'PHP fatal error printed before the JSON',
			'fatal-error-displayed',
			withDetails( 'The response is not a valid JSON response.' ),
		],
		// TODO: Say the session may have expired.
		[
			'redirected to the login page',
			'redirect-to-login',
			withDetails( 'The response is not a valid JSON response.' ),
		],
		// TODO: Say the server could not be reached.
		[
			'redirected to another site',
			'redirect-to-other-site',
			AUTOSAVE_FAILED,
		],
		[
			'maintenance mode',
			'maintenance',
			withDetails(
				'Briefly unavailable for scheduled maintenance. Check back in a minute.'
			),
		],
		// TODO: Report the failure; the autosave fails without a notice.
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

	for ( const [ title, throwsError, notice ] of [
		[
			'plugin hook throwing an error',
			true,
			withDetails( 'A plugin could not save.' ),
		],
		// TODO: Show the thrown string.
		[ 'plugin hook throwing a string', false, AUTOSAVE_FAILED ],
	] ) {
		test( title, async ( { autosaveFailure, page } ) => {
			await page.evaluate( ( error ) => {
				window.wp.hooks.addAction(
					'editor.savePost',
					'test/autosave-failure',
					() => {
						throw error
							? new Error( 'A plugin could not save.' )
							: 'A plugin could not save.';
					}
				);
			}, throwsError );
			await autosaveFailure.autosave();
			expect( await autosaveFailure.getNotices() ).toEqual( [ notice ] );
		} );
	}

	test( 'session expired', async ( { autosaveFailure, context } ) => {
		await context.clearCookies( { name: /^wordpress_/ } );
		await autosaveFailure.autosave();
		// TODO: Say the session expired and offer to log in again.
		expect( await autosaveFailure.getNotices() ).toEqual( [
			withDetails( 'Cookie check failed' ),
		] );
	} );

	test( 'PHP warning printed before a successful response', async ( {
		autosaveFailure,
		page,
		requestUtils,
	} ) => {
		await autosaveFailure.fail( 'warning-displayed' );
		const title = await autosaveFailure.autosave();
		// TODO: Don't report a failure; the autosave was stored.
		expect( await autosaveFailure.getNotices() ).toEqual( [
			withDetails( 'The response is not a valid JSON response.' ),
		] );

		const postId = await page.evaluate( () =>
			window.wp.data.select( 'core/editor' ).getCurrentPostId()
		);
		const post = await requestUtils.rest( {
			path: `/wp/v2/posts/${ postId }`,
			params: { context: 'edit' },
		} );
		expect( post.title.raw ).toBe( title );
	} );

	test( 'slow response holds back the next autosaves', async ( {
		autosaveFailure,
		page,
	} ) => {
		let requests = 0;
		page.on( 'request', ( request ) => {
			if ( isAutosaveRequest( request ) ) {
				requests++;
			}
		} );
		await autosaveFailure.fail( 'slow' );
		await page.evaluate( () =>
			window.wp.data
				.dispatch( 'core/editor' )
				.updateEditorSettings( { autosaveInterval: 1 } )
		);
		const autosaveResponse = page.waitForResponse( ( response ) =>
			isAutosaveRequest( response.request() )
		);
		await autosaveFailure.edit();
		await autosaveResponse;

		// TODO: Time out a request that never finishes.
		expect( requests ).toBe( 1 );
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

		test( 'notice is removed after a later autosave succeeds', async ( {
			autosaveFailure,
		} ) => {
			await autosaveFailure.fail( 'dropped-connection' );
			await autosaveFailure.autosave();
			expect( await autosaveFailure.getNotices() ).toEqual( [
				AUTOSAVE_FAILED,
			] );

			await autosaveFailure.stopFailing();
			await autosaveFailure.autosave();
			expect( await autosaveFailure.getNotices() ).toEqual( [] );
		} );

		test( 'notice is replaced by the outcome of a manual save', async ( {
			autosaveFailure,
			pageUtils,
		} ) => {
			await autosaveFailure.fail( 'dropped-connection' );
			await autosaveFailure.autosave();
			expect( await autosaveFailure.getNotices() ).toEqual( [
				AUTOSAVE_FAILED,
			] );

			await autosaveFailure.stopFailing();
			await pageUtils.pressKeys( 'primary+s' );
			await expect
				.poll( autosaveFailure.getNotices )
				.toEqual( [ 'Draft saved.' ] );
		} );

		test( 'notice is replaced by a failed manual save', async ( {
			autosaveFailure,
			context,
			page,
			pageUtils,
		} ) => {
			await autosaveFailure.fail( 'dropped-connection' );
			await autosaveFailure.autosave();
			expect( await autosaveFailure.getNotices() ).toEqual( [
				AUTOSAVE_FAILED,
			] );

			await context.setOffline( true );
			await pageUtils.pressKeys( 'primary+s' );
			await expect
				.poll( autosaveFailure.getNotices )
				.toEqual( [ UPDATING_FAILED_OFFLINE ] );
			await expect
				.poll( () =>
					page.evaluate( () =>
						window.wp.data.select( 'core/editor' ).isSavingPost()
					)
				)
				.toBe( false );
			await context.setOffline( false );
		} );

		for ( const [ status, afterAutosave, afterManualSave ] of [
			// TODO: Should a manual save stay possible, so it creates a revision?
			[ 'draft', [], [] ],
			[ 'publish', [ UPDATING_FAILED_OFFLINE ], [ 'Post updated.' ] ],
		] ) {
			test( `failed manual save notice is cleared once nothing is left to save (${ status })`, async ( {
				admin,
				autosaveFailure,
				context,
				page,
				pageUtils,
				requestUtils,
			} ) => {
				const { id } = await requestUtils.createPost( {
					title: 'Manual save',
					status,
				} );
				await admin.editPost( id );
				await autosaveFailure.edit();
				await context.setOffline( true );
				await pageUtils.pressKeys( 'primary+s' );
				await expect
					.poll( () =>
						page.evaluate( () =>
							window.wp.data
								.select( 'core/editor' )
								.isSavingPost()
						)
					)
					.toBe( false );
				await context.setOffline( false );
				expect( await autosaveFailure.getNotices() ).toEqual( [
					UPDATING_FAILED_OFFLINE,
				] );

				await autosaveFailure.fail( 'dropped-connection' );
				await autosaveFailure.autosave();
				expect( await autosaveFailure.getNotices() ).toEqual( [
					UPDATING_FAILED_OFFLINE,
				] );

				await autosaveFailure.stopFailing();
				await autosaveFailure.autosave();
				expect( await autosaveFailure.getNotices() ).toEqual(
					afterAutosave
				);

				await pageUtils.pressKeys( 'primary+s' );
				await expect
					.poll( autosaveFailure.getNotices )
					.toEqual( afterManualSave );
			} );
		}
	} );
} );
