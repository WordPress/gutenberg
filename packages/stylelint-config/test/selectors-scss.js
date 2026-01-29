/**
 * Internal dependencies
 */
const utils = require( './utils' );
const getStylelintResult = utils.getStylelintResult;

describe( 'flags no warnings with valid selectors scss', () => {
	let result;

	beforeEach( () => {
		result = getStylelintResult( './selectors-valid.scss' );
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

describe( 'flags warnings with invalid selectors scss', () => {
	let result;

	beforeEach( () => {
		result = getStylelintResult( './selectors-invalid.scss' );
	} );

	it( 'did error', () => {
		return result.then( ( data ) => expect( data.errored ).toBeTruthy() );
	} );

	it( 'flags correct number of warnings', () => {
		return result.then( ( data ) =>
			expect( data.results[ 0 ].warnings ).toHaveLength( 6 )
		);
	} );

	it( 'snapshot matches warnings', () => {
		return result.then( ( data ) =>
			expect( data.results[ 0 ].warnings ).toMatchSnapshot()
		);
	} );
} );
