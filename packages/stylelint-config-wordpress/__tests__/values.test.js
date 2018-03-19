'use strict';

const fs = require( 'fs' ),
	config = require( '../' ),
	stylelint = require( 'stylelint' ),
	validCss = fs.readFileSync( './__tests__/values-valid.css', 'utf-8' ),
	invalidCss = fs.readFileSync( './__tests__/values-invalid.css', 'utf-8' );

describe( 'flags no warnings with valid values css', () => {
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

describe( 'flags warnings with invalid values css', () => {
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

	it( 'flags warnings', () => {
		return result.then( data => (
			expect( data.results[0].warnings ).toHaveLength( 9 )
		) );
	});

	it( 'correct first warning text', () => {
		return result.then( data => (
			expect( data.results[0].warnings[0].text ).toBe( 'Expected a trailing semicolon (declaration-block-trailing-semicolon)' )
		) );
	});

	it( 'correct first warning rule flagged', () => {
		return result.then( data => (
			expect( data.results[0].warnings[0].rule ).toBe( 'declaration-block-trailing-semicolon' )
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
			expect( data.results[0].warnings[0].column ).toBe( 16 )
		) );
	});

	it( 'correct second warning text', () => {
		return result.then( data => (
			expect( data.results[0].warnings[1].text ).toBe( 'Expected single space after ":" with a single-line declaration (declaration-colon-space-after)' )
		) );
	});

	it( 'correct second warning rule flagged', () => {
		return result.then( data => (
			expect( data.results[0].warnings[1].rule ).toBe( 'declaration-colon-space-after' )
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
			expect( data.results[0].warnings[2].text ).toBe( 'Unexpected unit "em" for property "line-height" (declaration-property-unit-whitelist)' )
		) );
	});

	it( 'correct third warning rule flagged', () => {
		return result.then( data => (
			expect( data.results[0].warnings[2].rule ).toBe( 'declaration-property-unit-whitelist' )
		) );
	});

	it( 'correct third warning severity flagged', () => {
		return result.then( data => (
			expect( data.results[0].warnings[2].severity ).toBe( 'error' )
		) );
	});

	it( 'correct third warning line number', () => {
		return result.then( data => (
			expect( data.results[0].warnings[2].line ).toBe( 12 )
		) );
	});

	it( 'correct third warning column number', () => {
		return result.then( data => (
			expect( data.results[0].warnings[2].column ).toBe( 15 )
		) );
	});

	it( 'correct forth warning text', () => {
		return result.then( data => (
			expect( data.results[0].warnings[3].text ).toBe( 'Expected quotes around "Times New Roman" (font-family-name-quotes)' )
		) );
	});

	it( 'correct forth warning rule flagged', () => {
		return result.then( data => (
			expect( data.results[0].warnings[3].rule ).toBe( 'font-family-name-quotes' )
		) );
	});

	it( 'correct forth warning severity flagged', () => {
		return result.then( data => (
			expect( data.results[0].warnings[3].severity ).toBe( 'error' )
		) );
	});

	it( 'correct forth warning line number', () => {
		return result.then( data => (
			expect( data.results[0].warnings[3].line ).toBe( 10 )
		) );
	});

	it( 'correct forth warning column number', () => {
		return result.then( data => (
			expect( data.results[0].warnings[3].column ).toBe( 15 )
		) );
	});

	it( 'correct fifth warning text', () => {
		return result.then( data => (
			expect( data.results[0].warnings[4].text ).toBe( 'Expected numeric font-weight notation (font-weight-notation)' )
		) );
	});

	it( 'correct fifth warning rule flagged', () => {
		return result.then( data => (
			expect( data.results[0].warnings[4].rule ).toBe( 'font-weight-notation' )
		) );
	});

	it( 'correct fifth warning severity flagged', () => {
		return result.then( data => (
			expect( data.results[0].warnings[4].severity ).toBe( 'error' )
		) );
	});

	it( 'correct fifth warning line number', () => {
		return result.then( data => (
			expect( data.results[0].warnings[4].line ).toBe( 11 )
		) );
	});

	it( 'correct fifth warning column number', () => {
		return result.then( data => (
			expect( data.results[0].warnings[4].column ).toBe( 15 )
		) );
	});

	it( 'correct sixth warning text', () => {
		return result.then( data => (
			expect( data.results[0].warnings[5].text ).toBe( 'Unexpected unit (length-zero-no-unit)' )
		) );
	});

	it( 'correct sixth warning rule flagged', () => {
		return result.then( data => (
			expect( data.results[0].warnings[5].rule ).toBe( 'length-zero-no-unit' )
		) );
	});

	it( 'correct sixth warning severity flagged', () => {
		return result.then( data => (
			expect( data.results[0].warnings[5].severity ).toBe( 'error' )
		) );
	});

	it( 'correct sixth warning line number', () => {
		return result.then( data => (
			expect( data.results[0].warnings[5].line ).toBe( 6 )
		) );
	});

	it( 'correct sixth warning column number', () => {
		return result.then( data => (
			expect( data.results[0].warnings[5].column ).toBe( 11 )
		) );
	});

	it( 'correct seventh warning text', () => {
		return result.then( data => (
			expect( data.results[0].warnings[6].text ).toBe( 'Unexpected unit (length-zero-no-unit)' )
		) );
	});

	it( 'correct seventh warning rule flagged', () => {
		return result.then( data => (
			expect( data.results[0].warnings[6].rule ).toBe( 'length-zero-no-unit' )
		) );
	});

	it( 'correct seventh warning severity flagged', () => {
		return result.then( data => (
			expect( data.results[0].warnings[6].severity ).toBe( 'error' )
		) );
	});

	it( 'correct seventh warning line number', () => {
		return result.then( data => (
			expect( data.results[0].warnings[6].line ).toBe( 6 )
		) );
	});

	it( 'correct seventh warning column number', () => {
		return result.then( data => (
			expect( data.results[0].warnings[6].column ).toBe( 15 )
		) );
	});

	it( 'correct eighth warning text', () => {
		return result.then( data => (
			expect( data.results[0].warnings[7].text ).toBe( 'Unexpected unit (length-zero-no-unit)' )
		) );
	});

	it( 'correct eighth warning rule flagged', () => {
		return result.then( data => (
			expect( data.results[0].warnings[7].rule ).toBe( 'length-zero-no-unit' )
		) );
	});

	it( 'correct eighth warning severity flagged', () => {
		return result.then( data => (
			expect( data.results[0].warnings[7].severity ).toBe( 'error' )
		) );
	});

	it( 'correct eighth warning line number', () => {
		return result.then( data => (
			expect( data.results[0].warnings[7].line ).toBe( 6 )
		) );
	});

	it( 'correct eighth warning column number', () => {
		return result.then( data => (
			expect( data.results[0].warnings[7].column ).toBe( 24 )
		) );
	});

	it( 'correct ninth warning text', () => {
		return result.then( data => (
			expect( data.results[0].warnings[8].text ).toBe( 'Unexpected duplicate selector ".selector", first used at line 1 (no-duplicate-selectors)' )
		) );
	});

	it( 'correct ninth warning rule flagged', () => {
		return result.then( data => (
			expect( data.results[0].warnings[8].rule ).toBe( 'no-duplicate-selectors' )
		) );
	});

	it( 'correct ninth warning severity flagged', () => {
		return result.then( data => (
			expect( data.results[0].warnings[8].severity ).toBe( 'error' )
		) );
	});

	it( 'correct ninth warning line number', () => {
		return result.then( data => (
			expect( data.results[0].warnings[8].line ).toBe( 15 )
		) );
	});

	it( 'correct ninth warning column number', () => {
		return result.then( data => (
			expect( data.results[0].warnings[8].column ).toBe( 1 )
		) );
	});
});
