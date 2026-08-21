const { svgToTsx } = require( '../generate-library.cjs' );

describe( 'svgToTsx style attribute conversion', () => {
	it( 'converts a fill-none inline style into a JSX style object', () => {
		const tsx = svgToTsx(
			'<svg style="fill: none"><path d="M0 0" /></svg>'
		);

		expect( tsx ).toContain( 'style={ { fill: "none" } }' );
	} );

	it( 'rejects unsupported inline styles', () => {
		expect( () =>
			svgToTsx( '<svg style="fill: red"><path d="M0 0" /></svg>' )
		).toThrow(
			'Unsupported inline SVG style: "fill: red". Only "fill: none" is supported.'
		);
	} );
} );
