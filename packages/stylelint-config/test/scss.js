/**
 * External dependencies
 */
const fs = require( 'fs' ),
	stylelint = require( 'stylelint' ),
	{ resolve } = require( 'path' );

/**
 * Internal dependencies
 */
const config = require( '../scss' ),
	validScss = fs.readFileSync(
		'./packages/stylelint-config/test/scss-valid.scss',
		'utf-8'
	),
	invalidScss = fs.readFileSync(
		'./packages/stylelint-config/test/scss-invalid.scss',
		'utf-8'
	);

describe( 'flags no warnings with valid scss', () => {
	let result;

	beforeEach( () => {
		result = stylelint.lint( {
			code: validScss,
			configBasedir: resolve( __dirname, '..' ),
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

describe( 'flags warnings with invalid scss', () => {
	let result;

	beforeEach( () => {
		result = stylelint.lint( {
			code: invalidScss,
			configBasedir: resolve( __dirname, '..' ),
			config,
		} );
	} );

	it( 'did error', () => {
		return result.then( ( data ) => expect( data.errored ).toBeTruthy() );
	} );

	it( 'flags correct number of warnings', () => {
		return result.then( ( data ) =>
			expect( data.results[ 0 ].warnings ).toHaveLength( 8 )
		);
	} );

	it( 'snapshot matches warnings', () => {
		return result.then( ( data ) =>
			expect( data.results[ 0 ].warnings ).toMatchSnapshot()
		);
	} );
} );
