/**
 * Internal dependencies
 */
import apiFetch from '../';

/**
 * External dependencies
 */
import getGlobal from 'globalthis';
import 'isomorphic-fetch';

/**
 * Mock return value for a successful fetch JSON return value.
 *
 * @return {Promise} Mock return value.
 */
const DEFAULT_FETCH_MOCK_RETURN = Promise.resolve( {
	status: 200,
	json: () => Promise.resolve( {} ),
} );

describe( 'apiFetch', () => {
	const shimmedGlobal = getGlobal();
	const originalFetch = shimmedGlobal.fetch;

	beforeEach( () => {
		shimmedGlobal.fetch = jest.fn();
	} );

	afterAll( () => {
		shimmedGlobal.fetch = originalFetch;
	} );

	it( 'should call the API properly', () => {
		shimmedGlobal.fetch.mockReturnValue(
			Promise.resolve( {
				status: 200,
				json() {
					return Promise.resolve( { message: 'ok' } );
				},
			} )
		);

		return apiFetch( { path: '/random' } ).then( ( body ) => {
			expect( body ).toEqual( { message: 'ok' } );
		} );
	} );

	it( 'should fetch with non-JSON body', () => {
		shimmedGlobal.fetch.mockReturnValue( DEFAULT_FETCH_MOCK_RETURN );

		const body = 'FormData';

		apiFetch( {
			path: '/wp/v2/media',
			method: 'POST',
			body,
		} );

		expect( shimmedGlobal.fetch ).toHaveBeenCalledWith(
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

	it( 'should fetch with a JSON body', () => {
		shimmedGlobal.fetch.mockReturnValue( DEFAULT_FETCH_MOCK_RETURN );

		apiFetch( {
			path: '/wp/v2/posts',
			method: 'POST',
			headers: {
				'Content-Type': 'text/plain',
			},
			data: {},
		} );

		expect( shimmedGlobal.fetch ).toHaveBeenCalledWith(
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

	it( 'should respect developer-provided options', () => {
		shimmedGlobal.fetch.mockReturnValue( DEFAULT_FETCH_MOCK_RETURN );

		apiFetch( {
			path: '/wp/v2/posts',
			method: 'POST',
			data: {},
			credentials: 'omit',
		} );

		expect( shimmedGlobal.fetch ).toHaveBeenCalledWith(
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

	it( 'should return the error message properly', () => {
		shimmedGlobal.fetch.mockReturnValue(
			Promise.resolve( {
				status: 400,
				json() {
					return Promise.resolve( {
						code: 'bad_request',
						message: 'Bad Request',
					} );
				},
			} )
		);

		return apiFetch( { path: '/random' } ).catch( ( body ) => {
			expect( body ).toEqual( {
				code: 'bad_request',
				message: 'Bad Request',
			} );
		} );
	} );

	it( 'should return invalid JSON error if no json response', () => {
		shimmedGlobal.fetch.mockReturnValue(
			Promise.resolve( {
				status: 200,
			} )
		);

		return apiFetch( { path: '/random' } ).catch( ( body ) => {
			expect( body ).toEqual( {
				code: 'invalid_json',
				message: 'The response is not a valid JSON response.',
			} );
		} );
	} );

	it( 'should return invalid JSON error if response is not valid', () => {
		shimmedGlobal.fetch.mockReturnValue(
			Promise.resolve( {
				status: 200,
				json() {
					return Promise.reject();
				},
			} )
		);

		return apiFetch( { path: '/random' } ).catch( ( body ) => {
			expect( body ).toEqual( {
				code: 'invalid_json',
				message: 'The response is not a valid JSON response.',
			} );
		} );
	} );

	it( 'should return offline error when fetch errors', () => {
		shimmedGlobal.fetch.mockReturnValue( Promise.reject() );

		return apiFetch( { path: '/random' } ).catch( ( body ) => {
			expect( body ).toEqual( {
				code: 'fetch_error',
				message: 'You are probably offline.',
			} );
		} );
	} );

	it( 'should return null if response has no content status code', () => {
		shimmedGlobal.fetch.mockReturnValue(
			Promise.resolve( {
				status: 204,
			} )
		);

		return apiFetch( { path: '/random' } ).catch( ( body ) => {
			expect( body ).toEqual( null );
		} );
	} );

	it( 'should not try to parse the response', () => {
		shimmedGlobal.fetch.mockReturnValue(
			Promise.resolve( {
				status: 200,
			} )
		);

		return apiFetch( { path: '/random', parse: false } ).then(
			( response ) => {
				expect( response ).toEqual( {
					status: 200,
				} );
			}
		);
	} );

	it( 'should not try to parse the error', () => {
		shimmedGlobal.fetch.mockReturnValue(
			Promise.resolve( {
				status: 400,
			} )
		);

		return apiFetch( { path: '/random', parse: false } ).catch(
			( response ) => {
				expect( response ).toEqual( {
					status: 400,
				} );
			}
		);
	} );

	it( 'should not use the default fetch handler when using a custom fetch handler', () => {
		const customFetchHandler = jest.fn();

		apiFetch.setFetchHandler( customFetchHandler );

		apiFetch( { path: '/random' } );

		expect( shimmedGlobal.fetch ).not.toHaveBeenCalled();

		expect( customFetchHandler ).toHaveBeenCalledWith( {
			path: '/random?_locale=user',
		} );
	} );

	it( 'should run the last-registered user-defined middleware first', () => {
		// This could potentially impact other tests in that a lingering
		// middleware is left. For the purposes of this test, it is sufficient
		// to ensure that the last-registered middleware receives the original
		// options object. It also assumes that some built-in middleware would
		// either mutate or clone the original options if the extra middleware
		// had been pushed to the stack.
		expect.assertions( 1 );

		const expectedOptions = {};

		apiFetch.use( ( actualOptions, next ) => {
			expect( actualOptions ).toBe( expectedOptions );

			return next( actualOptions );
		} );

		apiFetch( expectedOptions );
	} );
} );
