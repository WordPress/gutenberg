/**
 * External dependencies
 */
const fs = require( 'fs' ),
	stylelint = require( 'stylelint' );

/**
 * Internal dependencies
 */
const config = require( '../scss' ),
	validScss = fs.readFileSync(
		'./packages/stylelint-config/test/selectors-valid.scss',
		'utf-8'
	),
	invalidScss = fs.readFileSync(
		'./packages/stylelint-config/test/selectors-invalid.scss',
		'utf-8'
	);

describe( 'flags no warnings with valid selectors scss', () => {
	let result;

	beforeEach( () => {
		result = stylelint.lint( {
			code: validScss,
			config,
		} );
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
		result = stylelint.lint( {
			code: invalidScss,
			config,
		} );
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
