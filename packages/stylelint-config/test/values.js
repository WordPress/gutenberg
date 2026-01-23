/**
 * Internal dependencies
 */
const utils = require( './utils' );
const getStylelintResult = utils.getStylelintResult;

describe( 'flags no warnings with valid values css', () => {
	let result;

	beforeEach( () => {
		result = getStylelintResult( './values-valid.css' );
	} );

	it( 'did not error', () => {
		return result.then( ( data ) => expect( data.errored ).toBeFalsy() );
	} );

	it( 'flags no warnings', () => {
		return result.then( ( data ) =>
			expect( data.results[ 0 ].warnings ).toHaveLength( 0 )
		);
	} );
} );

describe( 'flags warnings with invalid values css', () => {
	let result;

	beforeEach( () => {
		result = getStylelintResult( './values-invalid.css' );
	} );

	it( 'did error', () => {
		return result.then( ( data ) => expect( data.errored ).toBeTruthy() );
	} );

	it( 'flags correct number of warnings', () => {
		return result.then( ( data ) =>
			expect( data.results[ 0 ].warnings ).toHaveLength( 9 )
		);
	} );

	it( 'snapshot matches warnings', () => {
		return result.then( ( data ) =>
			expect( data.results[ 0 ].warnings ).toMatchSnapshot()
		);
	} );
} );
