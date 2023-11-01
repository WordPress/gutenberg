describe( 'Fetch All Middleware', () => {
	beforeEach( jest.resetModules );

	it( 'should defer with the same options to the next middleware', async () => {
		expect.hasAssertions();
		const originalOptions = { path: '/posts' };
		const next = ( options ) => {
			expect( options ).toBe( originalOptions );
			return Promise.resolve( 'ok' );
		};

		await require( '../fetch-all-middleware' ).default(
			originalOptions,
			next
		);
	} );

	it( 'should paginate the request', async () => {
		expect.hasAssertions();
		const originalOptions = { url: '/posts?per_page=-1' };
		let counter = 1;
		jest.doMock( '../../index.js', () => ( options ) => {
			const expectedUrl =
				counter === 1
					? '/posts?per_page=100'
					: '/posts?per_page=100&page=2';
			expect( options.url ).toBe( expectedUrl );

			const response = Promise.resolve( {
				status: 200,
				headers: {
					get() {
						return options.url === '/posts?per_page=100'
							? '</posts?per_page=100&page=2>; rel="next"'
							: '';
					},
				},
				json() {
					return Promise.resolve( [ 'item' ] );
				},
			} );

			counter++;

			return response;
		} );
		const result = await require( '../fetch-all-middleware' ).default(
			originalOptions,
			() => {}
		);

		expect( result ).toEqual( [ 'item', 'item' ] );
	} );
} );
