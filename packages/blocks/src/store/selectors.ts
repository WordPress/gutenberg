/**
 * External dependencies
 */
import removeAccents from 'remove-accents';

/**
 * WordPress dependencies
 */
import { createSelector } from '@wordpress/data';
import { RichTextData } from '@wordpress/rich-text';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import { getValueFromObjectPath, matchesAttributes } from './utils';
import { hasContentRoleAttribute as privateHasContentRoleAttribute } from './private-selectors';
import type {
	BlockType,
	BlockVariation,
	BlockVariationScope,
	BlockCategory,
	BlockCollection,
	BlockStyle,
} from '../types';
import type { BlockStoreState } from './types';

/**
 * Given a block name or block type object, returns the corresponding
 * normalized block type object.
 *
 * @param state      Blocks state.
 * @param nameOrType Block name or type object
 *
 * @return Block type object.
 */
const getNormalizedBlockType = (
	state: BlockStoreState,
	nameOrType: string | BlockType
): BlockType | undefined =>
	'string' === typeof nameOrType
		? getBlockType( state, nameOrType )
		: nameOrType;

/**
 * Returns all the available block types.
 *
 * @param state Data state.
 *
 * @example
 * ```js
 * import { store as blocksStore } from '@wordpress/blocks';
 * import { useSelect } from '@wordpress/data';
 *
 * const ExampleComponent = () => {
 *     const blockTypes = useSelect(
 *         ( select ) => select( blocksStore ).getBlockTypes(),
 *         []
 *     );
 *
 *     return (
 *         <ul>
 *             { blockTypes.map( ( block ) => (
 *                 <li key={ block.name }>{ block.title }</li>
 *             ) ) }
 *         </ul>
 *     );
 * };
 * ```
 *
 * @return Block Types.
 */
export const getBlockTypes = createSelector(
	( state: BlockStoreState ): BlockType[] =>
		Object.values( state.blockTypes ),
	( state: BlockStoreState ) => [ state.blockTypes ]
);

/**
 * Returns a block type by name.
 *
 * @param state Data state.
 * @param name  Block type name.
 *
 * @example
 * ```js
 * import { store as blocksStore } from '@wordpress/blocks';
 * import { useSelect } from '@wordpress/data';
 *
 * const ExampleComponent = () => {
 *     const paragraphBlock = useSelect( ( select ) =>
 *         ( select ) => select( blocksStore ).getBlockType( 'core/paragraph' ),
 *         []
 *     );
 *
 *     return (
 *         <ul>
 *             { paragraphBlock &&
 *                 Object.entries( paragraphBlock.supports ).map(
 *                     ( blockSupportsEntry ) => {
 *                         const [ propertyName, value ] = blockSupportsEntry;
 *                         return (
 *                             <li
 *                                 key={ propertyName }
 *                             >{ `${ propertyName } : ${ value }` }</li>
 *                         );
 *                     }
 *                 ) }
 *         </ul>
 *     );
 * };
 * ```
 *
 * @return Block Type.
 */
export function getBlockType(
	state: BlockStoreState,
	name: string
): BlockType | undefined {
	return state.blockTypes[ name ];
}

/**
 * Returns block styles by block name.
 *
 * @param state Data state.
 * @param name  Block type name.
 *
 * @example
 * ```js
 * import { store as blocksStore } from '@wordpress/blocks';
 * import { useSelect } from '@wordpress/data';
 *
 * const ExampleComponent = () => {
 *     const buttonBlockStyles = useSelect( ( select ) =>
 *         select( blocksStore ).getBlockStyles( 'core/button' ),
 *         []
 *     );
 *
 *     return (
 *         <ul>
 *             { buttonBlockStyles &&
 *                 buttonBlockStyles.map( ( style ) => (
 *                     <li key={ style.name }>{ style.label }</li>
 *                 ) ) }
 *         </ul>
 *     );
 * };
 * ```
 *
 * @return Block Styles.
 */
export function getBlockStyles(
	state: BlockStoreState,
	name: string
): BlockStyle[] {
	return state.blockStyles[ name ];
}

/**
 * Returns block variations by block name.
 *
 * @param state     Data state.
 * @param blockName Block type name.
 * @param scope     Block variation scope name.
 *
 * @example
 * ```js
 * import { store as blocksStore } from '@wordpress/blocks';
 * import { useSelect } from '@wordpress/data';
 *
 * const ExampleComponent = () => {
 *     const socialLinkVariations = useSelect( ( select ) =>
 *         select( blocksStore ).getBlockVariations( 'core/social-link' ),
 *         []
 *     );
 *
 *     return (
 *         <ul>
 *             { socialLinkVariations &&
 *                 socialLinkVariations.map( ( variation ) => (
 *                     <li key={ variation.name }>{ variation.title }</li>
 *             ) ) }
 *     </ul>
 *     );
 * };
 * ```
 *
 * @return Block variations.
 */
export const getBlockVariations = createSelector(
	(
		state: BlockStoreState,
		blockName: string,
		scope?: BlockVariationScope
	): BlockVariation[] | undefined => {
		const variations = state.blockVariations[ blockName ];
		if ( ! variations || ! scope ) {
			return variations;
		}
		return variations.filter( ( variation ) => {
			// For backward compatibility reasons, variation's scope defaults to
			// `block` and `inserter` when not set.
			return ( variation.scope || [ 'block', 'inserter' ] ).includes(
				scope
			);
		} );
	},
	( state: BlockStoreState, blockName: string ) => [
		state.blockVariations[ blockName ],
	]
);

/**
 * Returns the active block variation for a given block based on its attributes.
 * Variations are determined by their `isActive` property.
 * Which is either an array of block attribute keys or a function.
 *
 * In case of an array of block attribute keys, the `attributes` are compared
 * to the variation's attributes using strict equality check.
 *
 * In case of function type, the function should accept a block's attributes
 * and the variation's attributes and determines if a variation is active.
 * A function that accepts a block's attributes and the variation's attributes and determines if a variation is active.
 *
 * @param state      Data state.
 * @param blockName  Name of block (example: "core/columns").
 * @param attributes Block attributes used to determine active variation.
 * @param scope      Block variation scope name.
 *
 * @example
 * ```js
 * import { __ } from '@wordpress/i18n';
 * import { store as blocksStore } from '@wordpress/blocks';
 * import { store as blockEditorStore } from '@wordpress/block-editor';
 * import { useSelect } from '@wordpress/data';
 *
 * const ExampleComponent = () => {
 *     // This example assumes that a core/embed block is the first block in the Block Editor.
 *     const activeBlockVariation = useSelect( ( select ) => {
 *         // Retrieve the list of blocks.
 *         const [ firstBlock ] = select( blockEditorStore ).getBlocks()
 *
 *         // Return the active block variation for the first block.
 *         return select( blocksStore ).getActiveBlockVariation(
 *             firstBlock.name,
 *             firstBlock.attributes
 *         );
 *     }, [] );
 *
 *     return activeBlockVariation && activeBlockVariation.name === 'spotify' ? (
 *         <p>{ __( 'Spotify variation' ) }</p>
 *         ) : (
 *         <p>{ __( 'Other variation' ) }</p>
 *     );
 * };
 * ```
 *
 * @return Active block variation.
 */
export function getActiveBlockVariation(
	state: BlockStoreState,
	blockName: string,
	attributes: Record< string, unknown >,
	scope?: BlockVariationScope
): BlockVariation | undefined {
	const variations = getBlockVariations( state, blockName, scope );

	if ( ! variations ) {
		return variations;
	}

	const blockType = getBlockType( state, blockName );
	const attributeKeys = Object.keys( blockType?.attributes || {} );
	let match: BlockVariation | undefined;
	let maxMatchedAttributes = 0;

	for ( const variation of variations ) {
		if ( Array.isArray( variation.isActive ) ) {
			const definedAttributes = variation.isActive.filter(
				( attribute ) => {
					// We support nested attribute paths, e.g. `layout.type`.
					// In this case, we need to check if the part before the
					// first dot is a known attribute.
					const topLevelAttribute = attribute.split( '.' )[ 0 ];
					return attributeKeys.includes( topLevelAttribute );
				}
			);
			const definedAttributesLength = definedAttributes.length;
			if ( definedAttributesLength === 0 ) {
				continue;
			}
			const isMatch = definedAttributes.every( ( attribute ) => {
				const variationAttributeValue = getValueFromObjectPath(
					variation.attributes as Record< string, unknown >,
					attribute
				);
				if ( variationAttributeValue === undefined ) {
					return false;
				}
				let blockAttributeValue = getValueFromObjectPath(
					attributes,
					attribute
				);
				if ( blockAttributeValue instanceof RichTextData ) {
					blockAttributeValue = blockAttributeValue.toHTMLString();
				}
				return matchesAttributes(
					blockAttributeValue,
					variationAttributeValue
				);
			} );
			if ( isMatch && definedAttributesLength > maxMatchedAttributes ) {
				match = variation;
				maxMatchedAttributes = definedAttributesLength;
			}
		} else if (
			variation.isActive?.(
				attributes,
				variation.attributes as Record< string, unknown >
			)
		) {
			// If isActive is a function, we cannot know how many attributes it matches.
			// This means that we cannot compare the specificity of our matches,
			// and simply return the best match we have found.
			return match || variation;
		}
	}

	// If no variation matches the isActive condition, we return the default variation,
	// but only if it doesn't have an isActive condition that wasn't matched.
	// This fallback is only applied for the 'block' and 'transform' scopes but not to
	// the 'inserter', to avoid affecting block name display there.
	if ( ! match && [ 'block', 'transform' ].includes( scope as string ) ) {
		match = variations.find(
			( variation ) =>
				variation?.isDefault && ! Object.hasOwn( variation, 'isActive' )
		);
	}
	return match;
}

/**
 * Returns the default block variation for the given block type.
 * When there are multiple variations annotated as the default one,
 * the last added item is picked. This simplifies registering overrides.
 * When there is no default variation set, it returns the first item.
 *
 * @param state     Data state.
 * @param blockName Block type name.
 * @param scope     Block variation scope name.
 *
 * @example
 * ```js
 * import { __, sprintf } from '@wordpress/i18n';
 * import { store as blocksStore } from '@wordpress/blocks';
 * import { useSelect } from '@wordpress/data';
 *
 * const ExampleComponent = () => {
 *     const defaultEmbedBlockVariation = useSelect( ( select ) =>
 *         select( blocksStore ).getDefaultBlockVariation( 'core/embed' ),
 *         []
 *     );
 *
 *     return (
 *         defaultEmbedBlockVariation && (
 *             <p>
 *                 { sprintf(
 *                     __( 'core/embed default variation: %s' ),
 *                     defaultEmbedBlockVariation.title
 *                 ) }
 *             </p>
 *         )
 *     );
 * };
 * ```
 *
 * @return The default block variation.
 */
export function getDefaultBlockVariation(
	state: BlockStoreState,
	blockName: string,
	scope?: BlockVariationScope
): BlockVariation | undefined {
	const variations = getBlockVariations( state, blockName, scope );

	const defaultVariation = [ ...( variations || [] ) ]
		.reverse()
		.find( ( { isDefault } ) => !! isDefault );

	return defaultVariation || variations?.[ 0 ];
}

/**
 * Returns all the available block categories.
 *
 * @param state Data state.
 *
 * @example
 * ```js
 * import { store as blocksStore } from '@wordpress/blocks';
 * import { useSelect, } from '@wordpress/data';
 *
 * const ExampleComponent = () => {
 *     const blockCategories = useSelect( ( select ) =>
 *         select( blocksStore ).getCategories(),
 *         []
 *     );
 *
 *     return (
 *         <ul>
 *             { blockCategories.map( ( category ) => (
 *                 <li key={ category.slug }>{ category.title }</li>
 *             ) ) }
 *         </ul>
 *     );
 * };
 * ```
 *
 * @return Categories list.
 */
export function getCategories( state: BlockStoreState ): BlockCategory[] {
	return state.categories;
}

/**
 * Returns all the available collections.
 *
 * @param state Data state.
 *
 * @example
 * ```js
 * import { store as blocksStore } from '@wordpress/blocks';
 * import { useSelect } from '@wordpress/data';
 *
 * const ExampleComponent = () => {
 *     const blockCollections = useSelect( ( select ) =>
 *         select( blocksStore ).getCollections(),
 *         []
 *     );
 *
 *     return (
 *         <ul>
 *             { Object.values( blockCollections ).length > 0 &&
 *                 Object.values( blockCollections ).map( ( collection ) => (
 *                     <li key={ collection.title }>{ collection.title }</li>
 *             ) ) }
 *         </ul>
 *     );
 * };
 * ```
 *
 * @return Collections list.
 */
export function getCollections(
	state: BlockStoreState
): Record< string, BlockCollection > {
	return state.collections;
}

/**
 * Returns the name of the default block name.
 *
 * @param state Data state.
 *
 * @example
 * ```js
 * import { __, sprintf } from '@wordpress/i18n';
 * import { store as blocksStore } from '@wordpress/blocks';
 * import { useSelect } from '@wordpress/data';
 *
 * const ExampleComponent = () => {
 *     const defaultBlockName = useSelect( ( select ) =>
 *         select( blocksStore ).getDefaultBlockName(),
 *         []
 *     );
 *
 *     return (
 *         defaultBlockName && (
 *             <p>
 *                 { sprintf( __( 'Default block name: %s' ), defaultBlockName ) }
 *             </p>
 *         )
 *     );
 * };
 * ```
 *
 * @return Default block name.
 */
export function getDefaultBlockName( state: BlockStoreState ): string | null {
	return state.defaultBlockName;
}

/**
 * Returns the name of the block for handling non-block content.
 *
 * @param state Data state.
 *
 * @example
 * ```js
 * import { __, sprintf } from '@wordpress/i18n';
 * import { store as blocksStore } from '@wordpress/blocks';
 * import { useSelect } from '@wordpress/data';
 *
 * const ExampleComponent = () => {
 *     const freeformFallbackBlockName = useSelect( ( select ) =>
 *         select( blocksStore ).getFreeformFallbackBlockName(),
 *         []
 *     );
 *
 *     return (
 *         freeformFallbackBlockName && (
 *             <p>
 *                 { sprintf( __(
 *                     'Freeform fallback block name: %s' ),
 *                     freeformFallbackBlockName
 *                 ) }
 *             </p>
 *         )
 *     );
 * };
 * ```
 *
 * @return Name of the block for handling non-block content.
 */
export function getFreeformFallbackBlockName(
	state: BlockStoreState
): string | null {
	return state.freeformFallbackBlockName;
}

/**
 * Returns the name of the block for handling unregistered blocks.
 *
 * @param state Data state.
 *
 * @example
 * ```js
 * import { __, sprintf } from '@wordpress/i18n';
 * import { store as blocksStore } from '@wordpress/blocks';
 * import { useSelect } from '@wordpress/data';
 *
 * const ExampleComponent = () => {
 *     const unregisteredFallbackBlockName = useSelect( ( select ) =>
 *         select( blocksStore ).getUnregisteredFallbackBlockName(),
 *         []
 *     );
 *
 *     return (
 *         unregisteredFallbackBlockName && (
 *             <p>
 *                 { sprintf( __(
 *                     'Unregistered fallback block name: %s' ),
 *                     unregisteredFallbackBlockName
 *                 ) }
 *             </p>
 *         )
 *     );
 * };
 * ```
 *
 * @return Name of the block for handling unregistered blocks.
 */
export function getUnregisteredFallbackBlockName(
	state: BlockStoreState
): string | null {
	return state.unregisteredFallbackBlockName;
}

/**
 * Returns the name of the block for handling the grouping of blocks.
 *
 * @param state Data state.
 *
 * @example
 * ```js
 * import { __, sprintf } from '@wordpress/i18n';
 * import { store as blocksStore } from '@wordpress/blocks';
 * import { useSelect } from '@wordpress/data';
 *
 * const ExampleComponent = () => {
 *     const groupingBlockName = useSelect( ( select ) =>
 *         select( blocksStore ).getGroupingBlockName(),
 *         []
 *     );
 *
 *     return (
 *         groupingBlockName && (
 *             <p>
 *                 { sprintf(
 *                     __( 'Default grouping block name: %s' ),
 *                     groupingBlockName
 *                 ) }
 *             </p>
 *         )
 *     );
 * };
 * ```
 *
 * @return Name of the block for handling the grouping of blocks.
 */
export function getGroupingBlockName( state: BlockStoreState ): string | null {
	return state.groupingBlockName;
}

/**
 * Returns an array with the child blocks of a given block.
 *
 * @param state     Data state.
 * @param blockName Block type name.
 *
 * @example
 * ```js
 * import { store as blocksStore } from '@wordpress/blocks';
 * import { useSelect } from '@wordpress/data';
 *
 * const ExampleComponent = () => {
 *     const childBlockNames = useSelect( ( select ) =>
 *         select( blocksStore ).getChildBlockNames( 'core/navigation' ),
 *         []
 *     );
 *
 *     return (
 *         <ul>
 *             { childBlockNames &&
 *                 childBlockNames.map( ( child ) => (
 *                     <li key={ child }>{ child }</li>
 *             ) ) }
 *         </ul>
 *     );
 * };
 * ```
 *
 * @return Array of child block names.
 */
export const getChildBlockNames = createSelector(
	( state: BlockStoreState, blockName: string ): string[] => {
		return getBlockTypes( state )
			.filter( ( blockType ) => {
				return blockType.parent?.includes( blockName );
			} )
			.map( ( { name } ) => name );
	},
	( state: BlockStoreState ) => [ state.blockTypes ]
);

/**
 * Returns the block support value for a feature, if defined.
 *
 * @param state           Data state.
 * @param nameOrType      Block name or type object
 * @param feature         Feature to retrieve
 * @param defaultSupports Default value to return if not
 *                        explicitly defined
 *
 * @example
 * ```js
 * import { __, sprintf } from '@wordpress/i18n';
 * import { store as blocksStore } from '@wordpress/blocks';
 * import { useSelect } from '@wordpress/data';
 *
 * const ExampleComponent = () => {
 *     const paragraphBlockSupportValue = useSelect( ( select ) =>
 *         select( blocksStore ).getBlockSupport( 'core/paragraph', 'anchor' ),
 *         []
 *     );
 *
 *     return (
 *         <p>
 *             { sprintf(
 *                 __( 'core/paragraph supports.anchor value: %s' ),
 *                 paragraphBlockSupportValue
 *             ) }
 *         </p>
 *     );
 * };
 * ```
 *
 * @return Block support value
 */
export const getBlockSupport = (
	state: BlockStoreState,
	nameOrType: string | BlockType,
	feature: string | string[],
	defaultSupports?: unknown
): unknown => {
	const blockType = getNormalizedBlockType( state, nameOrType );
	if ( ! blockType?.supports ) {
		return defaultSupports;
	}

	return getValueFromObjectPath(
		blockType.supports,
		feature,
		defaultSupports
	);
};

/**
 * Returns true if the block defines support for a feature, or false otherwise.
 *
 * @param state           Data state.
 * @param nameOrType      Block name or type object.
 * @param feature         Feature to test.
 * @param defaultSupports Whether feature is supported by
 *                        default if not explicitly defined.
 *
 * @example
 * ```js
 * import { __, sprintf } from '@wordpress/i18n';
 * import { store as blocksStore } from '@wordpress/blocks';
 * import { useSelect } from '@wordpress/data';
 *
 * const ExampleComponent = () => {
 *     const paragraphBlockSupportClassName = useSelect( ( select ) =>
 *         select( blocksStore ).hasBlockSupport( 'core/paragraph', 'className' ),
 *         []
 *     );
 *
 *     return (
 *         <p>
 *             { sprintf(
 *                 __( 'core/paragraph supports custom class name?: %s' ),
 *                 paragraphBlockSupportClassName
 *             ) }
 *         /p>
 *     );
 * };
 * ```
 *
 * @return Whether block supports feature.
 */
export function hasBlockSupport(
	state: BlockStoreState,
	nameOrType: string | BlockType,
	feature: string | string[],
	defaultSupports?: unknown
): boolean {
	return !! getBlockSupport( state, nameOrType, feature, defaultSupports );
}

/**
 * Normalizes a search term string: removes accents, converts to lowercase, removes extra whitespace.
 *
 * @param term Search term to normalize.
 * @return Normalized search term.
 */
function getNormalizedSearchTerm( term?: string | null ): string {
	return removeAccents( term ?? '' )
		.toLowerCase()
		.trim();
}

/**
 * Returns true if the block type by the given name or object value matches a
 * search term, or false otherwise.
 *
 * @param state      Blocks state.
 * @param nameOrType Block name or type object.
 * @param searchTerm Search term by which to filter.
 *
 * @example
 * ```js
 * import { __, sprintf } from '@wordpress/i18n';
 * import { store as blocksStore } from '@wordpress/blocks';
 * import { useSelect } from '@wordpress/data';
 *
 * const ExampleComponent = () => {
 *     const termFound = useSelect(
 *         ( select ) =>
 *             select( blocksStore ).isMatchingSearchTerm(
 *                 'core/navigation',
 *                 'theme'
 *             ),
 *             []
 *         );
 *
 *     return (
 *         <p>
 *             { sprintf(
 *                 __(
 *                     'Search term was found in the title, keywords, category or description in block.json: %s'
 *                 ),
 *                 termFound
 *             ) }
 *         </p>
 *     );
 * };
 * ```
 *
 * @return Whether block type matches search term.
 */
export function isMatchingSearchTerm(
	state: BlockStoreState,
	nameOrType: string | BlockType,
	searchTerm: string = ''
): boolean {
	const blockType = getNormalizedBlockType( state, nameOrType );
	const normalizedSearchTerm = getNormalizedSearchTerm( searchTerm );

	const isSearchMatch = ( candidate?: string | null ): boolean =>
		getNormalizedSearchTerm( candidate ).includes( normalizedSearchTerm );

	return ( isSearchMatch( blockType?.title ) ||
		blockType?.keywords?.some( isSearchMatch ) ||
		isSearchMatch( blockType?.category ) ||
		( typeof blockType?.description === 'string' &&
			isSearchMatch( blockType.description ) ) ) as boolean;
}

/**
 * Returns a boolean indicating if a block has child blocks or not.
 *
 * @param state     Data state.
 * @param blockName Block type name.
 *
 * @example
 * ```js
 * import { __, sprintf } from '@wordpress/i18n';
 * import { store as blocksStore } from '@wordpress/blocks';
 * import { useSelect } from '@wordpress/data';
 *
 * const ExampleComponent = () => {
 *     const navigationBlockHasChildBlocks = useSelect( ( select ) =>
 *         select( blocksStore ).hasChildBlocks( 'core/navigation' ),
 *         []
 *     );
 *
 *     return (
 *         <p>
 *             { sprintf(
 *                 __( 'core/navigation has child blocks: %s' ),
 *                 navigationBlockHasChildBlocks
 *             ) }
 *         </p>
 *     );
 * };
 * ```
 *
 * @return True if a block contains child blocks and false otherwise.
 */
export const hasChildBlocks = (
	state: BlockStoreState,
	blockName: string
): boolean => {
	return getChildBlockNames( state, blockName ).length > 0;
};

/**
 * Returns a boolean indicating if a block has at least one child block with inserter support.
 *
 * @param state     Data state.
 * @param blockName Block type name.
 *
 * @example
 * ```js
 * import { __, sprintf } from '@wordpress/i18n';
 * import { store as blocksStore } from '@wordpress/blocks';
 * import { useSelect } from '@wordpress/data';
 *
 * const ExampleComponent = () => {
 *     const navigationBlockHasChildBlocksWithInserterSupport = useSelect( ( select ) =>
 *         select( blocksStore ).hasChildBlocksWithInserterSupport(
 *             'core/navigation'
 *         ),
 *         []
 *     );
 *
 *     return (
 *         <p>
 *             { sprintf(
 *                 __( 'core/navigation has child blocks with inserter support: %s' ),
 *                 navigationBlockHasChildBlocksWithInserterSupport
 *             ) }
 *         </p>
 *     );
 * };
 * ```
 *
 * @return True if a block contains at least one child blocks with inserter support
 *                   and false otherwise.
 */
export const hasChildBlocksWithInserterSupport = (
	state: BlockStoreState,
	blockName: string
): boolean => {
	return getChildBlockNames( state, blockName ).some( ( childBlockName ) => {
		return hasBlockSupport( state, childBlockName, 'inserter', true );
	} );
};

export const __experimentalHasContentRoleAttribute = (
	...args: Parameters< typeof privateHasContentRoleAttribute >
): ReturnType< typeof privateHasContentRoleAttribute > => {
	deprecated( '__experimentalHasContentRoleAttribute', {
		since: '6.7',
		version: '6.8',
		hint: 'This is a private selector.',
	} );
	return privateHasContentRoleAttribute( ...args );
};
