import { capitalCase } from 'change-case';
import { __, sprintf } from '@wordpress/i18n';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { __EXPERIMENTAL_STYLE_PROPERTY } from '@wordpress/blocks';
import { unlock } from '../../lock-unlock';
import {
	formatStyleValue,
	formatBorderRadius,
	formatBorderShorthand,
	formatSpacingShorthand,
	formatBlockGap,
} from './format-style-value';

const { cleanEmptyObject } = unlock( blockEditorPrivateApis );

// Block Gap is a special case and isn't defined within the blocks
// style properties config. We'll add it here to allow it to be pushed
// to global styles as well.
export const STYLE_PROPERTY = {
	...__EXPERIMENTAL_STYLE_PROPERTY,
	blockGap: { value: [ 'spacing', 'blockGap' ] },
};

/**
 * Names for the root layer, keyed by the first part of a style path. Root only
 * reaches a block through text color and typography (see `resolveStyle`).
 *
 * @type {Record<string, string>}
 */
const ROOT_LABELS = {
	typography: __( 'Site typography' ),
	color: __( 'Site colors' ),
};

/**
 * Element names as `getElementLayers` returns them.
 *
 * @type {Record<string, string>}
 */
const ELEMENT_LABELS = {
	button: __( 'Button' ),
	heading: __( 'Heading' ),
	link: __( 'Link' ),
	caption: __( 'Caption' ),
};

// Block attributes that hold a preset in place of a `style` value.
const PRESET_ATTRIBUTES = {
	'color.text': { attribute: 'textColor', type: 'color' },
	'color.background': { attribute: 'backgroundColor', type: 'color' },
	'color.gradient': { attribute: 'gradient', type: 'gradient' },
	'typography.fontSize': { attribute: 'fontSize', type: 'font-size' },
	'typography.fontFamily': { attribute: 'fontFamily', type: 'font-family' },
	'border.color': { attribute: 'borderColor', type: 'color' },
};

const COLOR_PATH_ENDINGS = [ 'text', 'background', 'color' ];

const getValueFromObjectPath = ( object, path ) =>
	path.reduce( ( value, key ) => value?.[ key ], object );

const isSet = ( value ) =>
	value !== undefined &&
	value !== null &&
	value !== '' &&
	! (
		typeof value === 'object' &&
		! Array.isArray( value ) &&
		Object.keys( value ).length === 0
	);

// Values that only defer to something else or switch a style off. A row with
// one of these says nothing about where the block's look comes from.
const NO_VALUES = [ 'inherit', 'none', 'transparent none' ];

const hasValue = ( value ) =>
	isSet( value ) &&
	! (
		typeof value === 'string' &&
		NO_VALUES.includes( value.trim().toLowerCase() )
	);

// Rows follow the inspector: text color sits in Typography, then Color,
// Dimensions, Border and Shadow.
const ROW_ORDER = [
	'color.text',
	'typography.fontFamily',
	'typography.fontSize',
	'typography.fontWeight',
	'typography.fontStyle',
	'typography.lineHeight',
	'typography.letterSpacing',
	'typography.textDecoration',
	'typography.textTransform',
	'color',
	'spacing',
	'dimensions',
	'border',
	'shadow',
];

const getRowRank = ( pathKey ) => {
	const rank = ROW_ORDER.findIndex(
		( key ) => pathKey === key || pathKey.startsWith( `${ key }.` )
	);
	return rank === -1 ? ROW_ORDER.length : rank;
};

// The all-sides border leaves that fold into one "Border" row.
const BORDER_LEAVES = [ 'border.width', 'border.style', 'border.color' ];

/**
 * Names the Global Styles element that supplied a leaf. Only elements in
 * `elementLayers` paint the block, and the last one setting the leaf wins,
 * mirroring the order `resolveStyle` merges them in.
 *
 * @param {string[]} leafPath      Leaf style path, e.g. `[ 'color', 'text' ]`.
 * @param {string[]} elementLayers Element keys that paint the block, low to high precedence.
 * @param {Object}   elementStyles Raw `styles.elements` from Global Styles.
 *
 * @return {string|undefined} The element key, e.g. `button`.
 */
export function getSourceElementName( leafPath, elementLayers, elementStyles ) {
	if ( elementLayers.length === 1 ) {
		return elementLayers[ 0 ];
	}
	return [ ...elementLayers ]
		.reverse()
		.find( ( element ) =>
			isSet(
				getValueFromObjectPath( elementStyles?.[ element ], leafPath )
			)
		);
}

/**
 * Turns a `resolveStyle` source descriptor into the copy shown to people.
 *
 * Returns `null` for anything the engine did not resolve, so the UI never
 * names a source it is guessing at.
 *
 * @param {?{layer: string}} source                   Source descriptor from `resolveStyle`.
 * @param {Object}           context                  What the layer refers to.
 * @param {string[]}         context.path             Style path the source supplies.
 * @param {string}           context.blockTitle       Block title, e.g. "Button".
 * @param {string}           [context.variationTitle] Active block style variation label, e.g. "Outline".
 * @param {string}           [context.elementName]    Element key that supplied the value, e.g. `button`.
 *
 * @return {?string} Source copy, or `null`.
 */
export function getSourceLabel(
	source,
	{ path, blockTitle, variationTitle, elementName }
) {
	switch ( source?.layer ) {
		case 'root': {
			// Element styles set on the root read as their property's section.
			const sectionKey = path[ 0 ] === 'elements' ? path[ 2 ] : path[ 0 ];
			return ROOT_LABELS[ sectionKey ] ?? __( 'Site styles' );
		}
		case 'element':
			if ( ! elementName ) {
				return null;
			}
			return sprintf(
				// translators: %s: Element name e.g. 'Button'.
				__( '%s element' ),
				ELEMENT_LABELS[ elementName ] ?? capitalCase( elementName )
			);
		case 'block':
			return sprintf(
				// translators: %s: Block title e.g. 'Paragraph'.
				__( '%s block' ),
				blockTitle
			);
		case 'blockVariation':
			if ( ! variationTitle ) {
				return null;
			}
			return sprintf(
				// translators: %s: Block style variation name e.g. 'Outline'.
				__( '%s style' ),
				variationTitle
			);
		default:
			return null;
	}
}

/**
 * Formats a style value for its path, so spacing and radius objects read as
 * one CSS value.
 *
 * @param {string}   pathKey Dot path, e.g. `spacing.padding`.
 * @param {*}        value   Raw value.
 * @param {Function} resolve Resolves preset values to real sizes.
 *
 * @return {string} Readable value.
 */
export function formatSourceValue( pathKey, value, resolve ) {
	if ( pathKey === 'spacing.padding' || pathKey === 'spacing.margin' ) {
		return formatSpacingShorthand( value, resolve );
	}
	if ( pathKey === 'spacing.blockGap' ) {
		return formatBlockGap( value, resolve );
	}
	if ( pathKey === 'border.radius' ) {
		return formatBorderRadius( value );
	}
	if ( pathKey === 'border' ) {
		return formatBorderShorthand( value );
	}
	return formatStyleValue( value );
}

// Collects every leaf path under `object`, skipping custom CSS.
function getLeafPaths( object, path = [] ) {
	if ( ! object || typeof object !== 'object' || Array.isArray( object ) ) {
		return isSet( object ) ? [ path ] : [];
	}
	return Object.keys( object ).flatMap( ( key ) =>
		path.length === 0 && key === 'css'
			? []
			: getLeafPaths( object[ key ], [ ...path, key ] )
	);
}

/**
 * Builds the rows for "Where styles come from": every style the block's
 * controls show, with its value and where that value comes from.
 *
 * A row is changed when the block sets the style itself. A changed row with
 * nothing underneath still gets a row, with `replaces` set to `null`. A style
 * the block doesn't set gets a row only when Global Styles gives it a real
 * value, not `inherit` or `none`.
 *
 * @param {Object}     options
 * @param {string[][]} options.stylePaths Style paths the block supports.
 * @param {Object}     options.attributes Block attributes.
 * @param {Object}     options.resolved   `{ value, sources }` from `useResolvedStyle`.
 * @param {Function}   options.getLabel   Label for a style path.
 * @param {Function}   options.getSource  Source copy for `( source, leafPath )`.
 *
 * @return {Array<Object>} Rows, in inspector order.
 */
export function getStyleSourceRows( {
	stylePaths,
	attributes,
	resolved,
	getLabel,
	getSource,
} ) {
	const { value: inherited = {}, sources = {} } = resolved ?? {};
	const localStyle = attributes?.style ?? {};

	const sourcesFor = ( pathKey ) => {
		const labels = Object.keys( sources )
			.filter(
				( key ) => key === pathKey || key.startsWith( `${ pathKey }.` )
			)
			.map( ( key ) => getSource( sources[ key ], key.split( '.' ) ) )
			.filter( Boolean );
		return labels.length ? [ ...new Set( labels ) ].join( ', ' ) : null;
	};

	const buildRow = ( path ) => {
		const pathKey = path.join( '.' );
		const preset = PRESET_ATTRIBUTES[ pathKey ];
		const presetSlug = preset
			? attributes?.[ preset.attribute ]
			: undefined;
		const localValue = presetSlug
			? `var:preset|${ preset.type }|${ presetSlug }`
			: getValueFromObjectPath( localStyle, path );
		const inheritedValue = getValueFromObjectPath( inherited, path );
		const isChanged = isSet( localValue );
		const inheritedSource = hasValue( inheritedValue )
			? sourcesFor( pathKey )
			: null;

		if ( ! isChanged && ! inheritedSource ) {
			return null;
		}

		return {
			id: pathKey,
			path,
			label: getLabel( path ),
			isChanged,
			value: isChanged ? localValue : inheritedValue,
			source: isChanged ? null : inheritedSource,
			replaces:
				isChanged && inheritedSource
					? { value: inheritedValue, source: inheritedSource }
					: null,
			presetAttribute: presetSlug ? preset.attribute : undefined,
		};
	};

	const seen = new Set();
	const rows = [];
	for ( const path of stylePaths ) {
		const pathKey = path.join( '.' );
		if ( seen.has( pathKey ) ) {
			continue;
		}
		seen.add( pathKey );
		const row = buildRow( path );
		if ( row ) {
			rows.push( row );
		}
	}

	// A local style no control path covers (a hover color, a single border
	// side) still gets a row, so the changed list matches what was set.
	const isCovered = ( leafKey ) =>
		[ ...seen ].some(
			( key ) => leafKey === key || leafKey.startsWith( `${ key }.` )
		);
	for ( const leafPath of getLeafPaths( localStyle ) ) {
		const leafKey = leafPath.join( '.' );
		if ( ! isCovered( leafKey ) ) {
			seen.add( leafKey );
			rows.push( buildRow( leafPath ) );
		}
	}

	return groupInheritedBorder( rows, getLabel ).sort(
		( a, b ) => getRowRank( a.id ) - getRowRank( b.id )
	);
}

/**
 * Folds the inherited border width, style and color rows into one "Border"
 * row, so they read as one CSS value. Left alone when the block sets any of
 * them, as each changed row can be reset on its own.
 *
 * @param {Array<Object>} rows     Style source rows.
 * @param {Function}      getLabel Label for a style path.
 *
 * @return {Array<Object>} The rows, with the border rows folded.
 */
function groupInheritedBorder( rows, getLabel ) {
	const borderRows = rows.filter( ( row ) =>
		BORDER_LEAVES.includes( row.id )
	);
	if (
		borderRows.length < 2 ||
		borderRows.some( ( row ) => row.isChanged )
	) {
		return rows;
	}
	const value = Object.fromEntries(
		borderRows.map( ( row ) => [ row.path[ 1 ], row.value ] )
	);
	const sources = [ ...new Set( borderRows.map( ( row ) => row.source ) ) ];
	return [
		...rows.filter( ( row ) => ! borderRows.includes( row ) ),
		{
			id: 'border',
			path: [ 'border' ],
			label: getLabel( [ 'border' ] ),
			isChanged: false,
			value,
			source: sources.join( ', ' ),
			replaces: null,
		},
	];
}

/**
 * Works out the block attributes that reset the given rows, falling back to
 * what the block inherits. Custom CSS and non-style attributes are kept.
 *
 * @param {Object}        attributes Block attributes.
 * @param {Array<Object>} rows       Changed rows to reset.
 *
 * @return {Object} Attributes to pass to `setAttributes`.
 */
export function getResetAttributes( attributes, rows ) {
	const style = structuredClone( attributes?.style ?? {} );
	const update = {};
	for ( const row of rows ) {
		if ( row.presetAttribute ) {
			update[ row.presetAttribute ] = undefined;
		}
		const parent = getValueFromObjectPath( style, row.path.slice( 0, -1 ) );
		if ( parent && typeof parent === 'object' ) {
			delete parent[ row.path[ row.path.length - 1 ] ];
		}
	}
	update.style = cleanEmptyObject( style );
	return update;
}

/**
 * Matches "Where styles come from" rows to the "Apply globally" rows that push
 * them. A style with its own push row matches it; otherwise it matches the
 * grouped row it belongs to, so a border color pushes the whole border.
 *
 * @param {Array<Object>} rows       Style source rows.
 * @param {Array<Object>} changeRows Rows from `getChangesToPush`.
 *
 * @return {Array<Object>} The change rows to push, without duplicates.
 */
export function getChangeRowsFor( rows, changeRows ) {
	const matches = new Set();
	for ( const row of rows ) {
		const match =
			changeRows.find( ( change ) => change.id === row.id ) ??
			changeRows.find( ( change ) =>
				row.id.startsWith( `${ change.id }.` )
			);
		if ( match ) {
			matches.add( match );
		}
	}
	return [ ...matches ];
}

/**
 * Whether a row's value is a color that can show as a swatch.
 *
 * @param {string[]} path Style path.
 *
 * @return {boolean} Whether the path holds a color.
 */
export function isColorPath( path ) {
	return (
		path.includes( 'color' ) &&
		COLOR_PATH_ENDINGS.includes( path[ path.length - 1 ] ) &&
		! path.includes( 'gradient' )
	);
}
