'use strict';

const fs = require( 'fs' ),
	config = require( '../' ),
	stylelint = require( 'stylelint' ),
	validCss = fs.readFileSync( './__tests__/structure-valid.css', 'utf-8' ),
	invalidCss = fs.readFileSync( './__tests__/structure-invalid.css', 'utf-8' );

describe( 'flags no warnings with valid structure css', () => {
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

describe( 'flags warnings with invalid structure css', () => {
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

	it( 'flags eight warnings', () => {
		return result.then( data => (
      expect( data.results[0].warnings.length ).toBe( 8 )
    ) );
	});

	it( 'correct first warning text', () => {
		return result.then( data => (
      expect( data.results[0].warnings[0].text ).toBe( 'Expected newline before "}" (block-closing-brace-newline-before)' )
    ) );
	});

	it( 'correct first warning rule flagged', () => {
		return result.then( data => (
      expect( data.results[0].warnings[0].rule ).toBe( 'block-closing-brace-newline-before' )
    ) );
	});

	it( 'correct first warning severity flagged', () => {
		return result.then( data => (
      expect( data.results[0].warnings[0].severity ).toBe( 'error' )
    ) );
	});

	it( 'correct first warning line number', () => {
		return result.then( data => (
      expect( data.results[0].warnings[0].line ).toBe( 7 )
    ) );
	});

	it( 'correct first warning column number', () => {
		return result.then( data => (
      expect( data.results[0].warnings[0].column ).toBe( 45 )
    ) );
	});

	it( 'correct second warning text', () => {
		return result.then( data => (
      expect( data.results[0].warnings[1].text ).toBe( 'Expected newline after "{" (block-opening-brace-newline-after)' )
    ) );
	});

	it( 'correct second warning rule flagged', () => {
		return result.then( data => (
      expect( data.results[0].warnings[1].rule ).toBe( 'block-opening-brace-newline-after' )
    ) );
	});

	it( 'correct second warning severity flagged', () => {
		return result.then( data => (
      expect( data.results[0].warnings[1].severity ).toBe( 'error' )
    ) );
	});

	it( 'correct second warning line number', () => {
		return result.then( data => (
      expect( data.results[0].warnings[1].line ).toBe( 7 )
    ) );
	});

	it( 'correct second warning column number', () => {
		return result.then( data => (
      expect( data.results[0].warnings[1].column ).toBe( 14 )
    ) );
	});

	it( 'correct third warning text', () => {
		return result.then( data => (
      expect( data.results[0].warnings[2].text ).toBe( 'Expected newline after ";" (declaration-block-semicolon-newline-after)' )
    ) );
	});

	it( 'correct third warning rule flagged', () => {
		return result.then( data => (
      expect( data.results[0].warnings[2].rule ).toBe( 'declaration-block-semicolon-newline-after' )
    ) );
	});

	it( 'correct third warning severity flagged', () => {
		return result.then( data => (
      expect( data.results[0].warnings[2].severity ).toBe( 'error' )
    ) );
	});

	it( 'correct third warning line number', () => {
		return result.then( data => (
      expect( data.results[0].warnings[2].line ).toBe( 7 )
    ) );
	});

	it( 'correct third warning column number', () => {
		return result.then( data => (
      expect( data.results[0].warnings[2].column ).toBe( 32 )
    ) );
	});

	it( 'correct forth warning text', () => {
		return result.then( data => (
      expect( data.results[0].warnings[3].text ).toBe( 'Expected indentation of 0 tabs (indentation)' )
    ) );
	});

	it( 'correct forth warning rule flagged', () => {
		return result.then( data => (
      expect( data.results[0].warnings[3].rule ).toBe( 'indentation' )
    ) );
	});

	it( 'correct forth warning severity flagged', () => {
		return result.then( data => (
      expect( data.results[0].warnings[3].severity ).toBe( 'error' )
    ) );
	});

	it( 'correct forth warning line number', () => {
		return result.then( data => (
      expect( data.results[0].warnings[3].line ).toBe( 4 )
    ) );
	});

	it( 'correct forth warning column number', () => {
		return result.then( data => (
      expect( data.results[0].warnings[3].column ).toBe( 3 )
    ) );
	});

	it( 'correct fifth warning text', () => {
		return result.then( data => (
      expect( data.results[0].warnings[4].text ).toBe( 'Expected indentation of 1 tab (indentation)' )
    ) );
	});

	it( 'correct fifth warning rule flagged', () => {
		return result.then( data => (
      expect( data.results[0].warnings[4].rule ).toBe( 'indentation' )
    ) );
	});

	it( 'correct fifth warning severity flagged', () => {
		return result.then( data => (
      expect( data.results[0].warnings[4].severity ).toBe( 'error' )
    ) );
	});

	it( 'correct fifth warning line number', () => {
		return result.then( data => (
      expect( data.results[0].warnings[4].line ).toBe( 2 )
    ) );
	});

	it( 'correct fifth warning column number', () => {
		return result.then( data => (
      expect( data.results[0].warnings[4].column ).toBe( 3 )
    ) );
	});

	it( 'correct sixth warning text', () => {
		return result.then( data => (
      expect( data.results[0].warnings[5].text ).toBe( 'Expected indentation of 1 tab (indentation)' )
    ) );
	});

	it( 'correct sixth warning rule flagged', () => {
		return result.then( data => (
      expect( data.results[0].warnings[5].rule ).toBe( 'indentation' )
    ) );
	});

	it( 'correct sixth warning severity flagged', () => {
		return result.then( data => (
      expect( data.results[0].warnings[5].severity ).toBe( 'error' )
    ) );
	});

	it( 'correct sixth warning line number', () => {
		return result.then( data => (
      expect( data.results[0].warnings[5].line ).toBe( 3 )
    ) );
	});

	it( 'correct sixth warning column number', () => {
		return result.then( data => (
      expect( data.results[0].warnings[5].column ).toBe( 3 )
    ) );
	});

	it( 'correct seventh warning text', () => {
		return result.then( data => (
      expect( data.results[0].warnings[6].text ).toBe( 'Expected newline after "," (selector-list-comma-newline-after)' )
    ) );
	});

	it( 'correct seventh warning rule flagged', () => {
		return result.then( data => (
      expect( data.results[0].warnings[6].rule ).toBe( 'selector-list-comma-newline-after' )
    ) );
	});

	it( 'correct seventh warning severity flagged', () => {
		return result.then( data => (
      expect( data.results[0].warnings[6].severity ).toBe( 'error' )
    ) );
	});

	it( 'correct seventh warning line number', () => {
		return result.then( data => (
      expect( data.results[0].warnings[6].line ).toBe( 1 )
    ) );
	});

	it( 'correct seventh warning column number', () => {
		return result.then( data => (
      expect( data.results[0].warnings[6].column ).toBe( 12 )
    ) );
	});

	it( 'correct eighth warning text', () => {
		return result.then( data => (
      expect( data.results[0].warnings[7].text ).toBe( 'Expected newline after "," (selector-list-comma-newline-after)' )
    ) );
	});

	it( 'correct eighth warning rule flagged', () => {
		return result.then( data => (
      expect( data.results[0].warnings[7].rule ).toBe( 'selector-list-comma-newline-after' )
    ) );
	});

	it( 'correct eighth warning severity flagged', () => {
		return result.then( data => (
      expect( data.results[0].warnings[7].severity ).toBe( 'error' )
    ) );
	});

	it( 'correct eighth warning line number', () => {
		return result.then( data => (
      expect( data.results[0].warnings[7].line ).toBe( 1 )
    ) );
	});

	it( 'correct eighth warning column number', () => {
		return result.then( data => (
      expect( data.results[0].warnings[7].column ).toBe( 25 )
    ) );
	});
});
