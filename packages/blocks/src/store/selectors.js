/**
 * External dependencies
 */
import createSelector from 'rememo';
import removeAccents from 'remove-accents';

/**
 * WordPress dependencies
 */
import { pipe } from '@wordpress/compose';

import { getValueFromObjectPath } from './utils';

/**
 * @typedef {import('../types').BlockAttribute<any>} BlockAttribute
 * @typedef {import('../types').BlockAttributes} BlockAttributes
 * @typedef {import('../types').BlockCategory} BlockCategory
 * @typedef {import('../types').BlockCollection} BlockCollection
 * @typedef {import('../types').BlockVariation} BlockVariation
 * @typedef {import('../types').BlockVariationScope} BlockVariationScope
 * @typedef {import('../types').BlockStyle} BlockStyle
 * @typedef {import('../types').BlockSupports} BlockSupports
 * @typedef {import('../types').BlockType} BlockType
 * @typedef {import('../types').InnerBlockTemplate} InnerBlockTemplate
 * @typedef {import('./types').BlockStoreState} BlockStoreState
 */

/**
 * Given a block name or block type object, returns the corresponding
 * normalized block type object.
 *
 * @param {BlockStoreState}  state      Blocks state.
 * @param {string|BlockType} nameOrType Block name or type object
 *
 * @return {BlockType|undefined} Block type object.
 */
const getNormalizedBlockType = ( state, nameOrType ) =>
	'string' === typeof nameOrType
		? getBlockType( state, nameOrType )
		: nameOrType;

/**

/**
 * Returns all the available block types.
 *
 * @param {BlockStoreState} state Data state.
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
 * @return {BlockType[]} Block Types.
 */
export const getBlockTypes = createSelector(
	( state ) => Object.values( state.blockTypes ),
	( state ) => [ state.blockTypes ]
);

/**
 * Returns a block type by name.
 *
 * @param {BlockStoreState} state Data state.
 * @param {string}          name  Block type name.
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
 * @return {BlockType|undefined} Block Type.
 */
export function getBlockType( state, name ) {
	return state.blockTypes[ name ];
}

/**
 * Returns block styles by block name.
 *
 * @param {BlockStoreState} state Data state.
 * @param {string}          name  Block type name.
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
 * @return {BlockStyle[]|undefined} Block Styles.
 */
export function getBlockStyles( state, name ) {
	return state.blockStyles[ name ];
}

/**
 * Returns block variations by block name.
 *
 * @param {BlockStoreState}      state     Data state.
 * @param {string}               blockName Block type name.
 * @param {BlockVariationScope=} scope     Block variation scope name.
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
 * @return {(BlockVariation[]|undefined) & EnhancedSelector} Block variations.
 */
export const getBlockVariations = createSelector(
	( state, blockName, scope ) => {
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
	( state, blockName ) => [ state.blockVariations[ blockName ] ]
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
 * @param {BlockStoreState}      state      Data state.
 * @param {string}               blockName  Name of block (example: “core/columns”).
 * @param {BlockAttributes}      attributes Block attributes used to determine active variation.
 * @param {BlockVariationScope=} scope      Block variation scope name.
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
 * @return {BlockVariation|undefined} Active block variation.
 */
export function getActiveBlockVariation( state, blockName, attributes, scope ) {
	const variations = getBlockVariations( state, blockName, scope );

	const match = variations?.find( ( variation ) => {
		if ( Array.isArray( variation.isActive ) ) {
			const blockType = getBlockType( state, blockName );
			const attributeKeys = Object.keys( blockType?.attributes || {} );
			const definedAttributes = variation.isActive.filter(
				( attribute ) => attributeKeys.includes( attribute )
			);
			if ( definedAttributes.length === 0 ) {
				return false;
			}
			return definedAttributes.every(
				( attribute ) =>
					attributes[ attribute ] ===
					variation.attributes[ attribute ]
			);
		}

		return variation.isActive?.( attributes, variation.attributes );
	} );

	return match;
}

/**
 * Returns the default block variation for the given block type.
 * When there are multiple variations annotated as the default one,
 * the last added item is picked. This simplifies registering overrides.
 * When there is no default variation set, it returns the first item.
 *
 * @param {BlockStoreState}      state     Data state.
 * @param {string}               blockName Block type name.
 * @param {BlockVariationScope=} scope     Block variation scope name.
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
 * @return {BlockVariation|undefined} The default block variation.
 */
export function getDefaultBlockVariation( state, blockName, scope ) {
	const variations = getBlockVariations( state, blockName, scope );

	const defaultVariation = [ ...variations ]
		.reverse()
		.find( ( { isDefault } ) => !! isDefault );

	return defaultVariation || variations[ 0 ];
}

/**
 * Returns all the available block categories.
 *
 * @param {BlockStoreState} state Data state.
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
 * @return {BlockCategory[]} Categories list.
 */
export function getCategories( state ) {
	return state.categories;
}

/**
 * Returns all the available collections.
 *
 * @param {BlockStoreState} state Data state.
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
 * @return {BlockCollection[]} Collections list.
 */
export function getCollections( state ) {
	return state.collections;
}

/**
 * Returns the name of the default block name.
 *
 * @param {BlockStoreState} state Data state.
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
 * @return {string|undefined} Default block name.
 */
export function getDefaultBlockName( state ) {
	return state.defaultBlockName;
}

/**
 * Returns the name of the block for handling non-block content.
 *
 * @param {BlockStoreState} state Data state.
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
 * @return {string|undefined} Name of the block for handling non-block content.
 */
export function getFreeformFallbackBlockName( state ) {
	return state.freeformFallbackBlockName;
}

/**
 * Returns the name of the block for handling unregistered blocks.
 *
 * @param {BlockStoreState} state Data state.
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
 * @return {string|undefined} Name of the block for handling unregistered blocks.
 */
export function getUnregisteredFallbackBlockName( state ) {
	return state.unregisteredFallbackBlockName;
}

/**
 * Returns the name of the block for handling the grouping of blocks.
 *
 * @param {BlockStoreState} state Data state.
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
 * @return {string|undefined} Name of the block for handling the grouping of blocks.
 */
export function getGroupingBlockName( state ) {
	return state.groupingBlockName;
}

/**
 * Returns an array with the child blocks of a given block.
 *
 * @param {BlockStoreState} state     Data state.
 * @param {string}          blockName Block type name.
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
 * @return {string[]} Array of child block names.
 */
export const getChildBlockNames = createSelector(
	( state, blockName ) => {
		return getBlockTypes( state )
			.filter( ( blockType ) => {
				return blockType.parent?.includes( blockName );
			} )
			.map( ( { name } ) => name );
	},
	( state ) => [ state.blockTypes ]
);

/**
 * Returns the block support value for a feature, if defined.
 *
 * @param {BlockStoreState}  state           Data state.
 * @param {string|BlockType} nameOrType      Block name or type object
 * @param {string|string[]}  feature         Feature to retrieve
 * @param {*}                defaultSupports Default value to return if not
 *                                           explicitly defined
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
 * @return {*} Block support value
 */
export const getBlockSupport = (
	state,
	nameOrType,
	feature,
	defaultSupports
) => {
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
 * @param {BlockStoreState}  state           Data state.
 * @param {string|BlockType} nameOrType      Block name or type object.
 * @param {string}           feature         Feature to test.
 *
 * @param {boolean}          defaultSupports Whether feature is supported by
 *                                           default if not explicitly defined.
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
 * @return {boolean} Whether block supports feature.
 */
export function hasBlockSupport( state, nameOrType, feature, defaultSupports ) {
	return !! getBlockSupport( state, nameOrType, feature, defaultSupports );
}

/**
 * Returns true if the block type by the given name or object value matches a
 * search term, or false otherwise.
 *
 * @param {BlockStoreState}  state      Blocks state.
 * @param {string|BlockType} nameOrType Block name or type object.
 * @param {string}           searchTerm Search term by which to filter.
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
 * @return {boolean} Whether block type matches search term.
 */
export function isMatchingSearchTerm( state, nameOrType, searchTerm ) {
	const blockType = getNormalizedBlockType( state, nameOrType );

	const getNormalizedSearchTerm = pipe( [
		// Disregard diacritics.
		//  Input: "média"
		( term ) => removeAccents( term ?? '' ),

		// Lowercase.
		//  Input: "MEDIA"
		( term ) => term.toLowerCase(),

		// Strip leading and trailing whitespace.
		//  Input: " media "
		( term ) => term.trim(),
	] );

	const normalizedSearchTerm = getNormalizedSearchTerm( searchTerm );

	const isSearchMatch = pipe( [
		getNormalizedSearchTerm,
		( normalizedCandidate ) =>
			normalizedCandidate.includes( normalizedSearchTerm ),
	] );

	return (
		isSearchMatch( blockType.title ) ||
		blockType.keywords?.some( isSearchMatch ) ||
		isSearchMatch( blockType.category ) ||
		( typeof blockType.description === 'string' &&
			isSearchMatch( blockType.description ) )
	);
}

/**
 * Returns a boolean indicating if a block has child blocks or not.
 *
 * @param {BlockStoreState} state     Data state.
 * @param {string}          blockName Block type name.
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
 * @return {boolean} True if a block contains child blocks and false otherwise.
 */
export const hasChildBlocks = ( state, blockName ) => {
	return getChildBlockNames( state, blockName ).length > 0;
};

/**
 * Returns a boolean indicating if a block has at least one child block with inserter support.
 *
 * @param {BlockStoreState} state     Data state.
 * @param {string}          blockName Block type name.
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
 * @return {boolean} True if a block contains at least one child blocks with inserter support
 *                   and false otherwise.
 */
export const hasChildBlocksWithInserterSupport = ( state, blockName ) => {
	return getChildBlockNames( state, blockName ).some( ( childBlockName ) => {
		return hasBlockSupport( state, childBlockName, 'inserter', true );
	} );
};

/**
 * DO-NOT-USE in production.
 * This selector is created for internal/experimental only usage and may be
 * removed anytime without any warning, causing breakage on any plugin or theme invoking it.
 */
export const __experimentalHasContentRoleAttribute = createSelector(
	( state, blockTypeName ) => {
		const blockType = getBlockType( state, blockTypeName );
		if ( ! blockType ) {
			return false;
		}

		return Object.entries( blockType.attributes ).some(
			( [ , { __experimentalRole } ] ) => __experimentalRole === 'content'
		);
	},
	( state, blockTypeName ) => [
		state.blockTypes[ blockTypeName ]?.attributes,
	]
);
