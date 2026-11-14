/**
 * Normalizes an icon SVG into the markup this package expects, and defines
 * what that markup is.
 *
 * Figma (and most editors) export an icon with a `width`/`height` pair, a
 * literal `fill="none"` attribute, and the artboard's color baked into every
 * shape. The library instead hoists the shared paint onto the root so an icon
 * inherits `currentColor`. This turns the former into the latter.
 *
 * It refuses, rather than quietly rewrites, anything whose meaning it cannot
 * preserve -- a group, a clip path, a transform, a gradient, a dashed stroke,
 * a stroke width that is not the library's 1.5 -- because silently dropping
 * one changes the drawing while leaving a file that still builds.
 *
 * Usage:
 *   node lib/normalize-icon-svg.cjs src/library/my-icon.svg [...more]
 *   node lib/normalize-icon-svg.cjs --check src/library/*.svg
 */

const fs = require( 'fs' );

const XMLNS = 'http://www.w3.org/2000/svg';
const VIEW_BOX = '0 0 24 24';
const STROKE_WIDTH = '1.5';

// Elements the icon build knows how to turn into components.
const GRAPHICAL_ELEMENTS = [
	'circle',
	'ellipse',
	'line',
	'path',
	'polygon',
	'polyline',
	'rect',
];

// Elements that carry no drawing, and are dropped.
const METADATA_ELEMENTS = [ 'title', 'desc', 'metadata' ];

// Elements whose content is never drawn directly.
const NON_RENDERING_ELEMENTS = [
	'clipPath',
	'defs',
	'linearGradient',
	'mask',
	'pattern',
	'radialGradient',
	'symbol',
];

// Attributes that describe geometry; they pass through untouched.
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

// Paint attributes that survive `wp_kses` for icons registered in a
// collection, and that the build understands. They pass through untouched,
// except that a stroke attribute is dropped from a shape that is not stroked.
const PRESERVED_PAINT_ATTRIBUTES = [
	'fill-rule',
	'clip-rule',
	'opacity',
	'stroke-linecap',
	'stroke-linejoin',
	'stroke-miterlimit',
];

// Attributes rewritten from the effective paint of each shape.
const PAINT_ATTRIBUTES = [ 'fill', 'stroke', 'stroke-width' ];

// Attributes that change nothing about the drawing, and are dropped.
const DROPPED_ATTRIBUTES = [ 'id', 'vector-effect' ];

// Root attributes that are replaced by the normalized root.
const ROOT_ATTRIBUTES = [
	'xmlns',
	'xmlns:xlink',
	'viewBox',
	'width',
	'height',
	'fill',
	'stroke',
	'stroke-width',
	'style',
	'vector-effect',
];

// Advice for the elements and attributes design tools commonly export.
const UNSUPPORTED_ELEMENT_ADVICE = {
	g: 'ungroup the layers before exporting',
	defs: 'turn off "Clip content" on the frame, and outline or flatten masks before exporting',
	clipPath:
		'turn off "Clip content" on the frame, or flatten the clipped layers before exporting',
	mask: 'flatten the masked layers before exporting',
	use: 'detach the instance and flatten it before exporting',
	linearGradient: 'a library icon is drawn in a single color',
	radialGradient: 'a library icon is drawn in a single color',
	image: 'a library icon is drawn with vector shapes',
	text: 'outline the text before exporting',
};
const UNSUPPORTED_ATTRIBUTE_ADVICE = {
	transform: 'flatten the layer so the transform is baked into its geometry',
	style: 'the build accepts an inline style only on the root, and only `fill: none`',
	class: 'a class can restyle the icon through CSS',
};

/**
 * Reads the attributes of an SVG tag into a plain object.
 *
 * @param {string} source The inside of a tag, after its name.
 * @return {Object<string,string>} Its attributes, in source order.
 */
function parseAttributes( source ) {
	const attributes = {};
	for ( const match of source.matchAll(
		/([\w:.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g
	) ) {
		attributes[ match[ 1 ] ] = match[ 2 ] ?? match[ 3 ];
	}
	return attributes;
}

/**
 * Splits an SVG source string into its element tags, skipping the XML
 * declaration, comments and doctype, which carry no drawing.
 *
 * @param {string} source The SVG file contents.
 * @return {Array<{name: string, attributes: Object<string,string>, isClosing: boolean, isSelfClosing: boolean}>} The tags, in source order.
 */
function parseTags( source ) {
	const tags = [];
	const stripped = source
		.replace( /<\?[\s\S]*?\?>/g, '' )
		.replace( /<!--[\s\S]*?-->/g, '' )
		.replace( /<!DOCTYPE[^>]*>/gi, '' );

	for ( const match of stripped.matchAll(
		/<(\/?)([\w:-]+)((?:[^>"']|"[^"]*"|'[^']*')*?)(\/?)>/g
	) ) {
		const [ , closing, name, rawAttributes, selfClosing ] = match;
		tags.push( {
			name,
			attributes: parseAttributes( rawAttributes ),
			isClosing: closing === '/',
			isSelfClosing: selfClosing === '/',
		} );
	}
	return tags;
}

/**
 * Tells whether a paint value draws something.
 *
 * @param {string|undefined} value A `fill` or `stroke` value.
 * @return {boolean} Whether it paints.
 */
function isPainted( value ) {
	return value !== undefined && value !== 'none' && value !== 'transparent';
}

/**
 * Explains why the root element cannot be normalized.
 *
 * @param {Object<string,string>} root The root element's attributes.
 * @return {string[]} Human-readable reasons.
 */
function findRootProblems( root ) {
	const problems = [];

	if ( root.viewBox === undefined ) {
		problems.push(
			`no viewBox (export the icon with viewBox="${ VIEW_BOX }")`
		);
	} else if ( root.viewBox !== VIEW_BOX ) {
		problems.push(
			`viewBox="${ root.viewBox }" (the library draws on a 24 by 24 grid; resize the frame to 24 by 24 before exporting)`
		);
	}

	if ( root.style !== undefined && ! isFillNoneStyle( root.style ) ) {
		problems.push(
			`style="${ root.style }" on the root (${ UNSUPPORTED_ATTRIBUTE_ADVICE.style })`
		);
	}

	for ( const name of Object.keys( root ) ) {
		if ( ! ROOT_ATTRIBUTES.includes( name ) ) {
			problems.push(
				`${ name } on the root (${
					UNSUPPORTED_ATTRIBUTE_ADVICE[ name ] ??
					'move it onto the shapes or bake it into their geometry'
				})`
			);
		}
	}

	return problems;
}

/**
 * Tells whether an inline style is the library's `fill: none`.
 *
 * @param {string} style A `style` attribute value.
 * @return {boolean} Whether it only sets `fill: none`.
 */
function isFillNoneStyle( style ) {
	return /^\s*fill\s*:\s*none\s*;?\s*$/.test( style );
}

/**
 * Explains why a shape cannot be normalized.
 *
 * @param {string}                name       The element name.
 * @param {Object<string,string>} attributes The element's attributes.
 * @return {string[]} Human-readable reasons.
 */
function findShapeProblems( name, attributes ) {
	const problems = [];

	for ( const [ key, value ] of Object.entries( attributes ) ) {
		if (
			GEOMETRY_ATTRIBUTES.includes( key ) ||
			PRESERVED_PAINT_ATTRIBUTES.includes( key ) ||
			PAINT_ATTRIBUTES.includes( key ) ||
			DROPPED_ATTRIBUTES.includes( key )
		) {
			continue;
		}

		if ( key === 'style' ) {
			problems.push(
				`style="${ value }" on <${ name }> (${ UNSUPPORTED_ATTRIBUTE_ADVICE.style })`
			);
		} else if ( UNSUPPORTED_ATTRIBUTE_ADVICE[ key ] ) {
			problems.push(
				`${ key } on <${ name }> (${ UNSUPPORTED_ATTRIBUTE_ADVICE[ key ] })`
			);
		} else if (
			key.startsWith( 'stroke-' ) ||
			key.startsWith( 'fill-' ) ||
			key.endsWith( 'opacity' )
		) {
			problems.push(
				`${ key } on <${ name }> (not in the icon registry's allowed attributes, so \`wp_kses\` strips it; bake the effect into the path instead)`
			);
		} else {
			problems.push(
				`${ key } on <${ name }> (not supported by the icon build)`
			);
		}
	}

	for ( const key of [ 'fill', 'stroke' ] ) {
		if ( attributes[ key ]?.startsWith( 'url(' ) ) {
			problems.push(
				`${ key }="${ attributes[ key ] }" on <${ name }> (a library icon is drawn in a single color that inherits the text color)`
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
	const tags = parseTags( source );
	const rootTag = tags[ 0 ];
	if ( rootTag?.name !== 'svg' || rootTag.isClosing ) {
		throw new Error( 'cannot normalize: no <svg> root element' );
	}

	const root = rootTag.attributes;
	const problems = findRootProblems( root );
	const notes = [];
	if ( 'vector-effect' in root ) {
		notes.push(
			'removed vector-effect so the stroke width scales with the icon'
		);
	}

	// What a shape inherits from the root when it sets no paint of its own.
	// SVG fills a shape black and leaves it unstroked by default.
	const rootFill =
		root.style !== undefined && isFillNoneStyle( root.style )
			? 'none'
			: ( root.fill ?? 'black' );
	const rootStroke = root.stroke ?? 'none';
	const rootStrokeWidth = root[ 'stroke-width' ] ?? '1';

	const shapes = [];
	let droppedMetadata = 0;
	let depth = 0;
	let nonRenderingDepth = 0;
	for ( const tag of tags.slice( 1 ) ) {
		const { name, attributes, isClosing, isSelfClosing } = tag;

		if ( name === 'svg' && isClosing ) {
			break;
		}

		if ( METADATA_ELEMENTS.includes( name ) ) {
			if ( ! isClosing ) {
				droppedMetadata += 1;
			}
			continue;
		}

		if ( NON_RENDERING_ELEMENTS.includes( name ) && ! isSelfClosing ) {
			nonRenderingDepth += isClosing ? -1 : 1;
		}

		if ( ! GRAPHICAL_ELEMENTS.includes( name ) ) {
			if ( ! isClosing ) {
				problems.push(
					`<${ name }> (${
						UNSUPPORTED_ELEMENT_ADVICE[ name ] ??
						'only basic shapes are supported'
					})`
				);
			}
			continue;
		}

		if ( isClosing ) {
			depth -= 1;
			continue;
		}

		// A shape inside a clip path or a mask is not drawn; the element
		// around it is already reported.
		if ( nonRenderingDepth > 0 ) {
			if ( ! isSelfClosing ) {
				depth += 1;
			}
			continue;
		}

		if ( depth > 0 ) {
			problems.push( `<${ name }> nested inside another shape` );
		}
		if ( ! isSelfClosing ) {
			depth += 1;
		}

		const shapeProblems = findShapeProblems( name, attributes );
		if ( shapeProblems.length ) {
			problems.push( ...shapeProblems );
			continue;
		}

		const fill = attributes.fill ?? rootFill;
		const stroke = attributes.stroke ?? rootStroke;
		const isFilled = isPainted( fill );
		const isStroked = isPainted( stroke );

		if ( isStroked ) {
			const strokeWidth = attributes[ 'stroke-width' ] ?? rootStrokeWidth;
			if ( strokeWidth !== STROKE_WIDTH ) {
				problems.push(
					`stroke-width="${ strokeWidth }" on <${ name }> (the library draws at ${ STROKE_WIDTH }; a different value usually means a layer was resized with "Scale strokes" enabled)`
				);
			}
		}

		if ( 'vector-effect' in attributes ) {
			notes.push(
				'removed vector-effect so the stroke width scales with the icon'
			);
		}

		if ( ! isFilled && ! isStroked ) {
			notes.push( 'removed a shape that draws nothing' );
			continue;
		}

		shapes.push( {
			name,
			attributes,
			isFilled,
			isStroked,
			colors: [
				isFilled ? fill : undefined,
				isStroked ? stroke : undefined,
			]
				.filter( Boolean )
				.map( ( color ) => color.toLowerCase() ),
		} );
	}

	const colors = [
		...new Set( shapes.flatMap( ( shape ) => shape.colors ) ),
	];
	if ( colors.length > 1 ) {
		problems.push(
			`more than one color (${ colors.join(
				', '
			) }; a library icon is drawn in a single color that inherits the text color, so a cut-out has to be part of the path, for example with fill-rule="evenodd")`
		);
	}

	if ( problems.length ) {
		throw new Error(
			`cannot normalize: ${ [ ...new Set( problems ) ].join( '; ' ) }`
		);
	}

	if ( ! shapes.length ) {
		throw new Error( 'cannot normalize: no drawable elements' );
	}

	if ( droppedMetadata ) {
		notes.push( 'removed metadata that carries no drawing' );
	}

	const iconIsStroked = shapes.some( ( shape ) => shape.isStroked );

	const lines = shapes.map( ( { name, attributes, isFilled, isStroked } ) => {
		// The root carries the shared paint. A stroke-based icon declares
		// `fill: none` there, so a filled shape opts in to the fill, and a
		// shape that is only filled opts out of the stroke. In a fill-based
		// icon every shape is filled and unstroked, so it inherits everything.
		const paint = {};
		if ( iconIsStroked && isFilled ) {
			paint.fill = 'currentColor';
		}
		if ( iconIsStroked && ! isStroked ) {
			paint.stroke = 'none';
		}

		// Keep attributes where they already sit, so a file that is already
		// normalized comes back byte for byte and a fresh export keeps the
		// order its editor chose.
		const parts = [];
		for ( const [ key, value ] of Object.entries( attributes ) ) {
			if ( GEOMETRY_ATTRIBUTES.includes( key ) ) {
				parts.push( `${ key }="${ value }"` );
			} else if ( key in paint ) {
				parts.push( `${ key }="${ paint[ key ] }"` );
				delete paint[ key ];
			} else if (
				PRESERVED_PAINT_ATTRIBUTES.includes( key ) &&
				( ! key.startsWith( 'stroke-' ) || isStroked )
			) {
				parts.push( `${ key }="${ value }"` );
			}
		}
		for ( const [ key, value ] of Object.entries( paint ) ) {
			parts.push( `${ key }="${ value }"` );
		}

		return `\t<${ name } ${ parts.join( ' ' ) } />`;
	} );

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
		`<svg xmlns="${ XMLNS }" viewBox="${ VIEW_BOX }" ${ rootPaint }>\n` +
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
	const usage =
		'Usage: node lib/normalize-icon-svg.cjs [--check] <file.svg> [...]';
	const flags = argv.filter( ( argument ) => argument.startsWith( '--' ) );
	const files = argv.filter( ( argument ) => ! argument.startsWith( '--' ) );
	const unknownFlags = flags.filter( ( flag ) => flag !== '--check' );

	if ( unknownFlags.length || ! files.length ) {
		// eslint-disable-next-line no-console
		console.error(
			unknownFlags.length
				? `Unknown option: ${ unknownFlags.join( ' ' ) }\n${ usage }`
				: usage
		);
		return 1;
	}

	const checkOnly = flags.includes( '--check' );
	let changed = 0;
	let failed = 0;

	for ( const file of files ) {
		let source;
		let result;
		try {
			source = fs.readFileSync( file, 'utf8' );
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
