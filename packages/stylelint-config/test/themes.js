/**
 * Internal dependencies
 */
const utils = require( './utils' );
const getStylelintResult = utils.getStylelintResult;

describe( 'flags no warnings with valid css', () => {
	let result;

	beforeEach( () => {
		result = getStylelintResult( './themes-valid.css' );
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
