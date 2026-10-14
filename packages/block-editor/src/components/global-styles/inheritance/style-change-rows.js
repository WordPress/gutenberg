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
 * CSS values that resolve to nothing a person can see or act on. A row whose
 * value is one of these says nothing, so it is left out.
 */
const NO_VALUE_KEYWORDS = [ 'inherit', 'none', 'transparent none' ];

/**
 * Whether a resolved value is worth a row: set, and not a keyword that only
 * hands the value on.
 *
 * @param {unknown} value Style value.
 * @return {boolean} Whether the value is real.
 */
function hasRealValue( value ) {
	return isSet( value ) && ! NO_VALUE_KEYWORDS.includes( value );
}

// Style paths in the order of the inspector controls that set them. Paths not
// listed keep their place after these.
const INSPECTOR_ORDER = [
	'color.text',
	'typography.fontFamily',
	'typography.fontSize',
	'typography.fontStyle',
	'typography.fontWeight',
	'typography.lineHeight',
	'typography.letterSpacing',
	'typography.textDecoration',
	'typography.writingMode',
	'typography.textTransform',
	'color.background',
	'color.gradient',
	'background',
	'spacing.padding',
	'spacing.margin',
	'spacing.blockGap',
	'dimensions.minHeight',
	'border',
	'border.color',
	'border.width',
	'border.style',
	'border.radius',
	'shadow',
];

function getInspectorIndex( key ) {
	const index = INSPECTOR_ORDER.indexOf( key );
	return index === -1 ? INSPECTOR_ORDER.length : index;
}

const BORDER_PARTS = [ 'width', 'style', 'color' ];

/**
 * Folds border width, style and colour rows into one Border row, as the
 * border control sets them together. Only rows that share a status and a
 * source fold, so no row's source is lost.
 *
 * @param {Array} rows Rows from one status group.
 * @return {Array} Rows with the border parts folded where they can be.
 */
function foldBorderRows( rows ) {
	const parts = rows.filter( ( row ) =>
		BORDER_PARTS.some( ( part ) => row.key === `border.${ part }` )
	);
	if (
		parts.length < 2 ||
		parts.some(
			( row ) =>
				row.status !== parts[ 0 ].status ||
				row.sourceLabel !== parts[ 0 ].sourceLabel
		)
	) {
		return rows;
	}
	const collect = ( field ) =>
		Object.fromEntries(
			parts.map( ( row ) => [ row.path[ 1 ], row[ field ] ] )
		);
	const border = {
		...parts[ 0 ],
		key: 'border',
		path: [ 'border' ],
		label: getStyleLabel( [ 'border' ] ),
		value: collect( 'value' ),
		...( parts[ 0 ].status === 'override' && {
			inheritedValue: collect( 'inheritedValue' ),
		} ),
	};
	return [ ...rows.filter( ( row ) => ! parts.includes( row ) ), border ];
}

/**
 * Builds the style change rows for a block: every value it sets itself, and
 * every value it inherits from Global Styles.
 *
 * - `override`: set on the block over a real inherited value, carried as
 *   `inheritedValue`.
 * - `local`: set on the block with nothing real underneath. Always listed, so
 *   the list matches what a person changed even when nothing is replaced.
 * - `inherited`: from Global Styles only, and only with a real value.
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
 * @return {Array} Rows, local ones first, each group in inspector order.
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
		const inheritedValue = getValueFromObjectPath( inheritedStyle, path );
		const winner = hasRealValue( inheritedValue )
			? getWinningSource( sources, key )
			: null;
		const sourceLabel = winner
			? describeSource( winner.source, { path, leafKey: winner.leafKey } )
			: null;
		if ( ! isSetOnBlock && ! sourceLabel ) {
			continue;
		}
		if ( ! isSetOnBlock ) {
			rows.push( {
				key,
				path,
				label: getStyleLabel( path ),
				status: 'inherited',
				sourceLabel,
				value: inheritedValue,
			} );
			continue;
		}
		rows.push( {
			key,
			path,
			label: getStyleLabel( path ),
			status: sourceLabel ? 'override' : 'local',
			sourceLabel,
			value: localValue,
			...( sourceLabel && { inheritedValue } ),
		} );
	}
	const ofStatus = ( status ) =>
		foldBorderRows( rows.filter( ( row ) => row.status === status ) );
	const inInspectorOrder = ( list ) =>
		list.sort(
			( a, b ) => getInspectorIndex( a.key ) - getInspectorIndex( b.key )
		);
	return [
		...inInspectorOrder( [
			...ofStatus( 'override' ),
			...ofStatus( 'local' ),
		] ),
		...inInspectorOrder( ofStatus( 'inherited' ) ),
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
