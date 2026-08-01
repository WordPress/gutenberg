/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Shared helpers for presenting the Global Styles cascade. Used by the origin
 * popover opened from a control's override indicator and by the inline origin
 * trace shown inside color popovers, so both describe an origin the same way.
 */

// Object-valued leaves that are a single atomic definition and must not be
// descended into when flattening. Mirrors `ATOMIC_OBJECT_KEYS` in the engine.
const ATOMIC_OBJECT_KEYS = new Set( [ 'backgroundImage' ] );

/**
 * Flattens a style tree into `{ 'dot.path': value }`, stopping at primitives,
 * arrays, and atomic object leaves.
 *
 * @param {?Object} tree   Style tree.
 * @param {string}  prefix Accumulated dot-path prefix.
 * @param {Object}  out    Accumulator.
 * @return {Object} Flat map of dot-path to leaf value.
 */
export function flattenStyleTree( tree, prefix = '', out = {} ) {
	if ( ! tree || typeof tree !== 'object' || Array.isArray( tree ) ) {
		return out;
	}
	for ( const key of Object.keys( tree ) ) {
		const value = tree[ key ];
		const path = prefix ? `${ prefix }.${ key }` : key;
		if (
			value !== null &&
			typeof value === 'object' &&
			! Array.isArray( value ) &&
			! ATOMIC_OBJECT_KEYS.has( key )
		) {
			flattenStyleTree( value, path, out );
		} else if (
			path !== 'css' &&
			value !== undefined &&
			value !== '' &&
			value !== null
		) {
			out[ path ] = value;
		}
	}
	return out;
}

/**
 * Splits a CSS length into its number and unit, or returns `null` when the
 * value is not a plain length (a `calc()`, a keyword, a custom property).
 *
 * @param {string} value CSS value.
 * @return {?{number: number, unit: string}} Parsed length.
 */
function parseLength( value ) {
	const match = String( value )
		.trim()
		.match( /^(-?\d*\.?\d+)([a-z%]*)$/i );
	return match
		? { number: parseFloat( match[ 1 ] ), unit: match[ 2 ] }
		: null;
}

/**
 * Splits a CSS argument list on top-level commas, leaving nested calls intact.
 *
 * @param {string} args Argument list, without the surrounding parentheses.
 * @return {string[]} Arguments.
 */
function splitCssArguments( args ) {
	const parts = [];
	let depth = 0;
	let buffer = '';
	for ( const character of args ) {
		if ( character === '(' ) {
			depth += 1;
		} else if ( character === ')' ) {
			depth -= 1;
		} else if ( character === ',' && depth === 0 ) {
			parts.push( buffer.trim() );
			buffer = '';
			continue;
		}
		buffer += character;
	}
	parts.push( buffer.trim() );
	return parts;
}

/**
 * Renders a leaf value compactly enough for a single sidebar row.
 *
 * @param {*}       value               Leaf value.
 * @param {?Object} [presetValueBySlug] Map of `<kind>|<slug>` to the value that
 *                                      preset resolves to, e.g. a colour's hex.
 *                                      Preset references fall back to their slug
 *                                      when the map has no entry.
 * @return {string} Display string.
 */
export function formatValue( value, presetValueBySlug ) {
	if ( value === undefined || value === null || value === '' ) {
		return '—';
	}
	if ( typeof value === 'string' || typeof value === 'number' ) {
		// Preset references are long and mostly boilerplate. A slug names the
		// preset but not what it paints, so where the resolved value is known
		// (colours) it is shown instead, and the slug is the fallback. Both the
		// CSS custom property form and the `var:preset|…` attribute form appear
		// here.
		const cssVar = String( value ).match(
			/^var\(\s*--wp--preset--([a-z-]+)--([a-z0-9-]+)\s*\)$/i
		);
		if ( cssVar ) {
			return (
				presetValueBySlug?.[ `${ cssVar[ 1 ] }|${ cssVar[ 2 ] }` ] ??
				cssVar[ 2 ]
			);
		}
		const presetRef = String( value ).match(
			/^var:preset\|([a-z-]+)\|([a-z0-9-]+)$/i
		);
		if ( presetRef ) {
			return (
				presetValueBySlug?.[
					`${ presetRef[ 1 ] }|${ presetRef[ 2 ] }`
				] ?? presetRef[ 2 ]
			);
		}

		// Fluid typography emits `clamp( min, preferred, max )`, which runs to
		// 50-odd characters and dominates the row. The preferred term is a
		// viewport formula nobody reads; the useful part is the range it moves
		// between, so show that.
		const clamped = String( value ).match( /^clamp\((.*)\)$/is );
		if ( clamped ) {
			const args = splitCssArguments( clamped[ 1 ] );
			if ( args.length === 3 ) {
				const min = parseLength( args[ 0 ] );
				const max = parseLength( args[ 2 ] );
				// Both ends in the same unit is the usual case, and naming the
				// unit twice is what pushed the row past the column. State it
				// once, at the end, the way a range normally reads.
				if ( min && max && min.unit === max.unit && min.unit ) {
					return `${ min.number } – ${ max.number }${ min.unit }`;
				}
				return `${ args[ 0 ] } – ${ args[ 2 ] }`;
			}
		}

		return String( value );
	}
	if ( Array.isArray( value ) ) {
		return value.join( ', ' );
	}
	if ( typeof value === 'object' ) {
		if ( value.url ) {
			return value.title || value.url.split( '/' ).pop();
		}
		return JSON.stringify( value );
	}
	return String( value );
}

/**
 * Composes the human label for a cascade layer. The engine deliberately emits
 * structural metadata rather than a pre-built string, so the breadcrumb is
 * assembled (and translated) here, where the block registry is available.
 *
 * @param {Object}  entry           Cascade entry.
 * @param {?string} entry.layer     Layer identifier.
 * @param {?string} entry.element   Root element name, for element layers.
 * @param {?string} entry.variation Variation slug, for variation layers.
 * @param {string}  blockTitle      Registered title of the selected block.
 * @param {Object}  variationLabels Map of variation slug to registered label.
 * @return {string} Breadcrumb label.
 */
export function getLayerLabel(
	{ layer, element, variation },
	blockTitle,
	variationLabels
) {
	switch ( layer ) {
		case 'local':
			/*
			 * Every layer here applies to this block; what separates them is
			 * how far each one reaches. So the labels name scope, and reading
			 * the column downward narrows it: "Site-wide" → "All Paragraph
			 * blocks" → "Subtitle style" → "This block".
			 *
			 * Deliberately not "From block settings" or similar. That names
			 * where the value is stored rather than how far it reaches, which
			 * is a different question from the one every other row answers —
			 * and it is the longest label in the column that gets squeezed by
			 * the value beside it.
			 *
			 * "This" carries the contrast against "All %s blocks" on its own,
			 * so no emphasiser is needed in front of it.
			 */
			return __( 'This block' );
		case 'localCss':
			return __( 'Custom CSS' );
		case 'root':
			/*
			 * Deliberately not "Root", which describes the data structure
			 * rather than anything the user recognises.
			 *
			 * This layer is the site's top-level Styles: everything set
			 * without picking a block. It cannot currently be split into "the
			 * theme's defaults" versus "what you changed" — the editor merges
			 * those before the block editor receives them — so the wording has
			 * to stay true for both.
			 */
			return __( 'Site-wide' );
		case 'element':
			return sprintf(
				/* translators: %s: Element name, e.g. "Button". */
				__( '%s element' ),
				element
					? element.charAt( 0 ).toUpperCase() + element.slice( 1 )
					: __( 'Unknown' )
			);
		case 'block':
			return sprintf(
				/* translators: %s: Block title, e.g. "Group". */
				__( 'All %s blocks' ),
				blockTitle
			);
		case 'blockVariation':
			return sprintf(
				/* translators: %s: Block style variation name, e.g. "Subtitle". */
				__( '%s style' ),
				variationLabels[ variation ] ?? variation
			);
		default:
			return layer;
	}
}

/**
 * Builds the per-path cascade rows, folding the block's own local styles in as
 * the highest layer. The engine resolves the Global Styles layers only; a local
 * override lives in block attributes and is layered on here.
 *
 * @param {Object}  cascade     Per-path cascade from the engine.
 * @param {Object}  localStyles The block's own `style` attribute.
 * @param {?string} customCss   The block's `style.css` attribute.
 * @return {Object} Map of dot-path to ordered cascade entries.
 */
export function withLocalOverrides( cascade, localStyles, customCss ) {
	const local = flattenStyleTree( localStyles );
	// Custom CSS is emitted after the block's own styles and usually carries
	// `!important`, so it sits at the top of the cascade.
	const customDeclarations = getCustomCssDeclarations( customCss );
	const paths = new Set( [
		...Object.keys( cascade ),
		...Object.keys( local ),
		...Object.keys( customDeclarations ),
	] );
	const result = {};
	for ( const path of paths ) {
		const inherited = ( cascade[ path ] ?? [] ).map( ( entry ) => ( {
			...entry,
		} ) );
		if ( Object.hasOwn( local, path ) ) {
			for ( const entry of inherited ) {
				entry.isWinner = false;
			}
			inherited.push( {
				layer: 'local',
				value: local[ path ],
				isWinner: true,
			} );
		}
		if ( Object.hasOwn( customDeclarations, path ) ) {
			for ( const entry of inherited ) {
				entry.isWinner = false;
			}
			inherited.push( {
				layer: 'localCss',
				value: customDeclarations[ path ],
				isWinner: true,
			} );
		}
		if ( inherited.length > 0 ) {
			result[ path ] = inherited;
		}
	}
	return result;
}

/**
 * Folds a block's preset attributes into its `style` tree.
 *
 * Preset selections are not stored under `style`: choosing a palette colour
 * saves `textColor: 'primary'`, a preset size saves `fontSize: 'large'`, and so
 * on. Reading `attributes.style` alone therefore misses them, and a locally set
 * value looks inherited. This mirrors the per-hook `attributesToStyle` helpers
 * (see `hooks/typography.js`) so origin reporting agrees with the controls.
 *
 * @param {?Object} attributes Block attributes.
 * @return {Object} Style tree including preset-derived values.
 */
export function attributesToStyleTree( attributes ) {
	if ( ! attributes ) {
		return {};
	}
	const {
		style,
		fontFamily,
		fontSize,
		textColor,
		backgroundColor,
		gradient,
	} = attributes;
	const typography = {
		...style?.typography,
		...( fontFamily
			? { fontFamily: `var:preset|font-family|${ fontFamily }` }
			: {} ),
		...( fontSize
			? { fontSize: `var:preset|font-size|${ fontSize }` }
			: {} ),
	};
	const color = {
		...style?.color,
		...( textColor ? { text: `var:preset|color|${ textColor }` } : {} ),
		...( backgroundColor
			? { background: `var:preset|color|${ backgroundColor }` }
			: {} ),
		...( gradient
			? { gradient: `var:preset|gradient|${ gradient }` }
			: {} ),
	};
	return {
		...style,
		...( Object.keys( typography ).length ? { typography } : {} ),
		...( Object.keys( color ).length ? { color } : {} ),
	};
}

// CSS properties a block's own custom CSS can declare that map onto a style
// path the cascade already tracks. Only these can be attributed; anything else
// in custom CSS is left to the computed-value check to flag generically.
const STYLE_PATH_BY_CSS_PROPERTY = {
	'font-size': 'typography.fontSize',
	'font-weight': 'typography.fontWeight',
	'font-style': 'typography.fontStyle',
	'font-family': 'typography.fontFamily',
	'line-height': 'typography.lineHeight',
	'letter-spacing': 'typography.letterSpacing',
	'text-transform': 'typography.textTransform',
	'text-decoration': 'typography.textDecoration',
	'text-align': 'typography.textAlign',
	color: 'color.text',
	'background-color': 'color.background',
	'border-radius': 'border.radius',
	'border-width': 'border.width',
	'border-style': 'border.style',
	'border-color': 'border.color',
	padding: 'spacing.padding',
	margin: 'spacing.margin',
};

/**
 * Reads the top-level declarations out of a block's custom CSS.
 *
 * Block custom CSS may nest selectors (`&:hover { … }`); those target something
 * other than the block's own resting state, so only declarations at the top
 * level are attributed. `!important` is stripped from the reported value — it
 * explains *why* the declaration wins, not what it sets.
 *
 * @param {?string} css The block's `style.css` attribute.
 * @return {Object} Map of style dot-path to declared value.
 */
export function getCustomCssDeclarations( css ) {
	const declarations = {};
	if ( typeof css !== 'string' || ! css.trim() ) {
		return declarations;
	}

	const add = ( chunk ) => {
		const separator = chunk.indexOf( ':' );
		if ( separator === -1 ) {
			return;
		}
		const property = chunk.slice( 0, separator ).trim().toLowerCase();
		const value = chunk
			.slice( separator + 1 )
			.replace( /!important\s*$/i, '' )
			.trim();
		const path = STYLE_PATH_BY_CSS_PROPERTY[ property ];
		if ( path && value ) {
			declarations[ path ] = value;
		}
	};

	let depth = 0;
	let buffer = '';
	for ( const character of css ) {
		if ( character === '{' ) {
			depth += 1;
			buffer = '';
			continue;
		}
		if ( character === '}' ) {
			depth = Math.max( 0, depth - 1 );
			buffer = '';
			continue;
		}
		if ( depth > 0 ) {
			continue;
		}
		if ( character === ';' ) {
			add( buffer );
			buffer = '';
			continue;
		}
		buffer += character;
	}
	add( buffer );

	return declarations;
}
