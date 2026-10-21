import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
const require = createRequire( import.meta.url );
const { normalizeIconSvg } = require( '../normalize-export.cjs' );

const EXPORT_ROOT =
	'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">';

describe( 'normalizeIconSvg', () => {
	it( 'hoists the stroke paint onto the root so the icon inherits text color', () => {
		const { content } = normalizeIconSvg(
			`${ EXPORT_ROOT }\n<path d="M5 5H19" stroke="#2D2D2D" stroke-width="1.5"/>\n</svg>`
		);

		expect( content ).toBe(
			'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="fill: none" stroke="currentColor" stroke-width="1.5">\n' +
				'\t<path d="M5 5H19" />\n</svg>\n'
		);
	} );

	it( 'marks a filled shape inside a stroke-based icon', () => {
		const { content } = normalizeIconSvg(
			`${ EXPORT_ROOT }\n<rect x="7" y="8" width="3" height="8" fill="black"/>\n<path d="M4 4V20" stroke="black" stroke-width="1.5"/>\n</svg>`
		);

		expect( content ).toContain(
			'<rect x="7" y="8" width="3" height="8" fill="currentColor" stroke="none" />'
		);
	} );

	it( 'lets a fill-based icon inherit the root fill', () => {
		const { content } = normalizeIconSvg(
			`${ EXPORT_ROOT }\n<path d="M9 12h2v-2z" fill="#000"/>\n</svg>`
		);

		expect( content ).toBe(
			'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">\n' +
				'\t<path d="M9 12h2v-2z" />\n</svg>\n'
		);
	} );

	it( 'leaves already normalized markup untouched', () => {
		const normalized =
			'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="fill: none" stroke="currentColor" stroke-width="1.5">\n' +
			'\t<path opacity=".25" d="M5 5H19" stroke-linecap="square" />\n</svg>\n';

		expect( normalizeIconSvg( normalized ).content ).toBe( normalized );
	} );

	it( 'keeps a stroke on a shape that is both filled and stroked', () => {
		const normalized =
			'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="fill: none" stroke="currentColor" stroke-width="1.5">\n' +
			'\t<path d="M5 5H19Z" fill="currentColor" stroke-linejoin="round" />\n</svg>\n';

		expect( normalizeIconSvg( normalized ).content ).toBe( normalized );
	} );

	it( 'removes vector-effect so the stroke width scales with the icon', () => {
		const { content, notes } = normalizeIconSvg(
			`${ EXPORT_ROOT }\n<path d="M5 5H19" stroke="#000" stroke-width="1.5" vector-effect="non-scaling-stroke"/>\n</svg>`
		);

		expect( content ).not.toContain( 'vector-effect' );
		expect( notes ).toHaveLength( 1 );
	} );

	it.each( [
		[ 'a dashed stroke', 'stroke-dasharray="3 3"', 'stroke-dasharray' ],
		[ 'a partial stroke', 'stroke-opacity="0.5"', 'stroke-opacity' ],
		[ 'an inline style', 'style="opacity: .25"', 'style' ],
	] )(
		'refuses %s rather than dropping it',
		( _label, attribute, mentioned ) => {
			expect( () =>
				normalizeIconSvg(
					`${ EXPORT_ROOT }\n<path d="M5 5H19" stroke="#000" stroke-width="1.5" ${ attribute }/>\n</svg>`
				)
			).toThrow( mentioned );
		}
	);

	it( 'refuses a stroke width the library does not draw at', () => {
		expect( () =>
			normalizeIconSvg(
				`${ EXPORT_ROOT }\n<path d="M5 5H19" stroke="#000" stroke-width="1.58333"/>\n</svg>`
			)
		).toThrow( 'Scale strokes' );
	} );

	it( 'reports a duplicated layer instead of silently removing it', () => {
		const { notes } = normalizeIconSvg(
			`${ EXPORT_ROOT }\n<path d="M5 5H19" stroke="#000" stroke-width="1.5"/>\n<path d="M5 5H19" stroke="#000" stroke-width="1.5"/>\n</svg>`
		);

		expect( notes.join( ' ' ) ).toContain( 'duplicate' );
	} );

	it( 'rejects a file with no SVG root', () => {
		expect( () => normalizeIconSvg( 'not an svg' ) ).toThrow(
			'<svg> root'
		);
	} );
} );
