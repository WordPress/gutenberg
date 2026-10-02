import { useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import {
	__EXPERIMENTAL_STYLE_PROPERTY,
	getBlockType,
	store as blocksStore,
} from '@wordpress/blocks';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { getValueFromVariable } from '@wordpress/global-styles-engine';
import { unlock } from '../../lock-unlock';
import { useGlobalStyles } from '../../components/global-styles/hooks';
import { STYLE_LABELS, getStyleLabel } from './style-labels';
import {
	formatStyleValue,
	formatBorderShorthand,
	formatBorderRadius,
	formatSpacingShorthand,
	formatBlockGap,
} from './format-style-value';
import { getStyleSourceLabel } from './get-style-source-label';

const { cleanEmptyObject, useResolvedStyle, useResolvedStyleContext } = unlock(
	blockEditorPrivateApis
);

// Preset block attributes hold a style outside `style`, keyed by the style
// path they stand for and the preset type they encode.
const PRESET_ATTRIBUTES = {
	textColor: { path: 'color.text', type: 'color' },
	backgroundColor: { path: 'color.background', type: 'color' },
	gradient: { path: 'color.gradient', type: 'gradient' },
	fontSize: { path: 'typography.fontSize', type: 'font-size' },
	fontFamily: { path: 'typography.fontFamily', type: 'font-family' },
	borderColor: { path: 'border.color', type: 'color' },
};

// Mirrors the layer order in `resolveStyle`, low to high precedence.
const LAYER_ORDER = [ 'root', 'element', 'block', 'blockVariation' ];

const BORDER_SIDES = [ 'top', 'right', 'bottom', 'left' ];

const LABEL_ORDER = Object.keys( STYLE_LABELS );

const isSet = ( value ) =>
	value !== undefined && value !== null && value !== '';

const getAtPath = ( object, path ) =>
	path.reduce( ( value, key ) => value?.[ key ], object );

// Collects every set leaf path in a style tree. Atomic objects such as a
// background image count as one leaf.
function getLeafPaths( tree, path = [] ) {
	if ( ! tree || typeof tree !== 'object' || Array.isArray( tree ) ) {
		return isSet( tree ) ? [ path ] : [];
	}
	if ( path[ path.length - 1 ] === 'backgroundImage' ) {
		return [ path ];
	}
	return Object.keys( tree ).flatMap( ( key ) =>
		getLeafPaths( tree[ key ], [ ...path, key ] )
	);
}

// Groups a leaf path under the longest labelled style path that contains it,
// so `spacing.padding.top` reads as one "Padding" row.
function getRowKey( leafKey ) {
	const parts = leafKey.split( '.' );
	for ( let length = parts.length; length > 0; length-- ) {
		const candidate = parts.slice( 0, length ).join( '.' );
		if ( STYLE_LABELS[ candidate ] ) {
			return candidate;
		}
	}
	return leafKey;
}

function compareRowKeys( a, b ) {
	const indexA = LABEL_ORDER.indexOf( a );
	const indexB = LABEL_ORDER.indexOf( b );
	if ( indexA !== indexB ) {
		if ( indexA === -1 ) {
			return 1;
		}
		if ( indexB === -1 ) {
			return -1;
		}
		return indexA - indexB;
	}
	return a.localeCompare( b );
}

function formatRowValue( key, value, resolve ) {
	if ( key === 'spacing.padding' || key === 'spacing.margin' ) {
		return formatSpacingShorthand( value, resolve );
	}
	if ( key === 'spacing.blockGap' ) {
		return formatBlockGap( value, resolve );
	}
	if ( key === 'border.radius' ) {
		return formatBorderRadius( value );
	}
	if (
		key === 'border' ||
		BORDER_SIDES.some( ( side ) => key === `border.${ side }` )
	) {
		return formatBorderShorthand( value );
	}
	return formatStyleValue( value );
}

// Whether a row's style path belongs to a style the block supports. Border
// sides are stored per side but supported per property, so any border
// support covers them.
function isSupportedPath( key, supportedPaths ) {
	return supportedPaths.some(
		( supported ) =>
			key === supported ||
			key.startsWith( `${ supported }.` ) ||
			supported.startsWith( `${ key }.` ) ||
			( key.startsWith( 'border.' ) && supported.startsWith( 'border.' ) )
	);
}

/**
 * Builds the rows for the "where styles come from" view of a block.
 *
 * Every value the block sets on itself is a changed row, whether or not it
 * replaces anything: a local value with nothing underneath reads as "Not set
 * in Global Styles". Every inherited value the block does not change is an
 * inherited row, named by the Global Styles layer `resolveStyle` reports.
 * Nothing else is shown, so no row claims a source the engine did not resolve.
 *
 * @param {Object}   options                Options.
 * @param {Object}   options.attributes     Block attributes.
 * @param {Object}   options.inheritedValue Merged value from `useResolvedStyle`.
 * @param {Object}   options.sources        Source map from `useResolvedStyle`, keyed by leaf path.
 * @param {string[]} options.elements       Element layers, low to high precedence.
 * @param {Object}   options.elementStyles  Global Styles `styles.elements`, to tell element layers apart.
 * @param {string[]} options.supportedPaths Style paths the block supports.
 * @param {string}   options.blockTitle     Block title.
 * @param {string}   options.variationLabel Active block style variation label.
 * @param {Function} options.resolve        Resolves a preset value to its real value.
 *
 * @return {{ changed: Object[], inherited: Object[] }} The two row groups.
 */
export function getStyleSourceRows( {
	attributes,
	inheritedValue = {},
	sources = {},
	elements = [],
	elementStyles = {},
	supportedPaths = [],
	blockTitle,
	variationLabel,
	resolve = ( value ) => value,
} ) {
	const style = attributes?.style ?? {};

	// Local leaves, keyed by row. State styles (`:hover`, `@mobile`) and custom
	// CSS are not part of the default cascade, so they are left alone.
	const localRows = new Map();
	Object.keys( style )
		.filter(
			( key ) =>
				key !== 'css' &&
				! key.startsWith( ':' ) &&
				! key.startsWith( '@' )
		)
		.flatMap( ( key ) => getLeafPaths( style[ key ], [ key ] ) )
		.forEach( ( leafPath ) => {
			const rowKey = getRowKey( leafPath.join( '.' ) );
			if ( ! localRows.has( rowKey ) ) {
				localRows.set( rowKey, {
					leafPaths: [],
					presetAttributes: [],
				} );
			}
			localRows.get( rowKey ).leafPaths.push( leafPath );
		} );
	Object.entries( PRESET_ATTRIBUTES ).forEach(
		( [ attributeName, { path } ] ) => {
			if ( ! isSet( attributes?.[ attributeName ] ) ) {
				return;
			}
			if ( ! localRows.has( path ) ) {
				localRows.set( path, { leafPaths: [], presetAttributes: [] } );
			}
			localRows.get( path ).presetAttributes.push( attributeName );
		}
	);

	// Inherited leaves, keyed by row.
	const inheritedLeaves = new Map();
	Object.keys( sources ).forEach( ( leafKey ) => {
		const rowKey = getRowKey( leafKey );
		if ( ! inheritedLeaves.has( rowKey ) ) {
			inheritedLeaves.set( rowKey, [] );
		}
		inheritedLeaves.get( rowKey ).push( leafKey );
	} );

	const getSource = ( rowKey ) => {
		const leafKeys = inheritedLeaves.get( rowKey );
		if ( ! leafKeys?.length ) {
			return null;
		}
		const [ leafKey ] = leafKeys
			.slice()
			.sort(
				( a, b ) =>
					LAYER_ORDER.indexOf( sources[ b ].layer ) -
					LAYER_ORDER.indexOf( sources[ a ].layer )
			);
		const source = { ...sources[ leafKey ] };
		if ( source.layer === 'element' ) {
			const leafPath = leafKey.split( '.' );
			source.element = elements
				.slice()
				.reverse()
				.find( ( element ) =>
					isSet( getAtPath( elementStyles?.[ element ], leafPath ) )
				);
		}
		return source;
	};

	const describeSource = ( rowKey, source ) =>
		getStyleSourceLabel( source, {
			pathKey: rowKey,
			blockTitle,
			variationLabel,
		} );

	const changed = [ ...localRows.entries() ].map(
		( [ key, { leafPaths, presetAttributes } ] ) => {
			const path = key.split( '.' );
			const presetAttribute = presetAttributes[ 0 ];
			const localValue = presetAttribute
				? `var:preset|${ PRESET_ATTRIBUTES[ presetAttribute ].type }|${ attributes[ presetAttribute ] }`
				: getAtPath( style, path );
			const inherited = getAtPath( inheritedValue, path );
			const source = isSet( inherited ) ? getSource( key ) : null;
			return {
				id: key,
				path,
				label: getStyleLabel( path ),
				value: formatRowValue( key, localValue, resolve ),
				colorValue: path.includes( 'color' )
					? resolve( localValue )
					: undefined,
				isOverride: !! source,
				replacedValue: source
					? formatRowValue( key, inherited, resolve )
					: undefined,
				sourceLabel: describeSource( key, source ),
				leafPaths,
				presetAttributes,
			};
		}
	);

	const inherited = [ ...inheritedLeaves.keys() ]
		.filter(
			( key ) =>
				! localRows.has( key ) &&
				// The `elements` sub-tree is a passthrough for nested element
				// controls, not a style of the block itself.
				! key.startsWith( 'elements.' ) &&
				isSupportedPath( key, supportedPaths )
		)
		.map( ( key ) => {
			const path = key.split( '.' );
			const value = getAtPath( inheritedValue, path );
			return {
				id: key,
				path,
				label: getStyleLabel( path ),
				value: formatRowValue( key, value, resolve ),
				colorValue: path.includes( 'color' )
					? resolve( value )
					: undefined,
				sourceLabel: describeSource( key, getSource( key ) ),
			};
		} );

	const byKey = ( a, b ) => compareRowKeys( a.id, b.id );
	return {
		changed: changed.sort( byKey ),
		inherited: inherited.sort( byKey ),
	};
}

/**
 * Returns the attributes that reset the given changed rows, so each control
 * falls back to the inherited value its row shows. Paths outside the rows,
 * such as `style.css` and state styles, are kept.
 *
 * @param {Object}   attributes Block attributes.
 * @param {Object[]} rows       Changed rows from `getStyleSourceRows`.
 *
 * @return {Object} Attributes to pass to `setAttributes`.
 */
export function getResetAttributes( attributes, rows ) {
	const style = structuredClone( attributes?.style ?? {} );
	const nextAttributes = {};
	rows.forEach( ( { leafPaths, presetAttributes } ) => {
		leafPaths.forEach( ( leafPath ) => {
			const parent = getAtPath( style, leafPath.slice( 0, -1 ) );
			if ( parent ) {
				delete parent[ leafPath[ leafPath.length - 1 ] ];
			}
		} );
		presetAttributes.forEach( ( attributeName ) => {
			nextAttributes[ attributeName ] = undefined;
		} );
	} );
	nextAttributes.style = cleanEmptyObject( style );
	return nextAttributes;
}

/**
 * Hook: the changed and inherited style rows for a block.
 *
 * @param {string} name       Block name.
 * @param {Object} attributes Block attributes.
 *
 * @return {{ changed: Object[], inherited: Object[], variationLabel: ?string }} Rows and the active variation label.
 */
export function useStyleSourceRows( name, attributes ) {
	const { className } = attributes;
	const { value: inheritedValue, sources } = useResolvedStyle(
		name,
		className
	);
	const { variationName, elements } = useResolvedStyleContext(
		name,
		className
	);
	const { merged } = useGlobalStyles();
	const supports = useSelect(
		( select ) =>
			unlock( select( blocksStore ) ).getSupportedStyles( name ),
		[ name ]
	);
	const variationLabel = useSelect(
		( select ) =>
			variationName
				? ( select( blocksStore )
						.getBlockStyles( name )
						?.find(
							( blockStyle ) => blockStyle.name === variationName
						)?.label ?? variationName )
				: null,
		[ name, variationName ]
	);

	return useMemo( () => {
		const supportedPaths = supports
			.map( ( key ) => __EXPERIMENTAL_STYLE_PROPERTY[ key ]?.value )
			.filter( Boolean )
			.map( ( path ) => path.join( '.' ) );
		const resolve = ( value ) =>
			getValueFromVariable( merged, name, value );
		return {
			...getStyleSourceRows( {
				attributes,
				inheritedValue,
				sources,
				elements,
				elementStyles: merged?.styles?.elements,
				supportedPaths,
				blockTitle: getBlockType( name )?.title,
				variationLabel,
				resolve,
			} ),
			variationLabel,
		};
	}, [
		attributes,
		inheritedValue,
		sources,
		elements,
		merged,
		supports,
		name,
		variationLabel,
	] );
}
