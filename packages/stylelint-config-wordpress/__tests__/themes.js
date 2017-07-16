'use strict';

const fs = require( 'fs' ),
	config = require( '../' ),
	stylelint = require( 'stylelint' ),
	validCss = fs.readFileSync( './__tests__/themes-valid.css', 'utf-8' );

describe( 'flags no warnings with valid css', () => {
	let result;

	beforeEach( () => {
		result = stylelint.lint({
			code: validCss,
			config,
		});
	});

	it( 'did not error', () => {
		return result.then( data => (
			expect( data.errored ).toBeFalsy()
		) );
	});

	it( 'flags no warnings', () => {
		return result.then( data => (
			expect( data.results[0].warnings.length ).toBe( 0 )
		) );
	});
});
