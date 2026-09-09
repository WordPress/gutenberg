import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
const require = createRequire( import.meta.url );
const { svgToTsx } = require( '../generate-library.cjs' );

describe( 'svgToTsx style attribute conversion', () => {
	it( 'converts a double-quoted fill-none inline style into a JSX style object', () => {
		const tsx = svgToTsx(
			'<svg style="fill: none"><path d="M0 0" /></svg>'
		);

		expect( tsx ).toContain( 'style={ { fill: "none" } }' );
	} );

	it( 'converts a single-quoted fill-none inline style into a JSX style object', () => {
		const tsx = svgToTsx(
			"<svg style='fill: none'><path d='M0 0' /></svg>"
		);

		expect( tsx ).toContain( 'style={ { fill: "none" } }' );
	} );

	it( 'leaves style-like text content unchanged', () => {
		const tsx = svgToTsx( '<svg><text> style="fill: none"</text></svg>' );

		expect( tsx ).toContain( '<text> style="fill: none"</text>' );
	} );

	it( 'converts inline styles on non-primitive SVG elements', () => {
		const tsx = svgToTsx(
			'<svg><text style="fill: none">Example</text></svg>'
		);

		expect( tsx ).toContain(
			'<text style={ { fill: "none" } }>Example</text>'
		);
	} );

	it( 'rejects unsupported inline styles', () => {
		expect( () =>
			svgToTsx( '<svg style="fill: red"><path d="M0 0" /></svg>' )
		).toThrow(
			'Unsupported inline SVG style: "fill: red". Only "fill: none" is supported.'
		);
	} );
} );
