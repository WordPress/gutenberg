/**
 * Normalizes a design-tool SVG export into the shape this package expects.
 *
 * Figma (and most editors) export an icon with a `width`/`height` pair, a
 * literal `fill="none"` attribute, and the artboard's color baked into every
 * shape. The library instead hoists the shared paint onto the root so an icon
 * inherits `currentColor`, and `validate-collection.cjs` rejects exports that
 * keep the editor's defaults. This turns the former into the latter.
 *
 * It refuses, rather than quietly rewrites, anything whose meaning it cannot
 * preserve -- a dashed stroke, an inline style, a stroke width that is not the
 * library's 1.5 -- because silently dropping such an attribute changes the
 * drawing while leaving a file that still builds.
 *
 * Usage:
 *   node lib/normalize-export.cjs src/library/my-icon.svg [...more]
 *   node lib/normalize-export.cjs --check src/library/*.svg
 */

const fs = require( 'fs' );

const XMLNS = 'http://www.w3.org/2000/svg';
const STROKE_WIDTH = '1.5';

// Elements the icon build knows how to turn into components.
const GRAPHICAL_ELEMENTS = 'circle|ellipse|line|path|polygon|polyline|rect';

// Attributes that describe geometry rather than paint; they pass through
// untouched, in this order, so the output is stable across runs.
const GEOMETRY_ATTRIBUTES = [
	'd',
	'points',
	'x',
	'y',
	'width',
	'height',
	'rx',
	'ry',
	'cx',
	'cy',
	'r',
	'x1',
	'y1',
	'x2',
	'y2',
];

// Paint attributes that survive `wp_kses` for icons registered in a collection,
// and that the build understands. Anything else has to be baked into the path.
const PRESERVED_PAINT_ATTRIBUTES = [
	'fill-rule',
	'clip-rule',
	'opacity',
	'stroke-linecap',
	'stroke-linejoin',
	'stroke-miterlimit',
];

/**
 * Reads the attributes of an SVG tag into a plain object.
 *
 * @param {string} tag A single `<element ...>` tag.
 * @return {Object<string,string>} Its attributes.
 */
function parseAttributes( tag ) {
	const attributes = {};
	for ( const match of tag.matchAll( /([\w:-]+)="([^"]*)"/g ) ) {
		attributes[ match[ 1 ] ] = match[ 2 ];
	}
	return attributes;
}

/**
 * Explains why an element cannot be normalized, or returns nothing when it can.
 *
 * @param {Object<string,string>} attributes The element's attributes.
 * @return {string[]} Human-readable reasons.
 */
function findUnsupportedAttributes( attributes ) {
	const problems = [];

	if ( attributes.style?.trim() ) {
		problems.push(
			`style="${ attributes.style }" (the build accepts an inline style only on the root, and only \`fill: none\`)`
		);
	}

	const strokeWidth = attributes[ 'stroke-width' ];
	if ( strokeWidth && strokeWidth !== STROKE_WIDTH ) {
		problems.push(
			`stroke-width="${ strokeWidth }" (the library draws at ${ STROKE_WIDTH }; a different value usually means a layer was resized with "Scale strokes" enabled)`
		);
	}

	for ( const name of Object.keys( attributes ) ) {
		const isPaint =
			name.startsWith( 'stroke-' ) ||
			name.startsWith( 'fill-' ) ||
			name === 'opacity';
		const isKnown =
			PRESERVED_PAINT_ATTRIBUTES.includes( name ) ||
			name === 'stroke-width';
		if ( isPaint && ! isKnown ) {
			problems.push(
				`${ name } (not in the icon registry's allowed attributes, so \`wp_kses\` strips it; bake the effect into the path instead)`
			);
		}
	}

	return problems;
}

/**
 * Normalizes one SVG source string.
 *
 * Running it on already-normalized markup returns that markup unchanged.
 *
 * @param {string} source The SVG file contents.
 * @return {{content: string, notes: string[]}} The normalized file and
 *                                              anything worth reporting.
 */
function normalizeIconSvg( source ) {
	const rootTag = source.match( /<svg\b[^>]*>/ )?.[ 0 ];
	if ( ! rootTag ) {
		throw new Error( 'no <svg> root element' );
	}

	const root = parseAttributes( rootTag );
	const viewBox = root.viewBox ?? '0 0 24 24';
	const notes = [];

	// In a raw export, a missing `stroke` means the shape is not stroked. Once
	// the root carries `stroke="currentColor"` the same absence means the shape
	// inherits it, so re-running must not read that as unstroked and drop it.
	const rootIsStroked = root.stroke === 'currentColor';
	const rootIsFilled = root.fill === 'currentColor';

	const elements = [];
	const problems = [];
	const pattern = new RegExp(
		`<(${ GRAPHICAL_ELEMENTS })\\b([^>]*?)/?>`,
		'g'
	);

	for ( const match of source.matchAll( pattern ) ) {
		const [ , name, rawAttributes ] = match;
		const attributes = parseAttributes( rawAttributes );

		const unsupported = findUnsupportedAttributes( attributes );
		if ( unsupported.length ) {
			problems.push( ...unsupported );
			continue;
		}

		if ( 'vector-effect' in attributes ) {
			notes.push(
				'removed vector-effect so the stroke width scales with the icon'
			);
		}

		const { stroke, fill } = attributes;
		const isStroked = rootIsStroked
			? stroke !== 'none'
			: Boolean( stroke ) && stroke !== 'none';
		const isFilled = rootIsFilled
			? fill !== 'none'
			: Boolean( fill ) && fill !== 'none';

		elements.push( { name, attributes, isStroked, isFilled } );
	}

	if ( problems.length ) {
		throw new Error(
			`cannot normalize: ${ [ ...new Set( problems ) ].join( '; ' ) }`
		);
	}

	if ( ! elements.length ) {
		throw new Error( 'no drawable elements' );
	}

	const iconIsStroked = elements.some( ( element ) => element.isStroked );

	const lines = elements.map(
		( { name, attributes, isStroked, isFilled } ) => {
			// Rewrite attributes where they already sit, so a file that is already
			// normalized comes back byte for byte and a fresh export keeps the
			// order its editor chose.
			const parts = [];
			for ( const [ key, value ] of Object.entries( attributes ) ) {
				if ( GEOMETRY_ATTRIBUTES.includes( key ) ) {
					parts.push( `${ key }="${ value }"` );
				} else if ( key === 'fill' ) {
					// A fill-based icon inherits the root's fill; a stroke-based
					// one declares `fill: none` there, so a filled shape opts in.
					if ( isFilled && iconIsStroked ) {
						parts.push( 'fill="currentColor"' );
					}
				} else if ( key === 'stroke' ) {
					// The shared stroke color lives on the root. Keep only an
					// explicit opt-out, or a redundant inherit already in the file.
					if ( value === 'none' || value === 'currentColor' ) {
						parts.push( `stroke="${ value }"` );
					}
				} else if (
					key === 'stroke-width' ||
					key === 'vector-effect'
				) {
					// Hoisted onto the root, and no longer used, respectively.
				} else if (
					PRESERVED_PAINT_ATTRIBUTES.includes( key ) &&
					value &&
					( ! key.startsWith( 'stroke-' ) || isStroked )
				) {
					parts.push( `${ key }="${ value }"` );
				}
			}

			if ( isFilled && iconIsStroked && ! ( 'fill' in attributes ) ) {
				parts.push( 'fill="currentColor"' );
			}
			if (
				isFilled &&
				! isStroked &&
				iconIsStroked &&
				! ( 'stroke' in attributes )
			) {
				parts.push( 'stroke="none"' );
			}

			return `\t<${ name } ${ parts.join( ' ' ) } />`;
		}
	);

	const duplicates = lines.filter(
		( line, index ) => lines.indexOf( line ) !== index
	);
	if ( duplicates.length ) {
		notes.push(
			`${ duplicates.length } duplicate element(s) left in place; check the source file for a stray copied layer`
		);
	}

	const rootPaint = iconIsStroked
		? `style="fill: none" stroke="currentColor" stroke-width="${ STROKE_WIDTH }"`
		: 'fill="currentColor"';

	const content =
		`<svg xmlns="${ XMLNS }" viewBox="${ viewBox }" ${ rootPaint }>\n` +
		`${ lines.join( '\n' ) }\n</svg>\n`;

	return { content, notes };
}

/**
 * Normalizes the files named on the command line.
 *
 * @param {string[]} argv Arguments after the script name.
 * @return {number} A process exit code.
 */
function main( argv ) {
	const files = argv.filter( ( argument ) => ! argument.startsWith( '--' ) );

	if ( ! files.length ) {
		// eslint-disable-next-line no-console
		console.error(
			'Usage: node lib/normalize-export.cjs [--check] <file.svg> [...]'
		);
		return 1;
	}

	const checkOnly = argv.includes( '--check' );
	let changed = 0;
	let failed = 0;

	for ( const file of files ) {
		const source = fs.readFileSync( file, 'utf8' );
		let result;
		try {
			result = normalizeIconSvg( source );
		} catch ( error ) {
			failed += 1;
			// eslint-disable-next-line no-console
			console.error( `${ file }: ${ error.message }` );
			continue;
		}

		for ( const note of new Set( result.notes ) ) {
			// eslint-disable-next-line no-console
			console.log( `${ file }: ${ note }` );
		}

		if ( result.content === source ) {
			continue;
		}

		changed += 1;
		if ( checkOnly ) {
			// eslint-disable-next-line no-console
			console.error( `${ file }: needs normalizing` );
			continue;
		}
		fs.writeFileSync( file, result.content );
		// eslint-disable-next-line no-console
		console.log( `${ file }: normalized` );
	}

	if ( failed || ( checkOnly && changed ) ) {
		return 1;
	}
	return 0;
}

if ( require.main === module ) {
	process.exitCode = main( process.argv.slice( 2 ) );
}

module.exports = { normalizeIconSvg };
