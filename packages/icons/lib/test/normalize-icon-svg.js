import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
const require = createRequire( import.meta.url );
const { normalizeIconSvg } = require( '../normalize-icon-svg.cjs' );

describe( 'normalizeIconSvg', () => {
	// Conversions: each input is rewritten into exactly the expected output.
	it.each( [
		{
			name: 'hoists the stroke paint onto the root',
			input: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n<path d="M5 5H19" stroke="#2D2D2D" stroke-width="1.5"/>\n</svg>',
			output: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="fill: none" stroke="currentColor" stroke-width="1.5">\n\t<path d="M5 5H19" />\n</svg>\n',
		},
		{
			name: 'marks a filled shape inside a stroke-based icon',
			input: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n<rect x="7" y="8" width="3" height="8" fill="black"/>\n<path d="M4 4V20" stroke="black" stroke-width="1.5"/>\n</svg>',
			output: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="fill: none" stroke="currentColor" stroke-width="1.5">\n\t<rect x="7" y="8" width="3" height="8" fill="currentColor" stroke="none" />\n\t<path d="M4 4V20" />\n</svg>\n',
		},
		{
			name: 'lets a fill-based icon inherit the root fill',
			input: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n<path d="M9 12h2v-2z" fill="#000"/>\n</svg>',
			output: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">\n\t<path d="M9 12h2v-2z" />\n</svg>\n',
		},
		{
			name: 'inherits paint the way SVG does',
			input: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">\n<path d="M9 12h2v-2z"/>\n</svg>',
			output: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">\n\t<path d="M9 12h2v-2z" />\n</svg>\n',
		},
		{
			name: 'reads single-quoted attributes',
			input: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n<path d=\'M5 5H19\' stroke=\'#000\' stroke-width=\'1.5\'/>\n</svg>',
			output: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="fill: none" stroke="currentColor" stroke-width="1.5">\n\t<path d="M5 5H19" />\n</svg>\n',
		},
		{
			name: 'drops the XML declaration, comments and metadata',
			input: '<?xml version="1.0" encoding="UTF-8"?>\n<!-- Generator: Sketch -->\n<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n<title>Icon</title>\n<path d="M5 5H19" stroke="#000" stroke-width="1.5"></path>\n</svg>',
			output: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="fill: none" stroke="currentColor" stroke-width="1.5">\n\t<path d="M5 5H19" />\n</svg>\n',
		},
		{
			name: 'drops a redundant inherited stroke',
			input: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="fill: none" stroke="currentColor" stroke-width="1.5">\n\t<rect x="5" y="5" width="14" height="14" stroke="currentColor" />\n</svg>\n',
			output: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="fill: none" stroke="currentColor" stroke-width="1.5">\n\t<rect x="5" y="5" width="14" height="14" />\n</svg>\n',
		},
		{
			name: 'leaves already normalized markup untouched',
			input: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="fill: none" stroke="currentColor" stroke-width="1.5">\n\t<path opacity=".25" d="M5 5H19" stroke-linecap="square" />\n</svg>\n',
			output: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="fill: none" stroke="currentColor" stroke-width="1.5">\n\t<path opacity=".25" d="M5 5H19" stroke-linecap="square" />\n</svg>\n',
		},
		{
			name: 'keeps a stroke on a shape that is both filled and stroked',
			input: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="fill: none" stroke="currentColor" stroke-width="1.5">\n\t<path d="M5 5H19Z" fill="currentColor" stroke-linejoin="round" />\n</svg>\n',
			output: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="fill: none" stroke="currentColor" stroke-width="1.5">\n\t<path d="M5 5H19Z" fill="currentColor" stroke-linejoin="round" />\n</svg>\n',
		},
	] )( '$name', ( { input, output } ) => {
		expect( normalizeIconSvg( input ).content ).toBe( output );
	} );

	// Refusals: each input holds something that cannot be converted without
	// changing how the icon looks, so normalizing throws an error naming it.
	it.each( [
		{
			name: 'a viewBox other than 0 0 24 24',
			input: '<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">\n<path d="M5 5H19" stroke="#000" stroke-width="1.5"/>\n</svg>',
			error: 'viewBox="0 0 32 32"',
		},
		{
			name: 'a missing viewBox',
			input: '<svg fill="none" xmlns="http://www.w3.org/2000/svg">\n<path d="M5 5H19" stroke="#000" stroke-width="1.5"/>\n</svg>',
			error: 'no viewBox',
		},
		{
			name: 'an attribute on the root it cannot carry over',
			input: '<svg viewBox="0 0 24 24" opacity=".5" xmlns="http://www.w3.org/2000/svg">\n<path d="M9 12h2v-2z"/>\n</svg>',
			error: 'opacity on the root',
		},
		{
			name: 'a file with no SVG root',
			input: 'not an svg',
			error: '<svg> root',
		},
		{
			name: 'a clipped frame',
			input: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n<g clip-path="url(#a)"><path d="M5 5H19" stroke="#000" stroke-width="1.5"/></g><defs><clipPath id="a"><rect width="24" height="24" fill="white"/></clipPath></defs>\n</svg>',
			error: '<clipPath>',
		},
		{
			name: 'a group',
			input: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n<g stroke="#000" stroke-width="1.5"><path d="M5 5H19"/></g>\n</svg>',
			error: '<g>',
		},
		{
			name: 'a transform',
			input: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n<rect x="8" y="8" width="8" height="8" transform="rotate(45 12 12)" stroke="#000" stroke-width="1.5"/>\n</svg>',
			error: 'transform',
		},
		{
			name: 'a gradient',
			input: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n<path d="M5 5H19V9Z" fill="url(#g)"/>\n</svg>',
			error: 'url(#g)',
		},
		{
			name: 'more than one color',
			input: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n<path d="M5 5H19V9Z" fill="#000"/><path d="M7 6H9V7Z" fill="white"/>\n</svg>',
			error: 'more than one color',
		},
		{
			name: 'an inline style',
			input: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n<path d="M5 5H19" stroke="#000" stroke-width="1.5" style="opacity: .25"/>\n</svg>',
			error: 'style',
		},
		{
			name: 'a dashed stroke',
			input: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n<path d="M5 5H19" stroke="#000" stroke-width="1.5" stroke-dasharray="3 3"/>\n</svg>',
			error: 'stroke-dasharray',
		},
		{
			name: 'a partial stroke',
			input: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n<path d="M5 5H19" stroke="#000" stroke-width="1.5" stroke-opacity="0.5"/>\n</svg>',
			error: 'stroke-opacity',
		},
		{
			name: 'a stroke width the library does not draw at',
			input: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n<path d="M5 5H19" stroke="#000" stroke-width="1.58333"/>\n</svg>',
			error: 'Scale strokes',
		},
		{
			name: 'an unknown attribute',
			input: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n<path d="M5 5H19" stroke="#000" stroke-width="1.5" filter="url(#f)"/>\n</svg>',
			error: 'filter',
		},
	] )( 'refuses $name', ( { input, error } ) => {
		expect( () => normalizeIconSvg( input ) ).toThrow( error );
	} );

	// Notes: each input is converted, but the change it needed is reported
	// back so it is not made silently.
	it( 'reports a removed vector-effect', () => {
		const { notes } = normalizeIconSvg(
			'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n<path d="M5 5H19" stroke="#000" stroke-width="1.5" vector-effect="non-scaling-stroke"/>\n</svg>'
		);

		expect( notes ).toEqual( [
			'removed vector-effect so the stroke width scales with the icon',
		] );
	} );

	it( 'reports a removed shape that draws nothing', () => {
		const { notes } = normalizeIconSvg(
			'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n<rect width="24" height="24" fill="none"/>\n<path d="M5 5H19" stroke="#000" stroke-width="1.5"/>\n</svg>'
		);

		expect( notes ).toEqual( [ 'removed a shape that draws nothing' ] );
	} );

	it( 'reports a duplicated layer instead of silently removing it', () => {
		const { notes } = normalizeIconSvg(
			'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n<path d="M5 5H19" stroke="#000" stroke-width="1.5"/>\n<path d="M5 5H19" stroke="#000" stroke-width="1.5"/>\n</svg>'
		);

		expect( notes.join( ' ' ) ).toContain( 'duplicate' );
	} );
} );
