describe( 'findTemplate()', () => {
	let fetch;
	beforeAll( () => ( fetch = window.fetch ) );
	afterAll( () => ( window.fetch = fetch ) );

	afterEach( jest.resetModules );

	const createMockFetch = ( response ) =>
		( window.fetch = jest.fn( () =>
			Promise.resolve( {
				json() {
					return Promise.resolve( response );
				},
			} )
		) );

	it( 'Should call fetch with the provided path and resolve the returned ID.', async () => {
		const mockFetch = createMockFetch( { data: { ID: 1 } } );
		expect(
			await require( '../find-template' ).default( '/path?query=true' )
		).toBe( 1 );
		expect( mockFetch ).toHaveBeenCalledWith(
			'/path?query=true&_wp-find-template=true'
		);
	} );

	it( 'Should resolve the ID from the returned post name if not found.', async () => {
		createMockFetch( {
			data: { ID: null, post_name: 'post-name' },
		} );
		const getEntityRecords = jest.fn( () =>
			Promise.resolve( [ { id: 2 } ] )
		);
		expect(
			await require( '../find-template' ).default(
				'/path?query=true',
				getEntityRecords
			)
		).toBe( 2 );
		expect( getEntityRecords ).toHaveBeenCalledWith(
			'postType',
			'wp_template',
			{
				resolved: true,
				slug: 'post-name',
			}
		);
	} );
} );
