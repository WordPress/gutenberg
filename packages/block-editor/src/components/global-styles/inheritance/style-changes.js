import {
	__EXPERIMENTAL_STYLE_PROPERTY,
	getBlockSupport,
	getBlockType,
	store as blocksStore,
} from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { store as blockEditorStore } from '../../../store';
import { getValueFromObjectPath } from '../../../utils/object';
import {
	useResolvedStyle,
	useResolvedStyleContext,
} from '../inherited-value-context';
import { getStyleSourceLabel } from './source-label';
import { getLocalStyle, getStyleChangeRows } from './style-change-rows';

const BORDER_SIDES = [ 'top', 'right', 'bottom', 'left' ];

/**
 * Style paths a row can be listed for, with the block support that enables
 * each. Per-side border paths collapse to their side (`border.top`), matching
 * the labels in `getStyleLabel`. `filter.duotone` is left out: a block stores
 * duotone under `color.duotone`, so its local value would never line up.
 */
const STYLE_PATHS = ( () => {
	const properties = {
		...__EXPERIMENTAL_STYLE_PROPERTY,
		blockGap: {
			value: [ 'spacing', 'blockGap' ],
			support: [ 'spacing', 'blockGap' ],
		},
		shadow: { value: [ 'shadow' ], support: [ 'shadow' ] },
	};
	const paths = new Map();
	for ( const { value, support } of Object.values( properties ) ) {
		const path =
			value[ 0 ] === 'border' && BORDER_SIDES.includes( value[ 1 ] )
				? value.slice( 0, 2 )
				: value;
		const key = path.join( '.' );
		if (
			key === 'color.link' ||
			key === 'filter.duotone' ||
			paths.has( key )
		) {
			continue;
		}
		paths.set( key, { path, support } );
	}
	return [ ...paths.values() ];
} )();

/**
 * Whether a block supports the control for a style path.
 *
 * @param {string}   blockName Block name.
 * @param {string[]} support   Block support path.
 * @return {boolean} Whether the support is on.
 */
function isSupported( blockName, support ) {
	const value = getBlockSupport( blockName, support );
	if ( value ) {
		return true;
	}
	// Text and background colour are on by default once color support is.
	if (
		support[ 0 ] === 'color' &&
		( support[ 1 ] === 'text' || support[ 1 ] === 'background' )
	) {
		return value !== false && !! getBlockSupport( blockName, 'color' );
	}
	return false;
}

/**
 * Finds which element layer supplied a leaf, highest precedence first, by
 * reading the same Global Styles data `resolveStyle` merged.
 *
 * @param {?Object}  globalStyles Global Styles config.
 * @param {string[]} elements     Element layers, low to high precedence.
 * @param {string}   leafKey      Leaf path joined with dots.
 * @return {?string} Element name, or `undefined`.
 */
function findElementForLeaf( globalStyles, elements, leafKey ) {
	return [ ...elements ]
		.reverse()
		.find(
			( element ) =>
				getValueFromObjectPath(
					globalStyles?.styles?.elements?.[ element ],
					leafKey
				) !== undefined
		);
}

/**
 * Hook: the style change rows for a block, in the default style state. Must
 * render inside a `BlockEditContextProvider` for the block, as
 * `useResolvedStyle` reads the client ID from it.
 *
 * @param {string} clientId Block client ID.
 * @return {Array} Rows from `getStyleChangeRows`.
 */
export function useStyleChangeRows( clientId ) {
	const { blockName, attributes, registeredStyles } = useSelect(
		( select ) => {
			const name = select( blockEditorStore ).getBlockName( clientId );
			return {
				blockName: name,
				attributes:
					select( blockEditorStore ).getBlockAttributes( clientId ),
				registeredStyles: name
					? select( blocksStore ).getBlockStyles( name )
					: undefined,
			};
		},
		[ clientId ]
	);
	const className = attributes?.className;
	const { value: inheritedStyle, sources } = useResolvedStyle(
		blockName,
		className
	);
	const { globalStyles, elements, variationName } = useResolvedStyleContext(
		blockName,
		className
	);

	return useMemo( () => {
		if ( ! blockName ) {
			return [];
		}
		const blockTitle = getBlockType( blockName )?.title;
		const variationLabel = registeredStyles?.find(
			( style ) => style.name === variationName
		)?.label;
		return getStyleChangeRows( {
			paths: STYLE_PATHS.map( ( { path, support } ) => ( {
				path,
				isSupported: isSupported( blockName, support ),
			} ) ),
			localStyle: getLocalStyle( attributes ),
			inheritedStyle,
			sources,
			describeSource: ( source, { path, leafKey } ) =>
				getStyleSourceLabel( source, {
					path,
					blockTitle,
					variationLabel,
					elementName:
						source.layer === 'element'
							? findElementForLeaf(
									globalStyles,
									elements,
									leafKey
								)
							: undefined,
				} ),
		} );
	}, [
		blockName,
		attributes,
		registeredStyles,
		inheritedStyle,
		sources,
		globalStyles,
		elements,
		variationName,
	] );
}
