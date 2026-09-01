/**
 * Mock response value for a successful fetch.
 *
 * @return {Response} Mock return value.
 */
const DEFAULT_FETCH_MOCK_RETURN = {
	ok: true,
	status: 200,
	json: () => Promise.resolve( {} ),
};

describe( 'apiFetch', () => {
	let apiFetch;
	const originalFetch = globalThis.fetch;

	beforeEach( async () => {
		// Reset the `apiFetch` module before each test to clear
		// internal variables (middlewares, fetch handler, etc.).
		jest.resetModules();
		apiFetch = ( await import( '../' ) ).default;

		globalThis.fetch = jest.fn();
	} );

	afterAll( () => {
		globalThis.fetch = originalFetch;
	} );

	it( 'should call the API properly', async () => {
		globalThis.fetch.mockResolvedValue( {
			ok: true,
			status: 200,
			async json() {
				return { message: 'ok' };
			},
		} );

		await expect( apiFetch( { path: '/random' } ) ).resolves.toEqual( {
			message: 'ok',
		} );
	} );

	it( 'should fetch with non-JSON body', async () => {
		globalThis.fetch.mockResolvedValue( DEFAULT_FETCH_MOCK_RETURN );

		const body = 'FormData';

		await apiFetch( {
			path: '/wp/v2/media',
			method: 'POST',
			body,
		} );

		expect( globalThis.fetch ).toHaveBeenCalledWith(
			'/wp/v2/media?_locale=user',
			{
				credentials: 'include',
				headers: {
					Accept: 'application/json, */*;q=0.1',
				},
				method: 'POST',
				body,
			}
		);
	} );

	it( 'should fetch with a JSON body', async () => {
		globalThis.fetch.mockResolvedValue( DEFAULT_FETCH_MOCK_RETURN );

		await apiFetch( {
			path: '/wp/v2/posts',
			method: 'POST',
			headers: {
				'Content-Type': 'text/plain',
			},
			data: {},
		} );

		expect( globalThis.fetch ).toHaveBeenCalledWith(
			'/wp/v2/posts?_locale=user',
			{
				body: '{}',
				credentials: 'include',
				headers: {
					Accept: 'application/json, */*;q=0.1',
					'Content-Type': 'application/json',
				},
				method: 'POST',
			}
		);
	} );

	it( 'should respect developer-provided options', async () => {
		globalThis.fetch.mockResolvedValue( DEFAULT_FETCH_MOCK_RETURN );

		await apiFetch( {
			path: '/wp/v2/posts',
			method: 'POST',
			data: {},
			credentials: 'omit',
		} );

		expect( globalThis.fetch ).toHaveBeenCalledWith(
			'/wp/v2/posts?_locale=user',
			{
				body: '{}',
				credentials: 'omit',
				headers: {
					Accept: 'application/json, */*;q=0.1',
					'Content-Type': 'application/json',
				},
				method: 'POST',
			}
		);
	} );

	it( 'should return the error message properly', async () => {
		globalThis.fetch.mockResolvedValue( {
			ok: false,
			status: 400,
			async json() {
				return {
					code: 'bad_request',
					message: 'Bad Request',
				};
			},
		} );

		await expect( apiFetch( { path: '/random' } ) ).rejects.toEqual( {
			code: 'bad_request',
			message: 'Bad Request',
		} );
	} );

	it( 'should return invalid JSON error if no json response', async () => {
		globalThis.fetch.mockResolvedValue( {
			ok: true,
			status: 200,
			async json() {
				return JSON.parse( '' );
			},
		} );

		await expect( apiFetch( { path: '/random' } ) ).rejects.toEqual( {
			code: 'invalid_json',
			message: 'The response is not a valid JSON response.',
		} );
	} );

	it( 'should return invalid JSON error if response is not valid', async () => {
		globalThis.fetch.mockResolvedValue( {
			ok: true,
			status: 200,
			async json() {
				return JSON.parse( '' );
			},
		} );

		await expect( apiFetch( { path: '/random' } ) ).rejects.toEqual( {
			code: 'invalid_json',
			message: 'The response is not a valid JSON response.',
		} );
	} );

	it( 'should return offline error when fetch errors', async () => {
		globalThis.fetch.mockRejectedValue(
			new TypeError( 'Failed to fetch' )
		);

		await expect( apiFetch( { path: '/random' } ) ).rejects.toEqual( {
			code: 'fetch_error',
			message: 'Could not get a valid response from the server.',
		} );
	} );

	it( 'should throw AbortError when fetch aborts', async () => {
		globalThis.fetch.mockImplementation(
			( path, { signal } ) =>
				new Promise( ( _, reject ) => {
					if ( ! signal ) {
						reject( new Error( 'Expected signal as argument' ) );
						return;
					}

					signal.throwIfAborted();
					signal.addEventListener(
						'abort',
						( e ) => {
							reject( e.target.reason );
						},
						{ once: true }
					);
				} )
		);

		const controller = new globalThis.AbortController();

		const promise = apiFetch( {
			path: '/random',
			signal: controller.signal,
		} );

		controller.abort();

		await expect( promise ).rejects.toMatchObject( {
			name: 'AbortError',
		} );
	} );

	it( 'should return null if response has no content status code', async () => {
		globalThis.fetch.mockResolvedValue( {
			ok: true,
			status: 204,
		} );

		await expect( apiFetch( { path: '/random' } ) ).resolves.toBe( null );
	} );

	it( 'should not try to parse the response', async () => {
		const mockResponse = {
			ok: true,
			status: 200,
		};

		globalThis.fetch.mockResolvedValue( mockResponse );

		await expect(
			apiFetch( { path: '/random', parse: false } )
		).resolves.toBe( mockResponse );
	} );

	it( 'should not try to parse the error', async () => {
		const mockResponse = {
			ok: false,
			status: 400,
		};

		globalThis.fetch.mockResolvedValue( mockResponse );

		await expect(
			apiFetch( { path: '/random', parse: false } )
		).rejects.toBe( mockResponse );
	} );

	it( 'should refetch after successful nonce refresh', async () => {
		apiFetch.nonceMiddleware =
			apiFetch.createNonceMiddleware( 'old-nonce' );
		apiFetch.use( apiFetch.nonceMiddleware );
		apiFetch.nonceEndpoint = '/rest-nonce';

		globalThis.fetch.mockImplementation( async ( path, options ) => {
			if ( path.startsWith( '/random' ) ) {
				if ( options?.headers[ 'X-WP-Nonce' ] === 'new-nonce' ) {
					return {
						ok: true,
						status: 200,
						json: async () => ( { code: 'success' } ),
					};
				}

				return {
					ok: false,
					status: 403,
					json: async () => ( { code: 'rest_cookie_invalid_nonce' } ),
				};
			}

			if ( path.startsWith( '/rest-nonce' ) ) {
				return {
					ok: true,
					status: 200,
					text: async () => 'new-nonce',
				};
			}

			return {
				ok: false,
				status: 404,
				json: async () => ( { code: 'rest_no_route' } ),
			};
		} );

		await expect( apiFetch( { path: '/random' } ) ).resolves.toEqual( {
			code: 'success',
		} );
	} );

	it( 'should fail with rest_cookie_invalid_nonce after failed nonce refresh', async () => {
		apiFetch.nonceMiddleware =
			apiFetch.createNonceMiddleware( 'old-nonce' );
		apiFetch.use( apiFetch.nonceMiddleware );
		apiFetch.nonceEndpoint = '/rest-nonce';

		globalThis.fetch.mockImplementation( async ( path, options ) => {
			if ( path.startsWith( '/random' ) ) {
				if ( options?.headers[ 'X-WP-Nonce' ] === 'new-nonce' ) {
					return {
						ok: true,
						status: 200,
						json: async () => ( { code: 'success' } ),
					};
				}

				return {
					ok: false,
					status: 403,
					json: async () => ( { code: 'rest_cookie_invalid_nonce' } ),
				};
			}

			if ( path.startsWith( '/rest-nonce' ) ) {
				return {
					ok: false,
					status: 400,
					text: async () => '0',
				};
			}

			return {
				ok: false,
				status: 404,
				json: async () => ( { code: 'rest_no_route' } ),
			};
		} );

		await expect( apiFetch( { path: '/random' } ) ).rejects.toEqual( {
			code: 'rest_cookie_invalid_nonce',
		} );
	} );

	it( 'should not use the default fetch handler when using a custom fetch handler', async () => {
		const customFetchHandler = jest.fn();

		apiFetch.setFetchHandler( customFetchHandler );

		await apiFetch( { path: '/random' } );

		expect( globalThis.fetch ).not.toHaveBeenCalled();

		expect( customFetchHandler ).toHaveBeenCalledWith( {
			path: '/random?_locale=user',
		} );
	} );

	it( 'should run the last-registered user-defined middleware first', async () => {
		// The test assumes that some built-in middleware will either mutate or clone
		// the original options if the extra middleware had been pushed to the stack.

		const expectedOptions = {};

		apiFetch.use( ( actualOptions, next ) => {
			expect( actualOptions ).toBe( expectedOptions );

			return next( actualOptions );
		} );

		// Set a custom fetch handler to avoid using the default fetch handler.
		apiFetch.setFetchHandler( jest.fn() );

		await apiFetch( expectedOptions );
	} );
} );
