import apiFetch from '../';

describe( 'apiFetch', () => {
	const originalFetch = window.fetch;
	beforeAll( () => {
		window.fetch = jest.fn();
	} );

	afterAll( () => {
		window.fetch = originalFetch;
	} );

	it( 'should call the API properly', () => {
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

	it( 'should recursively request and merge multi-page collections', () => {
		expect.hasAssertions();

		window.fetch
			.mockReturnValueOnce( Promise.resolve( {
				status: 200,
				json() {
					return Promise.resolve( [ 'post6', 'post5' ] );
				},
				headers: {
					get() {
						return '</wp-json/wp/v2/posts?page=2>; rel="next"';
					},
				},
			} ) )
			.mockReturnValueOnce( Promise.resolve( {
				status: 200,
				json() {
					return Promise.resolve( [ 'post4', 'post3' ] );
				},
				headers: {
					get() {
						return '</wp-json/wp/v2/posts?page=3>; rel="next"';
					},
				},
			} ) )
			.mockReturnValueOnce( Promise.resolve( {
				status: 200,
				json() {
					return Promise.resolve( [ 'post2', 'post1' ] );
				},
			} ) );

		return apiFetch( {
			path: '/wp-json/wp/v2/posts?per_page=-1',
		} ).then( ( response ) => {
			expect( response ).toEqual( [
				'post6',
				'post5',
				'post4',
				'post3',
				'post2',
				'post1',
			] );
		} );
	} );

	it( 'should properly return any error message received during pagination', () => {
		expect.hasAssertions();

		window.fetch
			.mockReturnValueOnce( Promise.resolve( {
				status: 200,
				json() {
					return Promise.resolve( [ 'post6', 'post5' ] );
				},
				headers: {
					get() {
						return '</wp-json/wp/v2/posts?page=2>; rel="next"';
					},
				},
			} ) )
			.mockReturnValueOnce( Promise.resolve( {
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

		return apiFetch( {
			path: '/wp-json/wp/v2/posts?per_page=-1',
		} ).catch( ( body ) => {
			expect( body ).toEqual( {
				code: 'bad_request',
				message: 'Bad Request',
			} );
		} );
	} );
} );
