describe( 'Cover block registration', () => {
	beforeEach( () => {
		jest.resetModules();
		window.__experimentalContentOnlyInspectorFields = true;
	} );

	afterEach( () => {
		delete window.__experimentalContentOnlyInspectorFields;
	} );

	it( 'maps the background field to Cover media attributes in binding-safe order', () => {
		const {
			privateApis: blocksPrivateApis,
		} = require( '@wordpress/blocks' );
		const { unlock } = require( '../../lock-unlock' );
		const { fieldsKey } = unlock( blocksPrivateApis );
		const { settings } = require( '../' );
		const backgroundField = settings[ fieldsKey ].find(
			( field ) => field.id === 'background'
		);

		const attributes = backgroundField.setValue( {
			value: {
				id: 123,
				url: 'https://example.com/image.jpg',
				alt: 'Alt text',
				mediaType: 'image',
				featuredImage: false,
			},
		} );

		expect( Object.keys( attributes ).slice( 0, 2 ) ).toEqual( [
			'url',
			'id',
		] );
		expect( attributes ).toEqual( {
			url: 'https://example.com/image.jpg',
			id: 123,
			alt: 'Alt text',
			backgroundType: 'image',
			useFeaturedImage: false,
		} );
	} );
} );
