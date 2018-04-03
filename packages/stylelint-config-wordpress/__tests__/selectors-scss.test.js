'use strict';

const fs = require( 'fs' ),
	config = require( '../scss.js' ),
	stylelint = require( 'stylelint' ),
	validScss = fs.readFileSync( './__tests__/selectors-valid.scss', 'utf-8' ),
	invalidScss = fs.readFileSync( './__tests__/selectors-invalid.scss', 'utf-8' );

describe( 'flags no warnings with valid selectors scss', () => {
	let result;

	beforeEach( () => {
		result = stylelint.lint({
			code: validScss,
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

describe( 'flags warnings with invalid selectors scss', () => {
	let result;

	beforeEach( () => {
		result = stylelint.lint({
			code: invalidScss,
			config,
		});
	});

	it( 'did error', () => {
		return result.then( data => (
			expect( data.errored ).toBeTruthy()
		) );
	});

	it( 'flags correct number of warnings', () => {
		return result.then( data => (
			expect( data.results[0].warnings ).toHaveLength( 6 )
		) );
	});

	it( 'correct first warning text', () => {
		return result.then( data => (
			expect( data.results[0].warnings[0].text ).toBe( 'Unnecessary nesting selector (&) (scss/selector-no-redundant-nesting-selector)' )
		) );
	});

	it( 'correct first warning rule flagged', () => {
		return result.then( data => (
			expect( data.results[0].warnings[0].rule ).toBe( 'scss/selector-no-redundant-nesting-selector' )
		) );
	});

	it( 'correct first warning severity flagged', () => {
		return result.then( data => (
			expect( data.results[0].warnings[0].severity ).toBe( 'error' )
		) );
	});

	it( 'correct first warning line number', () => {
		return result.then( data => (
			expect( data.results[0].warnings[0].line ).toBe( 3 )
		) );
	});

	it( 'correct first warning column number', () => {
		return result.then( data => (
			expect( data.results[0].warnings[0].column ).toBe( 2 )
		) );
	});

	it( 'correct second warning text', () => {
		return result.then( data => (
			expect( data.results[0].warnings[1].text ).toBe( 'Unnecessary nesting selector (&) (scss/selector-no-redundant-nesting-selector)' )
		) );
	});

	it( 'correct second warning rule flagged', () => {
		return result.then( data => (
			expect( data.results[0].warnings[1].rule ).toBe( 'scss/selector-no-redundant-nesting-selector' )
		) );
	});

	it( 'correct second warning severity flagged', () => {
		return result.then( data => (
			expect( data.results[0].warnings[1].severity ).toBe( 'error' )
		) );
	});

	it( 'correct second warning line number', () => {
		return result.then( data => (
			expect( data.results[0].warnings[1].line ).toBe( 10 )
		) );
	});

	it( 'correct second warning column number', () => {
		return result.then( data => (
			expect( data.results[0].warnings[1].column ).toBe( 2 )
		) );
	});

	it( 'correct third warning text', () => {
		return result.then( data => (
			expect( data.results[0].warnings[2].text ).toBe( 'Unnecessary nesting selector (&) (scss/selector-no-redundant-nesting-selector)' )
		) );
	});

	it( 'correct third warning rule flagged', () => {
		return result.then( data => (
			expect( data.results[0].warnings[2].rule ).toBe( 'scss/selector-no-redundant-nesting-selector' )
		) );
	});

	it( 'correct third warning severity flagged', () => {
		return result.then( data => (
			expect( data.results[0].warnings[2].severity ).toBe( 'error' )
		) );
	});

	it( 'correct third warning line number', () => {
		return result.then( data => (
			expect( data.results[0].warnings[2].line ).toBe( 17 )
		) );
	});

	it( 'correct third warning column number', () => {
		return result.then( data => (
			expect( data.results[0].warnings[2].column ).toBe( 2 )
		) );
	});

	it( 'correct forth warning text', () => {
		return result.then( data => (
			expect( data.results[0].warnings[3].text ).toBe( 'Unnecessary nesting selector (&) (scss/selector-no-redundant-nesting-selector)' )
		) );
	});

	it( 'correct forth warning rule flagged', () => {
		return result.then( data => (
			expect( data.results[0].warnings[3].rule ).toBe( 'scss/selector-no-redundant-nesting-selector' )
		) );
	});

	it( 'correct forth warning severity flagged', () => {
		return result.then( data => (
			expect( data.results[0].warnings[3].severity ).toBe( 'error' )
		) );
	});

	it( 'correct forth warning line number', () => {
		return result.then( data => (
			expect( data.results[0].warnings[3].line ).toBe( 24 )
		) );
	});

	it( 'correct forth warning column number', () => {
		return result.then( data => (
			expect( data.results[0].warnings[3].column ).toBe( 2 )
		) );
	});
});
