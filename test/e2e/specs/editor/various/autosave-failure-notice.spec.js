const {
	test: base,
	expect,
} = require( '@wordpress/e2e-test-utils-playwright' );

const AUTOSAVE_FAILED =
	'Auto-save failed. We’ll try to save a backup in this browser. You can also save manually.';

const isAutosaveRequest = ( url ) =>
	decodeURIComponent( url.href ).includes( '/autosaves' );

const jsonResponse = ( status, body ) => ( {
	status,
	contentType: 'application/json',
	body: typeof body === 'string' ? body : JSON.stringify( body ),
} );

const test = base.extend( {
	autosaveFailure: async ( { page, editor }, use ) => {
		const notices = page
			.getByRole( 'region', { name: 'Editor content' } )
			.locator( '.components-notice__content' );

		await use( {
			notices,
			async respondWith( response, options ) {
				await page.route(
					isAutosaveRequest,
					async ( route ) => {
						if ( route.request().method() !== 'POST' ) {
							return route.fallback();
						}
						if ( response === 'abort' ) {
							return route.abort( 'connectionreset' );
						}
						return route.fulfill( response );
					},
					options
				);
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
		} );
	},
} );

test.describe( 'Autosave failure notice', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.describe( 'without details', () => {
		test( 'PHP fatal error', async ( { autosaveFailure } ) => {
			await autosaveFailure.respondWith(
				jsonResponse( 500, {
					code: 'internal_server_error',
					message:
						'<p>There has been a critical error on this website.</p><p><a href="https://wordpress.org/documentation/article/faq-troubleshooting/">Learn more about troubleshooting WordPress.</a></p>',
					data: { status: 500 },
					additional_errors: [],
				} )
			);
			await autosaveFailure.autosave();
			await expect( autosaveFailure.notices ).toHaveText( [
				AUTOSAVE_FAILED,
			] );
		} );

		test( 'database connection error', async ( { autosaveFailure } ) => {
			await autosaveFailure.respondWith(
				jsonResponse( 500, {
					code: 'wp_die',
					message:
						'<h1>Error establishing a database connection</h1>',
					data: { status: 500 },
					additional_errors: [],
				} )
			);
			await autosaveFailure.autosave();
			await expect( autosaveFailure.notices ).toHaveText( [
				AUTOSAVE_FAILED,
			] );
		} );

		test( 'error message containing a link', async ( {
			autosaveFailure,
		} ) => {
			await autosaveFailure.respondWith(
				jsonResponse( 403, {
					code: 'plugin_blocked',
					message:
						'Blocked. <a href="https://example.com">Learn more</a>.',
					data: { status: 403 },
				} )
			);
			await autosaveFailure.autosave();
			await expect( autosaveFailure.notices ).toHaveText( [
				AUTOSAVE_FAILED,
			] );
		} );

		test( 'connection dropped before a response', async ( {
			autosaveFailure,
		} ) => {
			await autosaveFailure.respondWith( 'abort' );
			await autosaveFailure.autosave();
			await expect( autosaveFailure.notices ).toHaveText( [
				AUTOSAVE_FAILED,
			] );
		} );

		test( 'error without a message', async ( { autosaveFailure } ) => {
			await autosaveFailure.respondWith( jsonResponse( 500, '{}' ) );
			await autosaveFailure.autosave();
			await expect( autosaveFailure.notices ).toHaveText( [
				AUTOSAVE_FAILED,
			] );
		} );

		test( 'offline', async ( { autosaveFailure, context } ) => {
			await context.setOffline( true );
			await autosaveFailure.autosave();
			await expect( autosaveFailure.notices ).toHaveText( [
				'Auto-save failed because you were offline. We’ll try to save a backup in this browser. Please verify your connection and save manually.',
			] );
			await context.setOffline( false );
		} );
	} );

	test.describe( 'with details', () => {
		for ( const { title, response, details } of [
			{
				title: 'error with a plain text message',
				response: jsonResponse( 500, {
					code: 'plugin_error',
					message: 'Something went wrong on the server.',
					data: { status: 500 },
				} ),
				details: 'Something went wrong on the server.',
			},
			{
				title: 'permission denied',
				response: jsonResponse( 403, {
					code: 'rest_cannot_edit',
					message: 'Sorry, you are not allowed to edit this post.',
					data: { status: 403 },
				} ),
				details: 'Sorry, you are not allowed to edit this post.',
			},
			{
				title: 'database write failed',
				response: jsonResponse( 500, {
					code: 'db_update_error',
					message: 'Could not update post in the database.',
					data: { status: 500 },
				} ),
				details: 'Could not update post in the database.',
			},
			{
				title: 'HTML error page',
				response: {
					status: 502,
					contentType: 'text/html',
					body: '<html><body><h1>502 Bad Gateway</h1></body></html>',
				},
				details: 'The response is not a valid JSON response.',
			},
			{
				title: 'PHP fatal error printed before the JSON',
				response: jsonResponse(
					500,
					'<br />\n<b>Fatal error</b>:  Uncaught Error: Call to undefined function example() in <b>/var/www/html/wp-content/plugins/example.php</b> on line <b>1</b><br />\n' +
						JSON.stringify( {
							code: 'internal_server_error',
							message:
								'<p>There has been a critical error on this website.</p>',
							data: { status: 500 },
						} )
				),
				details: 'The response is not a valid JSON response.',
			},
		] ) {
			test( title, async ( { autosaveFailure } ) => {
				await autosaveFailure.respondWith( response );
				await autosaveFailure.autosave();
				await expect( autosaveFailure.notices ).toHaveText( [
					`${ AUTOSAVE_FAILED } Show details${ details }`,
				] );
				await autosaveFailure.notices
					.getByText( 'Show details' )
					.click();
				await expect(
					autosaveFailure.notices.getByText( details )
				).toBeVisible();
			} );
		}

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
			await expect( autosaveFailure.notices ).toHaveText( [
				`${ AUTOSAVE_FAILED } Show detailsA plugin could not save.`,
			] );
			await page.evaluate( () =>
				window.wp.hooks.removeAction(
					'editor.savePost',
					'test/autosave-failure'
				)
			);
		} );
	} );

	test.describe( 'no notice', () => {
		test( 'response body of 0', async ( { autosaveFailure } ) => {
			await autosaveFailure.respondWith( jsonResponse( 500, '0' ) );
			await autosaveFailure.autosave();
			await expect( autosaveFailure.notices ).toHaveCount( 0 );
		} );

		test( 'no changes to autosave', async ( { autosaveFailure } ) => {
			await autosaveFailure.respondWith(
				jsonResponse( 400, {
					code: 'rest_autosave_no_changes',
					message:
						'There is nothing to save. The autosave and the post content are the same.',
					data: { status: 400 },
				} )
			);
			await autosaveFailure.autosave();
			await expect( autosaveFailure.notices ).toHaveCount( 0 );
		} );

		test( 'expired nonce is refreshed and the autosave retried', async ( {
			autosaveFailure,
			page,
		} ) => {
			const statuses = [];
			page.on( 'response', ( response ) => {
				if (
					response.request().method() === 'POST' &&
					isAutosaveRequest( new URL( response.url() ) )
				) {
					statuses.push( response.status() );
				}
			} );
			await autosaveFailure.respondWith(
				jsonResponse( 403, {
					code: 'rest_cookie_invalid_nonce',
					message: 'Cookie check failed',
					data: { status: 403 },
				} ),
				{ times: 1 }
			);
			await autosaveFailure.autosave();
			expect( statuses ).toEqual( [ 403, 200 ] );
			await expect( autosaveFailure.notices ).toHaveCount( 0 );
		} );
	} );

	test.describe( 'after a failure', () => {
		test( 'autosave is retried at every interval without new edits', async ( {
			autosaveFailure,
			page,
		} ) => {
			const requests = [];
			page.on( 'request', ( request ) => {
				if (
					request.method() === 'POST' &&
					isAutosaveRequest( new URL( request.url() ) )
				) {
					requests.push( request );
				}
			} );
			await autosaveFailure.respondWith( 'abort' );
			await page.clock.install();
			await page.evaluate( () =>
				window.wp.data
					.dispatch( 'core/editor' )
					.updateEditorSettings( { autosaveInterval: 61 } )
			);

			await autosaveFailure.edit();
			await page.clock.runFor( 61_000 );
			await expect( autosaveFailure.notices ).toHaveText( [
				AUTOSAVE_FAILED,
			] );

			await expect.poll( () => requests.length ).toBe( 1 );

			await page.clock.runFor( 61_000 );
			await expect.poll( () => requests.length ).toBe( 2 );
			await page.clock.runFor( 61_000 );
			await expect.poll( () => requests.length ).toBe( 3 );
		} );

		test( 'notice stays after a later autosave succeeds', async ( {
			autosaveFailure,
			page,
		} ) => {
			await autosaveFailure.respondWith( 'abort', { times: 1 } );
			await autosaveFailure.autosave();
			await expect( autosaveFailure.notices ).toHaveText( [
				AUTOSAVE_FAILED,
			] );

			await autosaveFailure.autosave();
			expect(
				await page.evaluate( () =>
					window.wp.data
						.select( 'core/editor' )
						.didPostSaveRequestFail()
				)
			).toBe( false );
			await expect( autosaveFailure.notices ).toHaveText( [
				AUTOSAVE_FAILED,
			] );
		} );
	} );
} );
