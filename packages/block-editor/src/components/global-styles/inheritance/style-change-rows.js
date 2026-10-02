import { getCSSValueFromRawStyle } from '@wordpress/style-engine';
import { getValueFromObjectPath } from '../../../utils/object';
import { getStyleLabel } from '../style-labels';
import {
	formatStyleValue,
	formatBorderShorthand,
	formatBorderRadius,
	formatSpacingShorthand,
	formatBlockGap,
} from '../format-style-value';

// Low to high precedence, mirroring the `resolveStyle` merge order.
const LAYER_ORDER = [ 'root', 'element', 'block', 'blockVariation' ];

// Preset attributes a block stores outside `style`, keyed to the style path
// they set and the preset type their slug belongs to.
const PRESET_ATTRIBUTES = {
	textColor: { path: [ 'color', 'text' ], type: 'color' },
	backgroundColor: { path: [ 'color', 'background' ], type: 'color' },
	gradient: { path: [ 'color', 'gradient' ], type: 'gradient' },
	fontSize: { path: [ 'typography', 'fontSize' ], type: 'font-size' },
	fontFamily: { path: [ 'typography', 'fontFamily' ], type: 'font-family' },
	borderColor: { path: [ 'border', 'color' ], type: 'color' },
	textShadow: { path: [ 'typography', 'textShadow' ], type: 'text-shadow' },
};

/**
 * Returns the style values a block sets on itself: its `style` attribute plus
 * the preset attributes stored beside it, as one style object. Preset slugs
 * are written in the `var:preset|type|slug` form so they format like any
 * other preset value.
 *
 * @param {Object} attributes Block attributes.
 * @return {Object} Local style values.
 */
export function getLocalStyle( attributes = {} ) {
	const style = structuredClone( attributes.style ?? {} );
	for ( const [ attribute, { path, type } ] of Object.entries(
		PRESET_ATTRIBUTES
	) ) {
		const slug = attributes[ attribute ];
		if ( ! slug ) {
			continue;
		}
		const [ group, property ] = path;
		style[ group ] = {
			...style[ group ],
			[ property ]: `var:preset|${ type }|${ slug }`,
		};
	}
	return style;
}

/**
 * Whether a style value is set: not empty, and for an object, holding at
 * least one set value.
 *
 * @param {unknown} value Style value.
 * @return {boolean} Whether the value is set.
 */
function isSet( value ) {
	if ( value === undefined || value === null || value === '' ) {
		return false;
	}
	if ( typeof value === 'object' && ! Array.isArray( value ) ) {
		return Object.values( value ).some( isSet );
	}
	return true;
}

/**
 * Finds the winning source for a style path. A composite value such as
 * padding can draw its sides from several layers; the highest precedence one
 * is the one a reset would fall back to first.
 *
 * @param {Object} sources Source map from `resolveStyle`, keyed by leaf path.
 * @param {string} key     Style path joined with dots.
 * @return {?{ source: Object, leafKey: string }} Winning source and the leaf it was read from.
 */
function getWinningSource( sources, key ) {
	let winner = null;
	for ( const [ leafKey, source ] of Object.entries( sources ?? {} ) ) {
		if ( leafKey !== key && ! leafKey.startsWith( `${ key }.` ) ) {
			continue;
		}
		if (
			! winner ||
			LAYER_ORDER.indexOf( source.layer ) >
				LAYER_ORDER.indexOf( winner.source.layer )
		) {
			winner = { source, leafKey };
		}
	}
	return winner;
}

/**
 * Builds the style change rows for a block: every value it sets itself, and
 * every value it inherits from Global Styles.
 *
 * - `override`: set on the block, with an inherited value underneath.
 * - `local`: set on the block with nothing underneath. Always listed, so the
 *   list matches what a person changed even when nothing is replaced.
 * - `inherited`: from Global Styles only.
 *
 * An inherited value whose source cannot be named is left out rather than
 * shown with a guessed source.
 *
 * @param {Object}                                       args
 * @param {Array}                                        args.paths          `{ path, isSupported }` entries to consider.
 * @param {Object}                                       args.localStyle     Values the block sets, from `getLocalStyle`.
 * @param {Object}                                       args.inheritedStyle Merged value from `resolveStyle`.
 * @param {Object}                                       args.sources        Source map from `resolveStyle`.
 * @param {(source: Object, context: Object) => ?string} args.describeSource Names a source for a path and the leaf it was read from.
 * @return {Array} Rows, local ones first, each in style property order.
 */
export function getStyleChangeRows( {
	paths,
	localStyle,
	inheritedStyle,
	sources,
	describeSource,
} ) {
	const rows = [];
	for ( const { path, isSupported: supported } of paths ) {
		const key = path.join( '.' );
		const localValue = getValueFromObjectPath( localStyle, path );
		const isSetOnBlock = isSet( localValue );
		if ( ! isSetOnBlock && ! supported ) {
			continue;
		}
		const winner = getWinningSource( sources, key );
		const sourceLabel = winner
			? describeSource( winner.source, { path, leafKey: winner.leafKey } )
			: null;
		if ( ! isSetOnBlock && ! sourceLabel ) {
			continue;
		}
		let status = 'inherited';
		if ( isSetOnBlock ) {
			status = sourceLabel ? 'override' : 'local';
		}
		rows.push( {
			key,
			path,
			label: getStyleLabel( path ),
			status,
			sourceLabel,
			value: isSetOnBlock
				? localValue
				: getValueFromObjectPath( inheritedStyle, path ),
		} );
	}
	return [
		...rows.filter( ( row ) => row.status !== 'inherited' ),
		...rows.filter( ( row ) => row.status === 'inherited' ),
	];
}

const BORDER_SIDE_KEYS = [
	'border.top',
	'border.right',
	'border.bottom',
	'border.left',
];

/**
 * Whether a style path holds a colour or gradient, so its value can show a
 * swatch.
 *
 * @param {string[]} path Style path.
 * @return {boolean} Whether the path is a colour.
 */
function isColorPath( path ) {
	const last = path[ path.length - 1 ];
	if ( last === 'color' ) {
		return true;
	}
	return (
		path[ path.length - 2 ] === 'color' &&
		[ 'text', 'background', 'gradient' ].includes( last )
	);
}

/**
 * Returns how a row's value reads: readable text, and a CSS colour for a
 * swatch where the path is a colour.
 *
 * @param {string[]} path  Style path.
 * @param {unknown}  value Raw style value.
 * @return {{ text: string, color?: string }} Display parts.
 */
export function getStyleValueDisplay( path, value ) {
	const key = path.join( '.' );
	let text;
	if ( key === 'border' || BORDER_SIDE_KEYS.includes( key ) ) {
		text = formatBorderShorthand( value );
	} else if ( key === 'border.radius' ) {
		text = formatBorderRadius( value );
	} else if ( key === 'spacing.padding' || key === 'spacing.margin' ) {
		text = formatSpacingShorthand( value );
	} else if ( key === 'spacing.blockGap' ) {
		text = formatBlockGap( value );
	} else if ( value && typeof value === 'object' && value.url ) {
		text = value.title || value.url.split( '/' ).pop();
	} else {
		text = formatStyleValue( value );
	}
	const color =
		isColorPath( path ) && typeof value === 'string'
			? getCSSValueFromRawStyle( value )
			: undefined;
	return { text, color };
}
