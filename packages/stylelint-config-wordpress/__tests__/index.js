'use strict';

const fs = require( 'fs' ),
	config = require( '../' ),
	stylelint = require( 'stylelint' ),
	validCss = fs.readFileSync( './__tests__/css-valid.css', 'utf-8' ),
	invalidCss = fs.readFileSync( './__tests__/css-invalid.css', 'utf-8' );

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
			expect( data.results[0].warnings ).toHaveLength( 0 )
		) );
	});
});

describe( 'flags warnings with invalid css', () => {
	let result;

	beforeEach( () => {
		result = stylelint.lint({
			code: invalidCss,
			config,
		});
	});

	it( 'did error', () => {
		return result.then( data => (
			expect( data.errored ).toBeTruthy()
		) );
	});

	it( 'flags one warning', () => {
		return result.then( data => (
			expect( data.results[0].warnings ).toHaveLength( 1 )
		) );
	});

	it( 'correct warning text', () => {
		return result.then( data => (
			expect( data.results[0].warnings[0].text ).toBe( 'Expected a leading zero (number-leading-zero)' )
		) );
	});

	it( 'correct rule flagged', () => {
		return result.then( data => (
			expect( data.results[0].warnings[0].rule ).toBe( 'number-leading-zero' )
		) );
	});

	it( 'correct severity flagged', () => {
		return result.then( data => (
			expect( data.results[0].warnings[0].severity ).toBe( 'error' )
		) );
	});

	it( 'correct line number', () => {
		return result.then( data => (
			expect( data.results[0].warnings[0].line ).toBe( 2 )
		) );
	});

	it( 'correct column number', () => {
		return result.then( data => (
			expect( data.results[0].warnings[0].column ).toBe( 7 )
		) );
	});
});
