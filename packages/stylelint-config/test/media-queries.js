/**
 * External dependencies
 */
const fs = require( 'fs' ),
	stylelint = require( 'stylelint' );

/**
 * Internal dependencies
 */
const config = require( '../' ),
	validCss = fs.readFileSync(
		'./packages/stylelint-config/test/media-queries-valid.css',
		'utf-8'
	),
	invalidCss = fs.readFileSync(
		'./packages/stylelint-config/test/media-queries-invalid.css',
		'utf-8'
	);

describe( 'flags no warnings with valid media queries css', () => {
	let result;

	beforeEach( () => {
		result = stylelint.lint( {
			code: validCss,
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

describe( 'flags warnings with invalid media queries css', () => {
	let result;

	beforeEach( () => {
		result = stylelint.lint( {
			code: invalidCss,
			config,
		} );
	} );

	it( 'did error', () => {
		return result.then( ( data ) => expect( data.errored ).toBeTruthy() );
	} );

	it( 'flags correct number of warnings', () => {
		return result.then( ( data ) =>
			expect( data.results[ 0 ].warnings ).toHaveLength( 11 )
		);
	} );

	it( 'snapshot matches warnings', () => {
		return result.then( ( data ) =>
			expect( data.results[ 0 ].warnings ).toMatchSnapshot()
		);
	} );
} );
