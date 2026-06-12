/**
 * Internal dependencies
 */
const {
	parseStyleDeclarations,
	svgToTsx,
} = require( '../generate-library.cjs' );

describe( 'parseStyleDeclarations', () => {
	it( 'parses a simple declaration list into tuples', () => {
		expect( parseStyleDeclarations( 'fill: none; opacity: 0.25' ) ).toEqual(
			[
				[ 'fill', 'none' ],
				[ 'opacity', '0.25' ],
			]
		);
	} );

	it( 'does not split on semicolons inside an unquoted url() value', () => {
		expect(
			parseStyleDeclarations(
				'background: url(data:image/png;base64,iVBOR;more); opacity: .5'
			)
		).toEqual( [
			[ 'background', 'url(data:image/png;base64,iVBOR;more)' ],
			[ 'opacity', '.5' ],
		] );
	} );

	it( 'does not split on semicolons inside a quoted url() value', () => {
		expect(
			parseStyleDeclarations(
				'background: url("data:image/svg+xml;base64,AA=="); fill: none'
			)
		).toEqual( [
			[ 'background', 'url("data:image/svg+xml;base64,AA==")' ],
			[ 'fill', 'none' ],
		] );
	} );

	it( 'does not split on semicolons inside a quoted string value', () => {
		expect( parseStyleDeclarations( 'content: "a;b"; fill: red' ) ).toEqual(
			[
				[ 'content', '"a;b"' ],
				[ 'fill', 'red' ],
			]
		);
	} );

	it( 'respects escaped quotes within a quoted value', () => {
		expect(
			parseStyleDeclarations( 'content: "a\\";b"; fill: red' )
		).toEqual( [
			[ 'content', '"a\\";b"' ],
			[ 'fill', 'red' ],
		] );
	} );

	it( 'only splits the key/value on the first un-quoted colon', () => {
		// Colons in values (e.g. `data:` URI) stay in the value.
		expect(
			parseStyleDeclarations(
				'background: url(data:image/png;base64,AA==)'
			)
		).toEqual( [ [ 'background', 'url(data:image/png;base64,AA==)' ] ] );
	} );

	it( 'does not split on colons inside parentheses', () => {
		expect(
			parseStyleDeclarations(
				'background: linear-gradient(red, blue); fill: green'
			)
		).toEqual( [
			[ 'background', 'linear-gradient(red, blue)' ],
			[ 'fill', 'green' ],
		] );
	} );

	it( 'does not split on colons inside quoted strings', () => {
		expect(
			parseStyleDeclarations( 'content: "key:value"; fill: red' )
		).toEqual( [
			[ 'content', '"key:value"' ],
			[ 'fill', 'red' ],
		] );
	} );

	it( 'drops malformed declarations that have no colon', () => {
		expect( parseStyleDeclarations( '; fill: none ;' ) ).toEqual( [
			[ 'fill', 'none' ],
		] );
	} );

	it( 'drops declarations with an empty key', () => {
		expect( parseStyleDeclarations( ': value; fill: red' ) ).toEqual( [
			[ 'fill', 'red' ],
		] );
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
