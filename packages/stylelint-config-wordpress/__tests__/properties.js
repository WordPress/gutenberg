'use strict';

const fs = require( 'fs' ),
	config = require( '../' ),
	stylelint = require( 'stylelint' ),
	validCss = fs.readFileSync( './__tests__/properties-valid.css', 'utf-8' ),
	invalidCss = fs.readFileSync( './__tests__/properties-invalid.css', 'utf-8' );

describe( 'flags no warnings with valid properties css', () => {
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

describe( 'flags warnings with invalid properties css', () => {
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

	it( 'flags seven warnings', () => {
		return result.then( data => (
			expect( data.results[0].warnings.length ).toBe( 7 )
		) );
	});

	it( 'correct first warning text', () => {
		return result.then( data => (
			expect( data.results[0].warnings[0].text ).toBe( 'Expected "#FFFFFF" to be "#ffffff" (color-hex-case)' )
		) );
	});

	it( 'correct first warning rule flagged', () => {
		return result.then( data => (
			expect( data.results[0].warnings[0].rule ).toBe( 'color-hex-case' )
		) );
	});

	it( 'correct first warning severity flagged', () => {
		return result.then( data => (
			expect( data.results[0].warnings[0].severity ).toBe( 'error' )
		) );
	});

	it( 'correct first warning line number', () => {
		return result.then( data => (
			expect( data.results[0].warnings[0].line ).toBe( 2 )
		) );
	});

	it( 'correct first warning column number', () => {
		return result.then( data => (
			expect( data.results[0].warnings[0].column ).toBe( 13 )
		) );
	});

	it( 'correct second warning text', () => {
		return result.then( data => (
			expect( data.results[0].warnings[1].text ).toBe( 'Expected "#FFFFFF" to be "#FFF" (color-hex-length)' )
		) );
	});

	it( 'correct second warning rule flagged', () => {
		return result.then( data => (
			expect( data.results[0].warnings[1].rule ).toBe( 'color-hex-length' )
		) );
	});

	it( 'correct second warning severity flagged', () => {
		return result.then( data => (
			expect( data.results[0].warnings[1].severity ).toBe( 'error' )
		) );
	});

	it( 'correct second warning line number', () => {
		return result.then( data => (
			expect( data.results[0].warnings[1].line ).toBe( 2 )
		) );
	});

	it( 'correct second warning column number', () => {
		return result.then( data => (
			expect( data.results[0].warnings[1].column ).toBe( 13 )
		) );
	});

	it( 'correct third warning text', () => {
		return result.then( data => (
			expect( data.results[0].warnings[2].text ).toBe( 'Unexpected shorthand "margin" after "margin-left" (declaration-block-no-shorthand-property-overrides)' )
		) );
	});

	it( 'correct third warning rule flagged', () => {
		return result.then( data => (
			expect( data.results[0].warnings[2].rule ).toBe( 'declaration-block-no-shorthand-property-overrides' )
		) );
	});

	it( 'correct third warning severity flagged', () => {
		return result.then( data => (
			expect( data.results[0].warnings[2].severity ).toBe( 'error' )
		) );
	});

	it( 'correct third warning line number', () => {
		return result.then( data => (
			expect( data.results[0].warnings[2].line ).toBe( 5 )
		) );
	});

	it( 'correct third warning column number', () => {
		return result.then( data => (
			expect( data.results[0].warnings[2].column ).toBe( 2 )
		) );
	});

	it( 'correct forth warning text', () => {
		return result.then( data => (
			expect( data.results[0].warnings[3].text ).toBe( 'Expected single space after ":" with a single-line declaration (declaration-colon-space-after)' )
		) );
	});

	it( 'correct forth warning rule flagged', () => {
		return result.then( data => (
			expect( data.results[0].warnings[3].rule ).toBe( 'declaration-colon-space-after' )
		) );
	});

	it( 'correct forth warning severity flagged', () => {
		return result.then( data => (
			expect( data.results[0].warnings[3].severity ).toBe( 'error' )
		) );
	});

	it( 'correct forth warning line number', () => {
		return result.then( data => (
			expect( data.results[0].warnings[3].line ).toBe( 2 )
		) );
	});

	it( 'correct forth warning column number', () => {
		return result.then( data => (
			expect( data.results[0].warnings[3].column ).toBe( 13 )
		) );
	});

	it( 'correct fifth warning text', () => {
		return result.then( data => (
			expect( data.results[0].warnings[4].text ).toBe( 'Unexpected unknown property "argin" (property-no-unknown)' )
		) );
	});

	it( 'correct fifth warning rule flagged', () => {
		return result.then( data => (
			expect( data.results[0].warnings[4].rule ).toBe( 'property-no-unknown' )
		) );
	});

	it( 'correct fifth warning severity flagged', () => {
		return result.then( data => (
			expect( data.results[0].warnings[4].severity ).toBe( 'error' )
		) );
	});

	it( 'correct fifth warning line number', () => {
		return result.then( data => (
			expect( data.results[0].warnings[4].line ).toBe( 6 )
		) );
	});

	it( 'correct fifth warning column number', () => {
		return result.then( data => (
			expect( data.results[0].warnings[4].column ).toBe( 2 )
		) );
	});

	it( 'correct sixth warning text', () => {
		return result.then( data => (
			expect( data.results[0].warnings[5].text ).toBe( 'Expected "PX" to be "px" (unit-case)' )
		) );
	});

	it( 'correct sixth warning rule flagged', () => {
		return result.then( data => (
			expect( data.results[0].warnings[5].rule ).toBe( 'unit-case' )
		) );
	});

	it( 'correct sixth warning severity flagged', () => {
		return result.then( data => (
			expect( data.results[0].warnings[5].severity ).toBe( 'error' )
		) );
	});

	it( 'correct sixth warning line number', () => {
		return result.then( data => (
			expect( data.results[0].warnings[5].line ).toBe( 4 )
		) );
	});

	it( 'correct sixth warning column number', () => {
		return result.then( data => (
			expect( data.results[0].warnings[5].column ).toBe( 15 )
		) );
	});

	it( 'correct seventh warning text', () => {
		return result.then( data => (
			expect( data.results[0].warnings[6].text ).toBe( 'Expected "BLOCK" to be "block" (value-keyword-case)' )
		) );
	});

	it( 'correct seventh warning rule flagged', () => {
		return result.then( data => (
			expect( data.results[0].warnings[6].rule ).toBe( 'value-keyword-case' )
		) );
	});

	it( 'correct seventh warning severity flagged', () => {
		return result.then( data => (
			expect( data.results[0].warnings[6].severity ).toBe( 'error' )
		) );
	});

	it( 'correct seventh warning line number', () => {
		return result.then( data => (
			expect( data.results[0].warnings[6].line ).toBe( 3 )
		) );
	});

	it( 'correct seventh warning column number', () => {
		return result.then( data => (
			expect( data.results[0].warnings[6].column ).toBe( 11 )
		) );
	});
});
