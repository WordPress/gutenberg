/**
 * WordPress dependencies
 */
import { createSelector, createRegistrySelector } from '@wordpress/data';

/**
 * Internal dependencies
 */
import {
	getBlockOrder,
	getBlockParents,
	getBlockEditingMode,
	getSettings,
	canInsertBlockType,
	getBlockName,
	getTemplateLock,
	getClientIdsWithDescendants,
} from './selectors';
import {
	checkAllowListRecursive,
	getAllPatternsDependants,
	getInsertBlockTypeDependants,
} from './utils';
import { INSERTER_PATTERN_TYPES } from '../components/inserter/block-patterns-tab/utils';
import { STORE_NAME } from './constants';
import { unlock } from '../lock-unlock';
import {
	selectBlockPatternsKey,
	reusableBlocksSelectKey,
} from './private-keys';

export { getBlockSettings } from './get-block-settings';

/**
 * Returns true if the block interface is hidden, or false otherwise.
 *
 * @param {Object} state Global application state.
 *
 * @return {boolean} Whether the block toolbar is hidden.
 */
export function isBlockInterfaceHidden( state ) {
	return state.isBlockInterfaceHidden;
}

/**
 * Gets the client ids of the last inserted blocks.
 *
 * @param {Object} state Global application state.
 * @return {Array|undefined} Client Ids of the last inserted block(s).
 */
export function getLastInsertedBlocksClientIds( state ) {
	return state?.lastBlockInserted?.clientIds;
}

export function getBlockWithoutAttributes( state, clientId ) {
	return state.blocks.byClientId.get( clientId );
}

/**
 * Returns true if all of the descendants of a block with the given client ID
 * have an editing mode of 'disabled', or false otherwise.
 *
 * @param {Object} state    Global application state.
 * @param {string} clientId The block client ID.
 *
 * @return {boolean} Whether the block descendants are disabled.
 */
export const isBlockSubtreeDisabled = ( state, clientId ) => {
	const isChildSubtreeDisabled = ( childClientId ) => {
		return (
			getBlockEditingMode( state, childClientId ) === 'disabled' &&
			getBlockOrder( state, childClientId ).every(
				isChildSubtreeDisabled
			)
		);
	};
	return getBlockOrder( state, clientId ).every( isChildSubtreeDisabled );
};

function getEnabledClientIdsTreeUnmemoized( state, rootClientId ) {
	const blockOrder = getBlockOrder( state, rootClientId );
	const result = [];

	for ( const clientId of blockOrder ) {
		const innerBlocks = getEnabledClientIdsTreeUnmemoized(
			state,
			clientId
		);
		if ( getBlockEditingMode( state, clientId ) !== 'disabled' ) {
			result.push( { clientId, innerBlocks } );
		} else {
			result.push( ...innerBlocks );
		}
	}

	return result;
}

/**
 * Returns a tree of block objects with only clientID and innerBlocks set.
 * Blocks with a 'disabled' editing mode are not included.
 *
 * @param {Object}  state        Global application state.
 * @param {?string} rootClientId Optional root client ID of block list.
 *
 * @return {Object[]} Tree of block objects with only clientID and innerBlocks set.
 */
export const getEnabledClientIdsTree = createSelector(
	getEnabledClientIdsTreeUnmemoized,
	( state ) => [
		state.blocks.order,
		state.blockEditingModes,
		state.settings.templateLock,
		state.blockListSettings,
	]
);

/**
 * Returns a list of a given block's ancestors, from top to bottom. Blocks with
 * a 'disabled' editing mode are excluded.
 *
 * @see getBlockParents
 *
 * @param {Object}  state     Global application state.
 * @param {string}  clientId  The block client ID.
 * @param {boolean} ascending Order results from bottom to top (true) or top
 *                            to bottom (false).
 */
export const getEnabledBlockParents = createSelector(
	( state, clientId, ascending = false ) => {
		return getBlockParents( state, clientId, ascending ).filter(
			( parent ) => getBlockEditingMode( state, parent ) !== 'disabled'
		);
	},
	( state ) => [
		state.blocks.parents,
		state.blockEditingModes,
		state.settings.templateLock,
		state.blockListSettings,
	]
);

/**
 * Selector that returns the data needed to display a prompt when certain
 * blocks are removed, or `false` if no such prompt is requested.
 *
 * @param {Object} state Global application state.
 *
 * @return {Object|false} Data for removal prompt display, if any.
 */
export function getRemovalPromptData( state ) {
	return state.removalPromptData;
}

/**
 * Returns true if removal prompt exists, or false otherwise.
 *
 * @param {Object} state Global application state.
 *
 * @return {boolean} Whether removal prompt exists.
 */
export function getBlockRemovalRules( state ) {
	return state.blockRemovalRules;
}

/**
 * Returns the client ID of the block settings menu that is currently open.
 *
 * @param {Object} state Global application state.
 * @return {string|null} The client ID of the block menu that is currently open.
 */
export function getOpenedBlockSettingsMenu( state ) {
	return state.openedBlockSettingsMenu;
}

/**
 * Returns all style overrides, intended to be merged with global editor styles.
 *
 * Overrides are sorted to match the order of the blocks they relate to. This
 * is useful to maintain correct CSS cascade order.
 *
 * @param {Object} state Global application state.
 *
 * @return {Array} An array of style ID to style override pairs.
 */
export const getStyleOverrides = createSelector(
	( state ) => {
		const clientIds = getClientIdsWithDescendants( state );
		const clientIdMap = clientIds.reduce( ( acc, clientId, index ) => {
			acc[ clientId ] = index;
			return acc;
		}, {} );

		return [ ...state.styleOverrides ].sort( ( overrideA, overrideB ) => {
			// Once the overrides Map is spread to an array, the first element
			// is the key, while the second is the override itself including
			// the clientId to sort by.
			const [ , { clientId: clientIdA } ] = overrideA;
			const [ , { clientId: clientIdB } ] = overrideB;

			const aIndex = clientIdMap[ clientIdA ] ?? -1;
			const bIndex = clientIdMap[ clientIdB ] ?? -1;

			return aIndex - bIndex;
		} );
	},
	( state ) => [ state.blocks.order, state.styleOverrides ]
);

/** @typedef {import('./actions').InserterMediaCategory} InserterMediaCategory */
/**
 * Returns the registered inserter media categories through the public API.
 *
 * @param {Object} state Editor state.
 *
 * @return {InserterMediaCategory[]} Inserter media categories.
 */
export function getRegisteredInserterMediaCategories( state ) {
	return state.registeredInserterMediaCategories;
}

/**
 * Returns an array containing the allowed inserter media categories.
 * It merges the registered media categories from extenders with the
 * core ones. It also takes into account the allowed `mime_types`, which
 * can be altered by `upload_mimes` filter and restrict some of them.
 *
 * @param {Object} state Global application state.
 *
 * @return {InserterMediaCategory[]} Client IDs of descendants.
 */
export const getInserterMediaCategories = createSelector(
	( state ) => {
		const {
			settings: {
				inserterMediaCategories,
				allowedMimeTypes,
				enableOpenverseMediaCategory,
			},
			registeredInserterMediaCategories,
		} = state;
		// The allowed `mime_types` can be altered by `upload_mimes` filter and restrict
		// some of them. In this case we shouldn't add the category to the available media
		// categories list in the inserter.
		if (
			( ! inserterMediaCategories &&
				! registeredInserterMediaCategories.length ) ||
			! allowedMimeTypes
		) {
			return;
		}
		const coreInserterMediaCategoriesNames =
			inserterMediaCategories?.map( ( { name } ) => name ) || [];
		const mergedCategories = [
			...( inserterMediaCategories || [] ),
			...( registeredInserterMediaCategories || [] ).filter(
				( { name } ) =>
					! coreInserterMediaCategoriesNames.includes( name )
			),
		];
		return mergedCategories.filter( ( category ) => {
			// Check if Openverse category is enabled.
			if (
				! enableOpenverseMediaCategory &&
				category.name === 'openverse'
			) {
				return false;
			}
			return Object.values( allowedMimeTypes ).some( ( mimeType ) =>
				mimeType.startsWith( `${ category.mediaType }/` )
			);
		} );
	},
	( state ) => [
		state.settings.inserterMediaCategories,
		state.settings.allowedMimeTypes,
		state.settings.enableOpenverseMediaCategory,
		state.registeredInserterMediaCategories,
	]
);

/**
 * Returns whether there is at least one allowed pattern for inner blocks children.
 * This is useful for deferring the parsing of all patterns until needed.
 *
 * @param {Object} state               Editor state.
 * @param {string} [rootClientId=null] Target root client ID.
 *
 * @return {boolean} If there is at least one allowed pattern.
 */
export const hasAllowedPatterns = createRegistrySelector( ( select ) =>
	createSelector(
		( state, rootClientId = null ) => {
			const { getAllPatterns, __experimentalGetParsedPattern } = unlock(
				select( STORE_NAME )
			);
			const patterns = getAllPatterns();
			const { allowedBlockTypes } = getSettings( state );
			return patterns.some( ( { name, inserter = true } ) => {
				if ( ! inserter ) {
					return false;
				}
				const { blocks } = __experimentalGetParsedPattern( name );
				return (
					checkAllowListRecursive( blocks, allowedBlockTypes ) &&
					blocks.every( ( { name: blockName } ) =>
						canInsertBlockType( state, blockName, rootClientId )
					)
				);
			} );
		},
		( state, rootClientId ) => [
			...getAllPatternsDependants( select )( state ),
			...getInsertBlockTypeDependants( state, rootClientId ),
		]
	)
);

function mapUserPattern(
	userPattern,
	__experimentalUserPatternCategories = []
) {
	return {
		name: `core/block/${ userPattern.id }`,
		id: userPattern.id,
		type: INSERTER_PATTERN_TYPES.user,
		title: userPattern.title.raw,
		categories: userPattern.wp_pattern_category.map( ( catId ) => {
			const category = __experimentalUserPatternCategories.find(
				( { id } ) => id === catId
			);
			return category ? category.slug : catId;
		} ),
		content: userPattern.content.raw,
		syncStatus: userPattern.wp_pattern_sync_status,
	};
}

export const getPatternBySlug = createRegistrySelector( ( select ) =>
	createSelector(
		( state, patternName ) => {
			// Only fetch reusable blocks if we know we need them. To do: maybe
			// use the entity record API to retrieve the block by slug.
			if ( patternName?.startsWith( 'core/block/' ) ) {
				const _id = parseInt(
					patternName.slice( 'core/block/'.length ),
					10
				);
				const block = unlock( select( STORE_NAME ) )
					.getReusableBlocks()
					.find( ( { id } ) => id === _id );

				if ( ! block ) {
					return null;
				}

				return mapUserPattern(
					block,
					state.settings.__experimentalUserPatternCategories
				);
			}

			return [
				// This setting is left for back compat.
				...( state.settings.__experimentalBlockPatterns ?? [] ),
				...( state.settings[ selectBlockPatternsKey ]?.( select ) ??
					[] ),
			].find( ( { name } ) => name === patternName );
		},
		( state, patternName ) =>
			patternName?.startsWith( 'core/block/' )
				? [
						unlock( select( STORE_NAME ) ).getReusableBlocks(),
						state.settings.__experimentalReusableBlocks,
				  ]
				: [
						state.settings.__experimentalBlockPatterns,
						state.settings[ selectBlockPatternsKey ]?.( select ),
				  ]
	)
);

export const getAllPatterns = createRegistrySelector( ( select ) =>
	createSelector( ( state ) => {
		return [
			...unlock( select( STORE_NAME ) )
				.getReusableBlocks()
				.map( ( userPattern ) =>
					mapUserPattern(
						userPattern,
						state.settings.__experimentalUserPatternCategories
					)
				),
			// This setting is left for back compat.
			...( state.settings.__experimentalBlockPatterns ?? [] ),
			...( state.settings[ selectBlockPatternsKey ]?.( select ) ?? [] ),
		].filter(
			( x, index, arr ) =>
				index === arr.findIndex( ( y ) => x.name === y.name )
		);
	}, getAllPatternsDependants( select ) )
);

export const isResolvingPatterns = createRegistrySelector( ( select ) =>
	createSelector( ( state ) => {
		const blockPatternsSelect = state.settings[ selectBlockPatternsKey ];
		const reusableBlocksSelect = state.settings[ reusableBlocksSelectKey ];
		return (
			( blockPatternsSelect
				? blockPatternsSelect( select ) === undefined
				: false ) ||
			( reusableBlocksSelect
				? reusableBlocksSelect( select ) === undefined
				: false )
		);
	}, getAllPatternsDependants( select ) )
);

const EMPTY_ARRAY = [];

export const getReusableBlocks = createRegistrySelector(
	( select ) => ( state ) => {
		const reusableBlocksSelect = state.settings[ reusableBlocksSelectKey ];
		return reusableBlocksSelect
			? reusableBlocksSelect( select )
			: state.settings.__experimentalReusableBlocks ?? EMPTY_ARRAY;
	}
);

/**
 * Returns the element of the last element that had focus when focus left the editor canvas.
 *
 * @param {Object} state Block editor state.
 *
 * @return {Object} Element.
 */
export function getLastFocus( state ) {
	return state.lastFocus;
}

/**
 * Returns true if the user is dragging anything, or false otherwise. It is possible for a
 * user to be dragging data from outside of the editor, so this selector is separate from
 * the `isDraggingBlocks` selector which only returns true if the user is dragging blocks.
 *
 * @param {Object} state Global application state.
 *
 * @return {boolean} Whether user is dragging.
 */
export function isDragging( state ) {
	return state.isDragging;
}

/**
 * Retrieves the expanded block from the state.
 *
 * @param {Object} state Block editor state.
 *
 * @return {string|null} The client ID of the expanded block, if set.
 */
export function getExpandedBlock( state ) {
	return state.expandedBlock;
}

/**
 * Retrieves the client ID of the ancestor block that is content locking the block
 * with the provided client ID.
 *
 * @param {Object} state    Global application state.
 * @param {Object} clientId Client Id of the block.
 *
 * @return {?string} Client ID of the ancestor block that is content locking the block.
 */
export const getContentLockingParent = createSelector(
	( state, clientId ) => {
		let current = clientId;
		let result;
		while ( ( current = state.blocks.parents.get( current ) ) ) {
			if (
				getBlockName( state, current ) === 'core/block' ||
				getTemplateLock( state, current ) === 'contentOnly'
			) {
				result = current;
			}
		}
		return result;
	},
	( state ) => [ state.blocks.parents, state.blockListSettings ]
);

/**
 * Retrieves the client ID of the block that is content locked but is
 * currently being temporarily edited as a non-locked block.
 *
 * @param {Object} state Global application state.
 *
 * @return {?string} The client ID of the block being temporarily edited as a non-locked block.
 */
export function getTemporarilyEditingAsBlocks( state ) {
	return state.temporarilyEditingAsBlocks;
}

/**
 * Returns the focus mode that should be reapplied when the user stops editing
 * a content locked blocks as a block without locking.
 *
 * @param {Object} state Global application state.
 *
 * @return {?string} The focus mode that should be re-set when temporarily editing as blocks stops.
 */
export function getTemporarilyEditingFocusModeToRevert( state ) {
	return state.temporarilyEditingFocusModeRevert;
}

export function getInserterSearchInputRef( state ) {
	return state.inserterSearchInputRef;
}

/**
 * Returns the style attributes of multiple blocks.
 *
 * @param {Object}   state     Global application state.
 * @param {string[]} clientIds An array of block client IDs.
 *
 * @return {Object} An object where keys are client IDs and values are the corresponding block styles or undefined.
 */
export const getBlockStyles = createSelector(
	( state, clientIds ) =>
		clientIds.reduce( ( styles, clientId ) => {
			styles[ clientId ] = state.blocks.attributes.get( clientId )?.style;
			return styles;
		}, {} ),
	( state, clientIds ) => [
		...clientIds.map(
			( clientId ) => state.blocks.attributes.get( clientId )?.style
		),
	]
);

/**
 * Returns whether zoom out mode is enabled.
 *
 * @param {Object} state Editor state.
 *
 * @return {boolean} Is zoom out mode enabled.
 */
export function isZoomOutMode( state ) {
	return state.editorMode === 'zoom-out';
}
