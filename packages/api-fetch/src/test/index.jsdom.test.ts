import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import type { ApiFetch, APIFetchMiddleware } from '..';

/**
 * Mock response value for a successful fetch.
 *
 * @return Mock return value.
 */
const DEFAULT_FETCH_MOCK_RETURN = {
	ok: true,
	status: 200,
	json: () => Promise.resolve( {} ),
} as Response;

describe( 'apiFetch', () => {
	let apiFetch: ApiFetch;
	const originalFetch = globalThis.fetch;
	let fetchMock: Mock< typeof globalThis.fetch >;

	beforeEach( async () => {
		// Reset the `apiFetch` module before each test to clear
		// internal variables (middlewares, fetch handler, etc.).
		vi.resetModules();
		apiFetch = ( await import( '../' ) ).default;

		fetchMock = vi.fn< typeof globalThis.fetch >();
		globalThis.fetch = fetchMock;
	} );

	afterAll( () => {
		globalThis.fetch = originalFetch;
	} );

	it( 'should call the API properly', async () => {
		fetchMock.mockResolvedValue( {
			ok: true,
			status: 200,
			async json() {
				return { message: 'ok' };
			},
		} as Response );

		await expect( apiFetch( { path: '/random' } ) ).resolves.toEqual( {
			message: 'ok',
		} );
	} );

	it( 'should fetch with non-JSON body', async () => {
		fetchMock.mockResolvedValue( DEFAULT_FETCH_MOCK_RETURN );

		const body = 'FormData';

		await apiFetch( {
			path: '/wp/v2/media',
			method: 'POST',
			body,
		} );

		expect( fetchMock ).toHaveBeenCalledWith( '/wp/v2/media?_locale=user', {
			credentials: 'include',
			headers: {
				Accept: 'application/json, */*;q=0.1',
			},
			method: 'POST',
			body,
		} );
	} );

	it( 'should fetch with a JSON body', async () => {
		fetchMock.mockResolvedValue( DEFAULT_FETCH_MOCK_RETURN );

		await apiFetch( {
			path: '/wp/v2/posts',
			method: 'POST',
			headers: {
				'Content-Type': 'text/plain',
			},
			data: {},
		} );

		expect( fetchMock ).toHaveBeenCalledWith( '/wp/v2/posts?_locale=user', {
			body: '{}',
			credentials: 'include',
			headers: {
				Accept: 'application/json, */*;q=0.1',
				'Content-Type': 'application/json',
			},
			method: 'POST',
		} );
	} );

	it( 'should respect developer-provided options', async () => {
		fetchMock.mockResolvedValue( DEFAULT_FETCH_MOCK_RETURN );

		await apiFetch( {
			path: '/wp/v2/posts',
			method: 'POST',
			data: {},
			credentials: 'omit',
		} );

		expect( fetchMock ).toHaveBeenCalledWith( '/wp/v2/posts?_locale=user', {
			body: '{}',
			credentials: 'omit',
			headers: {
				Accept: 'application/json, */*;q=0.1',
				'Content-Type': 'application/json',
			},
			method: 'POST',
		} );
	} );

	it( 'should return the error message properly', async () => {
		fetchMock.mockResolvedValue( {
			ok: false,
			status: 400,
			async json() {
				return {
					code: 'bad_request',
					message: 'Bad Request',
				};
			},
		} as Response );

		await expect( apiFetch( { path: '/random' } ) ).rejects.toEqual( {
			code: 'bad_request',
			message: 'Bad Request',
			data: { status: 400 },
		} );
	} );

	it( 'should keep the data of an error response', async () => {
		fetchMock.mockResolvedValue( {
			ok: false,
			status: 500,
			async json() {
				return {
					code: 'db_update_error',
					message: 'Could not update post in the database.',
					data: 'Table does not exist',
				};
			},
		} as Response );

		await expect( apiFetch( { path: '/random' } ) ).rejects.toEqual( {
			code: 'db_update_error',
			message: 'Could not update post in the database.',
			data: 'Table does not exist',
		} );
	} );

	it( 'should return invalid JSON error if no json response', async () => {
		fetchMock.mockResolvedValue( {
			ok: true,
			status: 200,
			async json() {
				return JSON.parse( '' );
			},
		} as Response );

		await expect( apiFetch( { path: '/random' } ) ).rejects.toEqual( {
			code: 'invalid_json',
			message: 'The response is not a valid JSON response.',
			data: { status: 200 },
		} );
	} );

	it( 'should return invalid JSON error if response is not valid', async () => {
		fetchMock.mockResolvedValue( {
			ok: true,
			status: 200,
			async json() {
				return JSON.parse( '' );
			},
		} as Response );

		await expect( apiFetch( { path: '/random' } ) ).rejects.toEqual( {
			code: 'invalid_json',
			message: 'The response is not a valid JSON response.',
			data: { status: 200 },
		} );
	} );

	it( 'should return offline error when fetch errors', async () => {
		fetchMock.mockRejectedValue( new TypeError( 'Failed to fetch' ) );

		await expect( apiFetch( { path: '/random' } ) ).rejects.toEqual( {
			code: 'fetch_error',
			message: 'Could not get a valid response from the server.',
		} );
	} );

	it( 'should throw AbortError when fetch aborts', async () => {
		fetchMock.mockImplementation(
			( path, options ) =>
				new Promise( ( _, reject ) => {
					const { signal } = options!;
					if ( ! signal ) {
						reject( new Error( 'Expected signal as argument' ) );
						return;
					}

					signal.throwIfAborted();
					signal.addEventListener(
						'abort',
						( e ) => {
							reject( ( e.target as AbortSignal ).reason );
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
		fetchMock.mockResolvedValue( {
			ok: true,
			status: 204,
		} as Response );

		await expect( apiFetch( { path: '/random' } ) ).resolves.toBe( null );
	} );

	it( 'should return null for a 200 response with an empty body', async () => {
		fetchMock.mockResolvedValue( new Response( '', { status: 200 } ) );

		await expect( apiFetch( { path: '/random' } ) ).resolves.toBe( null );
	} );

	it( 'should return invalid JSON error for a 200 response with a non-empty invalid body', async () => {
		fetchMock.mockResolvedValue(
			new Response( 'not json', { status: 200 } )
		);

		await expect( apiFetch( { path: '/random' } ) ).rejects.toEqual( {
			code: 'invalid_json',
			message: 'The response is not a valid JSON response.',
			data: { status: 200 },
		} );
	} );

	it( 'should return invalid JSON error for an error response with an empty body', async () => {
		fetchMock.mockResolvedValue( new Response( '', { status: 500 } ) );

		await expect( apiFetch( { path: '/random' } ) ).rejects.toEqual( {
			code: 'invalid_json',
			message: 'The response is not a valid JSON response.',
			data: { status: 500 },
		} );
	} );

	it( 'should not try to parse the response', async () => {
		const mockResponse = {
			ok: true,
			status: 200,
		} as Response;

		fetchMock.mockResolvedValue( mockResponse );

		await expect(
			apiFetch( { path: '/random', parse: false } )
		).resolves.toBe( mockResponse );
	} );

	it( 'should not try to parse the error', async () => {
		const mockResponse = {
			ok: false,
			status: 400,
		} as Response;

		fetchMock.mockResolvedValue( mockResponse );

		await expect(
			apiFetch( { path: '/random', parse: false } )
		).rejects.toBe( mockResponse );
	} );

	it( 'should refetch after successful nonce refresh', async () => {
		apiFetch.nonceMiddleware =
			apiFetch.createNonceMiddleware( 'old-nonce' );
		apiFetch.use( apiFetch.nonceMiddleware );
		apiFetch.nonceEndpoint = '/rest-nonce';

		fetchMock.mockImplementation( async ( path, options ) => {
			if ( ( path as string ).startsWith( '/random' ) ) {
				if (
					new Headers( options?.headers ).get( 'X-WP-Nonce' ) ===
					'new-nonce'
				) {
					return {
						ok: true,
						status: 200,
						json: async () => ( { code: 'success' } ),
					} as Response;
				}

				return {
					ok: false,
					status: 403,
					json: async () => ( { code: 'rest_cookie_invalid_nonce' } ),
				} as Response;
			}

			if ( ( path as string ).startsWith( '/rest-nonce' ) ) {
				return {
					ok: true,
					status: 200,
					text: async () => 'new-nonce',
				} as Response;
			}

			return {
				ok: false,
				status: 404,
				json: async () => ( { code: 'rest_no_route' } ),
			} as Response;
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

		fetchMock.mockImplementation( async ( path, options ) => {
			if ( ( path as string ).startsWith( '/random' ) ) {
				if (
					new Headers( options?.headers ).get( 'X-WP-Nonce' ) ===
					'new-nonce'
				) {
					return {
						ok: true,
						status: 200,
						json: async () => ( { code: 'success' } ),
					} as Response;
				}

				return {
					ok: false,
					status: 403,
					json: async () => ( { code: 'rest_cookie_invalid_nonce' } ),
				} as Response;
			}

			if ( ( path as string ).startsWith( '/rest-nonce' ) ) {
				return {
					ok: false,
					status: 400,
					text: async () => '0',
				} as Response;
			}

			return {
				ok: false,
				status: 404,
				json: async () => ( { code: 'rest_no_route' } ),
			} as Response;
		} );

		await expect( apiFetch( { path: '/random' } ) ).rejects.toEqual( {
			code: 'rest_cookie_invalid_nonce',
			data: { status: 403 },
		} );
	} );

	it( 'should not use the default fetch handler when using a custom fetch handler', async () => {
		const customFetchHandler = vi.fn();

		apiFetch.setFetchHandler( customFetchHandler );

		await apiFetch( { path: '/random' } );

		expect( fetchMock ).not.toHaveBeenCalled();

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
		apiFetch.setFetchHandler( vi.fn() );

		await apiFetch( expectedOptions );
	} );

	describe( 'unregister', () => {
		it( 'should stop calling a middleware once it is unregistered', async () => {
			const middleware = vi.fn( ( options, next ) => next( options ) );
			const fetchHandler = vi
				.fn()
				.mockResolvedValue( DEFAULT_FETCH_MOCK_RETURN );
			apiFetch.setFetchHandler( fetchHandler );

			apiFetch.use( middleware );

			await apiFetch( { path: '/random' } );
			expect( middleware ).toHaveBeenCalledTimes( 1 );

			apiFetch.unregister( middleware );

			await apiFetch( { path: '/random' } );
			expect( middleware ).toHaveBeenCalledTimes( 1 );
			expect( fetchHandler ).toHaveBeenCalledTimes( 2 );
		} );

		it( 'should report whether the middleware was registered', () => {
			const middleware: APIFetchMiddleware = ( options, next ) =>
				next( options );

			expect( apiFetch.unregister( middleware ) ).toBe( false );

			apiFetch.use( middleware );

			expect( apiFetch.unregister( middleware ) ).toBe( true );
			expect( apiFetch.unregister( middleware ) ).toBe( false );
		} );

		it( 'should stop overriding the method once httpV1Middleware is removed', async () => {
			fetchMock.mockResolvedValue( DEFAULT_FETCH_MOCK_RETURN );

			await apiFetch( { path: '/random', method: 'DELETE' } );

			expect( fetchMock ).toHaveBeenCalledWith(
				'/random?_locale=user',
				expect.objectContaining( {
					method: 'POST',
					headers: expect.objectContaining( {
						'X-HTTP-Method-Override': 'DELETE',
					} ),
				} )
			);

			expect( apiFetch.unregister( apiFetch.httpV1Middleware ) ).toBe(
				true
			);

			await apiFetch( { path: '/random', method: 'DELETE' } );

			const [ , options ] = fetchMock.mock.lastCall!;
			expect( options!.method ).toBe( 'DELETE' );
			expect( options!.headers ).not.toHaveProperty(
				'X-HTTP-Method-Override'
			);
		} );
	} );
} );
