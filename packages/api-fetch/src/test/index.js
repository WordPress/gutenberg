import apiFetch from '../';

describe( 'apiFetch', () => {
	const originalFetch = window.fetch;
	beforeAll( () => {
		window.fetch = jest.fn();
	} );

	afterAll( () => {
		window.fetch = originalFetch;
	} );

	it( 'should call the API propertly', () => {
		window.fetch.mockReturnValue( Promise.resolve( {
			status: 200,
			json() {
				return Promise.resolve( { message: 'ok' } );
			},
		} ) );

		return apiFetch( { path: '/random' } ).then( ( body ) => {
			expect( body ).toEqual( { message: 'ok' } );
		} );
	} );

	it( 'should return the error message properly', () => {
		window.fetch.mockReturnValue( Promise.resolve( {
			status: 400,
			json() {
				return Promise.resolve( {
					code: 'bad_request',
					message: 'Bad Request',
				} );
			},
			clone() {
				return null;
			},
		} ) );

		return apiFetch( { path: '/random' } ).catch( ( body ) => {
			expect( body ).toEqual( {
				code: 'bad_request',
				message: 'Bad Request',
			} );
		} );
	} );

	it( 'should return invalid JSON error if no json response', () => {
		window.fetch.mockReturnValue( Promise.resolve( {
			status: 200,
		} ) );

		return apiFetch( { path: '/random' } ).catch( ( body ) => {
			expect( body ).toEqual( {
				code: 'invalid_json',
				message: 'The response is not a valid JSON response.',
			} );
		} );
	} );

	it( 'should return invalid JSON error if response is not valid', () => {
		window.fetch.mockReturnValue( Promise.resolve( {
			status: 200,
			json() {
				return Promise.reject();
			},
		} ) );

		return apiFetch( { path: '/random' } ).catch( ( body ) => {
			expect( body ).toEqual( {
				code: 'invalid_json',
				message: 'The response is not a valid JSON response.',
			} );
		} );
	} );

	it( 'should return null if response has no content status code', () => {
		window.fetch.mockReturnValue( Promise.resolve( {
			status: 204,
		} ) );

		return apiFetch( { path: '/random' } ).catch( ( body ) => {
			expect( body ).toEqual( null );
		} );
	} );

	it( 'should not try to parse the response', () => {
		window.fetch.mockReturnValue( Promise.resolve( {
			status: 200,
		} ) );

		return apiFetch( { path: '/random', parse: false } ).then( ( response ) => {
			expect( response ).toEqual( {
				status: 200,
			} );
		} );
	} );

	it( 'should not try to parse the error', () => {
		window.fetch.mockReturnValue( Promise.resolve( {
			status: 400,
		} ) );

		return apiFetch( { path: '/random', parse: false } ).catch( ( response ) => {
			expect( response ).toEqual( {
				status: 400,
			} );
		} );
	} );

	it( 'should apply an Accept: application/json header', () => {
		window.fetch.mockReturnValue( Promise.resolve( {
			status: 200,
			json() {
				return Promise.resolve( { message: 'ok' } );
			},
		} ) );

		const headers = {};

		return apiFetch( { path: '/random', headers } ).then( () => {
			expect( headers ).toHaveProperty( 'Accept' );
			expect( headers.Accept ).toBe( 'application/json' );
		} );
	} );

	it( 'should not override an existing accept header', () => {
		window.fetch.mockReturnValue( Promise.resolve( {
			status: 200,
			json() {
				return Promise.resolve( { message: 'ok' } );
			},
		} ) );

		const headers = {
			Accept: '*/*',
		};

		return apiFetch( { path: '/random', headers } ).then( () => {
			expect( headers ).toHaveProperty( 'Accept' );
			expect( headers.Accept ).toBe( '*/*' );
		} );
	} );
} );
