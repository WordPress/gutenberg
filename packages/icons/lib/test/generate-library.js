/**
 * Internal dependencies
 */
const {
	splitStyleDeclarations,
	svgToTsx,
} = require( '../generate-library.cjs' );

describe( 'splitStyleDeclarations', () => {
	it( 'splits a simple declaration list on semicolons', () => {
		expect(
			splitStyleDeclarations( 'fill: none; opacity: 0.25' ).map( ( d ) =>
				d.trim()
			)
		).toEqual( [ 'fill: none', 'opacity: 0.25' ] );
	} );

	it( 'does not split on semicolons inside an unquoted url() value', () => {
		expect(
			splitStyleDeclarations(
				'background: url(data:image/png;base64,iVBOR;more); opacity: .5'
			).map( ( d ) => d.trim() )
		).toEqual( [
			'background: url(data:image/png;base64,iVBOR;more)',
			'opacity: .5',
		] );
	} );

	it( 'does not split on semicolons inside a quoted url() value', () => {
		expect(
			splitStyleDeclarations(
				'background: url("data:image/svg+xml;base64,AA=="); fill: none'
			).map( ( d ) => d.trim() )
		).toEqual( [
			'background: url("data:image/svg+xml;base64,AA==")',
			'fill: none',
		] );
	} );

	it( 'does not split on semicolons inside a quoted string value', () => {
		expect(
			splitStyleDeclarations( 'content: "a;b"; fill: red' ).map( ( d ) =>
				d.trim()
			)
		).toEqual( [ 'content: "a;b"', 'fill: red' ] );
	} );

	it( 'respects escaped quotes within a quoted value', () => {
		expect(
			splitStyleDeclarations( 'content: "a\\";b"; fill: red' ).map(
				( d ) => d.trim()
			)
		).toEqual( [ 'content: "a\\";b"', 'fill: red' ] );
	} );
} );

describe( 'svgToTsx style attribute conversion', () => {
	it( 'converts a CSS-string style attribute into a JSX style object', () => {
		const tsx = svgToTsx(
			'<svg style="fill: none"><path d="M0 0" /></svg>'
		);

		expect( tsx ).toContain( 'style={ { fill: "none" } }' );
	} );

	it( 'camel-cases multi-word properties and keeps multiple declarations', () => {
		const tsx = svgToTsx(
			'<svg style="fill: none; stroke-width: 1.5"><path d="M0 0" /></svg>'
		);

		expect( tsx ).toContain(
			'style={ { fill: "none", strokeWidth: "1.5" } }'
		);
	} );

	it( 'skips malformed declarations that have no colon', () => {
		const tsx = svgToTsx(
			'<svg style="; fill: none ;"><path d="M0 0" /></svg>'
		);

		expect( tsx ).toContain( 'style={ { fill: "none" } }' );
	} );

	it( 'preserves a semicolon-bearing data URI value intact', () => {
		const tsx = svgToTsx(
			'<svg style="background: url(data:image/png;base64,AA==); fill: none"><path d="M0 0" /></svg>'
		);

		expect( tsx ).toContain(
			'background: "url(data:image/png;base64,AA==)"'
		);
		expect( tsx ).toContain( 'fill: "none"' );
	} );
} );
