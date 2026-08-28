import variations from '../variations';

const getVariation = ( name ) =>
	variations.find( ( variation ) => variation.name === name );

describe( 'Gallery layout variations', () => {
	const flexVariation = getVariation( 'gallery-flex' );
	const gridVariation = getVariation( 'gallery-grid' );

	it( 'exposes Flex and Grid only as transforms', () => {
		expect( flexVariation.scope ).toEqual( [ 'transform' ] );
		expect( gridVariation.scope ).toEqual( [ 'transform' ] );
	} );

	it( 'keeps an attribute-less Gallery on the Flex variation', () => {
		expect( flexVariation.isActive( {} ) ).toBe( true );
		expect( gridVariation.isActive( {} ) ).toBe( false );
	} );

	it( 'activates only the Grid variation for a Gallery Grid', () => {
		const attributes = { layout: { type: 'grid' } };

		expect( flexVariation.isActive( attributes ) ).toBe( false );
		expect( gridVariation.isActive( attributes ) ).toBe( true );
	} );
} );
