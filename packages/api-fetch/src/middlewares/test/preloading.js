/**
 * Internal dependencies
 */
import createPreloadingMiddleware from '../preloading';

describe( 'Preloading Middleware', () => {
	describe( 'given preloaded data', () => {
		describe( 'when data is requested from a preloaded endpoint', () => {
			describe( 'and it is requested for the first time', () => {
				it( 'should return the preloaded data', () => {
					const body = {
						status: 'this is the preloaded response',
					};
					const preloadedData = {
						'wp/v2/posts': {
							body,
						},
					};
					const preloadingMiddleware =
						createPreloadingMiddleware( preloadedData );
					const requestOptions = {
						method: 'GET',
						path: 'wp/v2/posts',
					};

					const response = preloadingMiddleware( requestOptions );
					return response.then( ( value ) => {
						expect( value ).toEqual( body );
					} );
				} );
			} );

			describe( 'and it has already been requested', () => {
				it( 'should not return the preloaded data', () => {
					const body = {
						status: 'this is the preloaded response',
					};
					const preloadedData = {
						'wp/v2/posts': {
							body,
						},
					};
					const preloadingMiddleware =
						createPreloadingMiddleware( preloadedData );
					const requestOptions = {
						method: 'GET',
						path: 'wp/v2/posts',
					};
					const nextSpy = jest.fn();

					preloadingMiddleware( requestOptions, nextSpy );
					expect( nextSpy ).not.toHaveBeenCalled();
					preloadingMiddleware( requestOptions, nextSpy );
					expect( nextSpy ).toHaveBeenCalled();
				} );
			} );

			describe( 'and the OPTIONS request has a parse flag', () => {
				it( 'should return the full response if parse: false', () => {
					const noResponseMock =
						'undefined' === typeof window.Response;
					if ( noResponseMock ) {
						window.Response = class {
							constructor( body, options ) {
								this.body = JSON.parse( body );
								this.headers = options.headers;
							}
						};
					}

					const data = {
						body: {
							status: 'this is the preloaded response',
						},
						headers: {
							Allow: 'GET, POST',
						},
					};

					const preloadedData = {
						OPTIONS: {
							'wp/v2/posts': data,
						},
					};

					const preloadingMiddleware =
						createPreloadingMiddleware( preloadedData );

					const requestOptions = {
						method: 'OPTIONS',
						path: 'wp/v2/posts',
						parse: false,
					};

					const response = preloadingMiddleware( requestOptions );
					if ( noResponseMock ) {
						delete window.Response;
					}
					return response.then( ( value ) => {
						expect( value ).toEqual( data );
					} );
				} );

				it( 'should return only the response body if parse: true', () => {
					const body = {
						status: 'this is the preloaded response',
					};

					const preloadedData = {
						OPTIONS: {
							'wp/v2/posts': {
								body,
								headers: {
									Allow: 'GET, POST',
								},
							},
						},
					};

					const preloadingMiddleware =
						createPreloadingMiddleware( preloadedData );

					const requestOptions = {
						method: 'OPTIONS',
						path: 'wp/v2/posts',
						parse: true,
					};

					const response = preloadingMiddleware( requestOptions );
					return response.then( ( value ) => {
						expect( value ).toEqual( body );
					} );
				} );
			} );
		} );

		describe( 'when the requested data is not from a preloaded endpoint', () => {
			it( 'should not return preloaded data', () => {
				const body = {
					status: 'this is the preloaded response',
				};
				const preloadedData = {
					'wp/v2/posts': {
						body,
					},
				};
				const preloadingMiddleware =
					createPreloadingMiddleware( preloadedData );
				const requestOptions = {
					method: 'GET',
					path: 'wp/v2/fake_resource',
				};
				const nextSpy = jest.fn();

				preloadingMiddleware( requestOptions, nextSpy );
				expect( nextSpy ).toHaveBeenCalled();
			} );
		} );
	} );

	it( 'should normalize on stable path', async () => {
		const body = { content: 'example' };
		const preloadedData = {
			'wp/v2/demo-reverse-alphabetical?foo=bar&baz=quux': { body },
			'wp/v2/demo-alphabetical?baz=quux&foo=bar': { body },
		};
		const preloadingMiddleware =
			createPreloadingMiddleware( preloadedData );

		let requestOptions = {
			method: 'GET',
			path: 'wp/v2/demo-reverse-alphabetical?baz=quux&foo=bar',
		};

		let value = await preloadingMiddleware( requestOptions, () => {} );
		expect( value ).toEqual( body );

		requestOptions = {
			method: 'GET',
			path: 'wp/v2/demo-alphabetical?foo=bar&baz=quux',
		};

		value = await preloadingMiddleware( requestOptions, () => {} );
		expect( value ).toEqual( body );
	} );

	it( 'should recognize an urlencoded query param', async () => {
		const body = { foo: 'foo', bar: 'bar' };

		const preloadingMiddleware = createPreloadingMiddleware( {
			'/?_fields=foo,bar': { body },
		} );

		const response = await preloadingMiddleware(
			{
				method: 'GET',
				path: '/?_fields=foo%2Cbar',
			},
			() => {}
		);

		expect( response ).toEqual( body );
	} );

	it( 'should recognize rest_route query param as path', async () => {
		const body = { foo: 'foo' };

		const preloadingMiddleware = createPreloadingMiddleware( {
			'/': { body },
		} );

		const response = await preloadingMiddleware(
			{
				method: 'GET',
				url: '/index.php?rest_route=%2F',
			},
			() => {}
		);

		expect( response ).toEqual( body );
	} );

	it( 'should recognize additional query params after rest_route', async () => {
		const body = { foo: 'foo', bar: 'bar' };

		const preloadingMiddleware = createPreloadingMiddleware( {
			'/?_fields=foo,bar': { body },
		} );

		const response = await preloadingMiddleware(
			{
				method: 'GET',
				url: '/index.php?rest_route=%2F&_fields=foo%2Cbar',
			},
			() => {}
		);

		expect( response ).toEqual( body );
	} );

	it( 'should remove OPTIONS type requests from the cache after the first hit', async () => {
		const body = { content: 'example' };
		const preloadedData = {
			OPTIONS: {
				'wp/v2/demo': { body },
			},
		};

		const preloadingMiddleware =
			createPreloadingMiddleware( preloadedData );

		const requestOptions = {
			method: 'OPTIONS',
			path: 'wp/v2/demo',
		};

		const firstMiddleware = jest.fn();
		preloadingMiddleware( requestOptions, firstMiddleware );
		expect( firstMiddleware ).not.toHaveBeenCalled();

		await preloadingMiddleware( requestOptions, firstMiddleware );

		const secondMiddleware = jest.fn();
		await preloadingMiddleware( requestOptions, secondMiddleware );
		expect( secondMiddleware ).toHaveBeenCalledTimes( 1 );
	} );

	describe.each( [ [ 'GET' ], [ 'OPTIONS' ] ] )( '%s', ( method ) => {
		describe.each( [
			[ 'all empty', {} ],
			[ 'method empty', { [ method ]: {} } ],
		] )( '%s', ( label, preloadedData ) => {
			it( 'should move to the next middleware if no preloaded data', () => {
				const preloadingMiddleware =
					createPreloadingMiddleware( preloadedData );
				const requestOptions = {
					method,
					path: 'wp/v2/posts',
				};

				const callback = ( options ) => {
					expect( options ).toBe( requestOptions );
					return true;
				};

				const ret = preloadingMiddleware( requestOptions, callback );
				expect( ret ).toBe( true );
			} );
		} );
	} );
} );
