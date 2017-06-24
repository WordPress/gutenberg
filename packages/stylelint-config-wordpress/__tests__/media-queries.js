'use strict';

const fs = require( 'fs' ),
	config = require( '../' ),
	stylelint = require( 'stylelint' ),
	validCss = fs.readFileSync( './__tests__/media-queries-valid.css', 'utf-8' ),
	invalidCss = fs.readFileSync( './__tests__/media-queries-invalid.css', 'utf-8' );

describe( 'flags no warnings with valid media queries css', () => {
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

describe( 'flags warnings with invalid media queries css', () => {
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

	it( 'flags ten warnings', () => {
		return result.then( data => (
      expect( data.results[0].warnings.length ).toBe( 10 )
    ) );
	});

	it( 'correct first warning text', () => {
		return result.then( data => (
      expect( data.results[0].warnings[0].text ).toBe( 'Unexpected unknown at-rule "@mdia" (at-rule-no-unknown)' )
    ) );
	});

	it( 'correct first warning rule flagged', () => {
		return result.then( data => (
      expect( data.results[0].warnings[0].rule ).toBe( 'at-rule-no-unknown' )
    ) );
	});

	it( 'correct first warning severity flagged', () => {
		return result.then( data => (
      expect( data.results[0].warnings[0].severity ).toBe( 'error' )
    ) );
	});

	it( 'correct first warning line number', () => {
		return result.then( data => (
      expect( data.results[0].warnings[0].line ).toBe( 31 )
    ) );
	});

	it( 'correct first warning column number', () => {
		return result.then( data => (
      expect( data.results[0].warnings[0].column ).toBe( 1 )
    ) );
	});

	it( 'correct second warning text', () => {
		return result.then( data => (
      expect( data.results[0].warnings[1].text ).toBe( 'Expected single space after ":" (media-feature-colon-space-after)' )
    ) );
	});

	it( 'correct second warning rule flagged', () => {
		return result.then( data => (
      expect( data.results[0].warnings[1].rule ).toBe( 'media-feature-colon-space-after' )
    ) );
	});

	it( 'correct second warning severity flagged', () => {
		return result.then( data => (
      expect( data.results[0].warnings[1].severity ).toBe( 'error' )
    ) );
	});

	it( 'correct second warning line number', () => {
		return result.then( data => (
      expect( data.results[0].warnings[1].line ).toBe( 1 )
    ) );
	});

	it( 'correct second warning column number', () => {
		return result.then( data => (
      expect( data.results[0].warnings[1].column ).toBe( 26 )
    ) );
	});

	it( 'correct third warning text', () => {
		return result.then( data => (
      expect( data.results[0].warnings[2].text ).toBe( 'Expected single space after ":" (media-feature-colon-space-after)' )
    ) );
	});

	it( 'correct third warning rule flagged', () => {
		return result.then( data => (
      expect( data.results[0].warnings[2].rule ).toBe( 'media-feature-colon-space-after' )
    ) );
	});

	it( 'correct third warning severity flagged', () => {
		return result.then( data => (
      expect( data.results[0].warnings[2].severity ).toBe( 'error' )
    ) );
	});

	it( 'correct third warning line number', () => {
		return result.then( data => (
      expect( data.results[0].warnings[2].line ).toBe( 6 )
    ) );
	});

	it( 'correct third warning column number', () => {
		return result.then( data => (
      expect( data.results[0].warnings[2].column ).toBe( 27 )
    ) );
	});

	it( 'correct forth warning text', () => {
		return result.then( data => (
      expect( data.results[0].warnings[3].text ).toBe( 'Unexpected whitespace before ":" (media-feature-colon-space-before)' )
    ) );
	});

	it( 'correct forth warning rule flagged', () => {
		return result.then( data => (
      expect( data.results[0].warnings[3].rule ).toBe( 'media-feature-colon-space-before' )
    ) );
	});

	it( 'correct forth warning severity flagged', () => {
		return result.then( data => (
      expect( data.results[0].warnings[3].severity ).toBe( 'error' )
    ) );
	});

	it( 'correct forth warning line number', () => {
		return result.then( data => (
      expect( data.results[0].warnings[3].line ).toBe( 6 )
    ) );
	});

	it( 'correct forth warning column number', () => {
		return result.then( data => (
      expect( data.results[0].warnings[3].column ).toBe( 27 )
    ) );
	});

	it( 'correct fifth warning text', () => {
		return result.then( data => (
      expect( data.results[0].warnings[4].text ).toBe( 'Expected single space after range operator (media-feature-range-operator-space-after)' )
    ) );
	});

	it( 'correct fifth warning rule flagged', () => {
		return result.then( data => (
      expect( data.results[0].warnings[4].rule ).toBe( 'media-feature-range-operator-space-after' )
    ) );
	});

	it( 'correct fifth warning severity flagged', () => {
		return result.then( data => (
      expect( data.results[0].warnings[4].severity ).toBe( 'error' )
    ) );
	});

	it( 'correct fifth warning line number', () => {
		return result.then( data => (
      expect( data.results[0].warnings[4].line ).toBe( 16 )
    ) );
	});

	it( 'correct fifth warning column number', () => {
		return result.then( data => (
      expect( data.results[0].warnings[4].column ).toBe( 28 )
    ) );
	});

	it( 'correct sixth warning text', () => {
		return result.then( data => (
      expect( data.results[0].warnings[5].text ).toBe( 'Expected single space after range operator (media-feature-range-operator-space-after)' )
    ) );
	});

	it( 'correct sixth warning rule flagged', () => {
		return result.then( data => (
      expect( data.results[0].warnings[5].rule ).toBe( 'media-feature-range-operator-space-after' )
    ) );
	});

	it( 'correct sixth warning severity flagged', () => {
		return result.then( data => (
      expect( data.results[0].warnings[5].severity ).toBe( 'error' )
    ) );
	});

	it( 'correct sixth warning line number', () => {
		return result.then( data => (
      expect( data.results[0].warnings[5].line ).toBe( 21 )
    ) );
	});

	it( 'correct sixth warning column number', () => {
		return result.then( data => (
      expect( data.results[0].warnings[5].column ).toBe( 29 )
    ) );
	});

	it( 'correct seventh warning text', () => {
		return result.then( data => (
      expect( data.results[0].warnings[6].text ).toBe( 'Expected single space before range operator (media-feature-range-operator-space-before)' )
    ) );
	});

	it( 'correct seventh warning rule flagged', () => {
		return result.then( data => (
      expect( data.results[0].warnings[6].rule ).toBe( 'media-feature-range-operator-space-before' )
    ) );
	});

	it( 'correct seventh warning severity flagged', () => {
		return result.then( data => (
      expect( data.results[0].warnings[6].severity ).toBe( 'error' )
    ) );
	});

	it( 'correct seventh warning line number', () => {
		return result.then( data => (
      expect( data.results[0].warnings[6].line ).toBe( 16 )
    ) );
	});

	it( 'correct seventh warning column number', () => {
		return result.then( data => (
      expect( data.results[0].warnings[6].column ).toBe( 25 )
    ) );
	});

	it( 'correct eighth warning text', () => {
		return result.then( data => (
      expect( data.results[0].warnings[7].text ).toBe( 'Expected single space before range operator (media-feature-range-operator-space-before)' )
    ) );
	});

	it( 'correct eighth warning rule flagged', () => {
		return result.then( data => (
      expect( data.results[0].warnings[7].rule ).toBe( 'media-feature-range-operator-space-before' )
    ) );
	});

	it( 'correct eighth warning severity flagged', () => {
		return result.then( data => (
      expect( data.results[0].warnings[7].severity ).toBe( 'error' )
    ) );
	});

	it( 'correct eighth warning line number', () => {
		return result.then( data => (
      expect( data.results[0].warnings[7].line ).toBe( 26 )
    ) );
	});

	it( 'correct eighth warning column number', () => {
		return result.then( data => (
      expect( data.results[0].warnings[7].column ).toBe( 25 )
    ) );
	});

	it( 'correct ninth warning text', () => {
		return result.then( data => (
      expect( data.results[0].warnings[8].text ).toBe( 'Unexpected whitespace before "," (media-query-list-comma-space-before)' )
    ) );
	});

	it( 'correct ninth warning rule flagged', () => {
		return result.then( data => (
      expect( data.results[0].warnings[8].rule ).toBe( 'media-query-list-comma-space-before' )
    ) );
	});

	it( 'correct ninth warning severity flagged', () => {
		return result.then( data => (
      expect( data.results[0].warnings[8].severity ).toBe( 'error' )
    ) );
	});

	it( 'correct ninth warning line number', () => {
		return result.then( data => (
      expect( data.results[0].warnings[8].line ).toBe( 36 )
    ) );
	});

	it( 'correct ninth warning column number', () => {
		return result.then( data => (
      expect( data.results[0].warnings[8].column ).toBe( 27 )
    ) );
	});

	it( 'correct tenth warning text', () => {
		return result.then( data => (
      expect( data.results[0].warnings[9].text ).toBe( 'Unexpected whitespace before "," (media-query-list-comma-space-before)' )
    ) );
	});

	it( 'correct tenth warning rule flagged', () => {
		return result.then( data => (
      expect( data.results[0].warnings[9].rule ).toBe( 'media-query-list-comma-space-before' )
    ) );
	});

	it( 'correct tenth warning severity flagged', () => {
		return result.then( data => (
      expect( data.results[0].warnings[9].severity ).toBe( 'error' )
    ) );
	});

	it( 'correct tenth warning line number', () => {
		return result.then( data => (
      expect( data.results[0].warnings[9].line ).toBe( 38 )
    ) );
	});

	it( 'correct tenth warning column number', () => {
		return result.then( data => (
      expect( data.results[0].warnings[9].column ).toBe( 27 )
    ) );
	});
});
