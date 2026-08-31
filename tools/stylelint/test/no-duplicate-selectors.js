const utils = require( './utils' );
const getStylelintResult = utils.getStylelintResult;

describe( 'flags no warnings when no duplicate selectors are found in scss', () => {
	let result;

	beforeEach( () => {
		result = getStylelintResult( './no-duplicate-selectors-valid.scss' );
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

describe( 'flags warnings when duplicate selectors are found in css', () => {
	let result;

	beforeEach( () => {
		result = getStylelintResult( './no-duplicate-selectors-invalid.css' );
	} );

	it( 'did error', () => {
		return result.then( ( data ) => expect( data.errored ).toBeTruthy() );
	} );

	it( 'flags correct number of warnings', () => {
		return result.then( ( data ) =>
			expect( data.results[ 0 ].warnings ).toHaveLength( 1 )
		);
	} );

	it( 'snapshot matches warnings', () => {
		return result.then( ( data ) =>
			expect( data.results[ 0 ].warnings ).toMatchSnapshot()
		);
	} );
} );
