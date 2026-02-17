/**
 * WordPress dependencies
 */
import { createSelector, createRegistrySelector } from '@wordpress/data';
import {
	hasBlockSupport,
	privateApis as blocksPrivateApis,
} from '@wordpress/blocks';

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
	getBlockRootClientId,
	getBlockAttributes,
} from './selectors';
import {
	checkAllowListRecursive,
	getAllPatternsDependants,
	getInsertBlockTypeDependants,
	getGrammar,
	mapUserPattern,
} from './utils';
import { STORE_NAME } from './constants';
import { unlock } from '../lock-unlock';
import {
	selectBlockPatternsKey,
	reusableBlocksSelectKey,
	sectionRootClientIdKey,
	isIsolatedEditorKey,
} from './private-keys';
import { BLOCK_VISIBILITY_VIEWPORTS } from '../components/block-visibility/constants';

const { isContentBlock } = unlock( blocksPrivateApis );

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

/**
 * Determines if a container (clientId) allows insertion of blocks, considering contentOnly mode restrictions.
 *
 * @param {Object} state        Editor state.
 * @param {string} blockName    The block name to insert.
 * @param {string} rootClientId The client ID of the root container block.
 * @return {boolean} Whether the container allows insertion.
 */
export function isContainerInsertableToInContentOnlyMode(
	state,
	blockName,
	rootClientId
) {
	const isBlockContentBlock = isContentBlock( blockName );
	const rootBlockName = getBlockName( state, rootClientId );
	const isContainerContentBlock = isContentBlock( rootBlockName );
	const isRootBlockMain = getSectionRootClientId( state ) === rootClientId;

	// In contentOnly mode, containers shouldn't be inserted into unless:
	// 1. they are a section root;
	// 2. they are a content block and the block to be inserted is also content.
	return (
		isRootBlockMain || ( isContainerContentBlock && isBlockContentBlock )
	);
}

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
export const getEnabledClientIdsTree = createRegistrySelector( () =>
	createSelector( getEnabledClientIdsTreeUnmemoized, ( state ) => [
		state.blocks.order,
		state.derivedBlockEditingModes,
		state.blockEditingModes,
	] )
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
			const { getAllPatterns } = unlock( select( STORE_NAME ) );
			const patterns = getAllPatterns();
			const { allowedBlockTypes } = getSettings( state );
			return patterns.some( ( pattern ) => {
				const { inserter = true } = pattern;
				if ( ! inserter ) {
					return false;
				}
				const grammar = getGrammar( pattern );
				return (
					checkAllowListRecursive( grammar, allowedBlockTypes ) &&
					grammar.every( ( { name: blockName } ) =>
						canInsertBlockType( state, blockName, rootClientId )
					)
				);
			} );
		},
		( state, rootClientId ) => [
			...getAllPatternsDependants( select )( state ),
			...getInsertBlockTypeDependants( select )( state, rootClientId ),
		]
	)
);

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

const EMPTY_ARRAY = [];

export const getReusableBlocks = createRegistrySelector(
	( select ) => ( state ) => {
		const reusableBlocksSelect = state.settings[ reusableBlocksSelectKey ];
		return (
			( reusableBlocksSelect
				? reusableBlocksSelect( select )
				: state.settings.__experimentalReusableBlocks ) ?? EMPTY_ARRAY
		);
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
 * @param {string} clientId Client Id of the block.
 *
 * @return {?string} Client ID of the ancestor block that is content locking the block.
 */
export const getContentLockingParent = ( state, clientId ) => {
	let current = clientId;
	let result;
	while ( ! result && ( current = state.blocks.parents.get( current ) ) ) {
		if ( getTemplateLock( state, current ) === 'contentOnly' ) {
			result = current;
		}
	}
	return result;
};

/**
 * Retrieves the client ID of the parent section block.
 *
 * @param {Object} state    Global application state.
 * @param {string} clientId Client Id of the block.
 *
 * @return {?string} Client ID of the ancestor block that is a contentOnly section.
 */
export const getParentSectionBlock = ( state, clientId ) => {
	let current = clientId;
	let result;

	// If sections are nested, return the top level section block.
	// Don't return early.
	while ( ( current = state.blocks.parents.get( current ) ) ) {
		if ( isSectionBlock( state, current ) ) {
			result = current;
		}
	}
	return result;
};

/**
 * Returns whether the block is a contentOnly section.
 *
 * @param {Object} state    Global application state.
 * @param {string} clientId Client Id of the block.
 *
 * @return {boolean} Whether the block is a contentOnly section.
 */
export function isSectionBlock( state, clientId ) {
	if ( clientId === state.editedContentOnlySection ) {
		return false;
	}

	const blockName = getBlockName( state, clientId );
	if ( blockName === 'core/block' ) {
		return true;
	}

	const attributes = getBlockAttributes( state, clientId );
	const isTemplatePart = blockName === 'core/template-part';

	// When in an isolated editing context (e.g., editing a template part or pattern directly),
	// don't treat nested unsynced patterns as section blocks.
	const isIsolatedEditor = state.settings?.[ isIsolatedEditorKey ];

	if (
		( attributes?.metadata?.patternName || isTemplatePart ) &&
		! isIsolatedEditor
	) {
		return true;
	}

	// TemplateLock cascades to all inner parent blocks. Only the top-level
	// block that's contentOnly templateLocked is the true contentLocker,
	// all the others are mere imitators.
	const hasContentOnlyTempateLock =
		getTemplateLock( state, clientId ) === 'contentOnly';
	const rootClientId = getBlockRootClientId( state, clientId );
	const hasRootContentOnlyTemplateLock =
		getTemplateLock( state, rootClientId ) === 'contentOnly';
	if ( hasContentOnlyTempateLock && ! hasRootContentOnlyTemplateLock ) {
		return true;
	}

	return false;
}

/**
 * Retrieves the client ID of the block that is a contentOnly section but is
 * currently being temporarily edited (contentOnly is deactivated).
 *
 * @param {Object} state Global application state.
 *
 * @return {?string} The client ID of the block being temporarily edited.
 */
export function getEditedContentOnlySection( state ) {
	return state.editedContentOnlySection;
}

export function isWithinEditedContentOnlySection( state, clientId ) {
	if ( ! state.editedContentOnlySection ) {
		return false;
	}

	if ( state.editedContentOnlySection === clientId ) {
		return true;
	}

	let current = clientId;
	while ( ( current = state.blocks.parents.get( current ) ) ) {
		if ( state.editedContentOnlySection === current ) {
			return true;
		}
	}
	return false;
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
 * Retrieves the client ID of the block which contains the blocks
 * acting as "sections" in the editor. This is typically the "main content"
 * of the template/post.
 *
 * @param {Object} state Editor state.
 *
 * @return {string|undefined} The section root client ID or undefined if not set.
 */
export function getSectionRootClientId( state ) {
	return state.settings?.[ sectionRootClientIdKey ];
}

/**
 * Returns whether the editor is considered zoomed out.
 *
 * @param {Object} state Global application state.
 * @return {boolean} Whether the editor is zoomed.
 */
export function isZoomOut( state ) {
	return state.zoomLevel === 'auto-scaled' || state.zoomLevel < 100;
}

/**
 * Returns whether the zoom level.
 *
 * @param {Object} state Global application state.
 * @return {number|"auto-scaled"} Zoom level.
 */
export function getZoomLevel( state ) {
	return state.zoomLevel;
}

/**
 * Finds the closest block where the block is allowed to be inserted.
 *
 * @param {Object}            state    Editor state.
 * @param {string[] | string} name     Block name or names.
 * @param {string}            clientId Default insertion point.
 *
 * @return {string} clientID of the closest container when the block name can be inserted.
 */
export function getClosestAllowedInsertionPoint( state, name, clientId = '' ) {
	const blockNames = Array.isArray( name ) ? name : [ name ];
	const areBlockNamesAllowedInClientId = ( id ) =>
		blockNames.every( ( currentName ) =>
			canInsertBlockType( state, currentName, id )
		);

	// If we're trying to insert at the root level and it's not allowed
	// Try the section root instead.
	if ( ! clientId ) {
		if ( areBlockNamesAllowedInClientId( clientId ) ) {
			return clientId;
		}

		const sectionRootClientId = getSectionRootClientId( state );
		if (
			sectionRootClientId &&
			areBlockNamesAllowedInClientId( sectionRootClientId )
		) {
			return sectionRootClientId;
		}
		return null;
	}

	// Traverse the block tree up until we find a place where we can insert.
	let current = clientId;
	while ( current !== null && ! areBlockNamesAllowedInClientId( current ) ) {
		const parentClientId = getBlockRootClientId( state, current );
		current = parentClientId;
	}

	return current;
}

export function getClosestAllowedInsertionPointForPattern(
	state,
	pattern,
	clientId
) {
	const { allowedBlockTypes } = getSettings( state );
	const isAllowed = checkAllowListRecursive(
		getGrammar( pattern ),
		allowedBlockTypes
	);
	if ( ! isAllowed ) {
		return null;
	}
	const names = getGrammar( pattern ).map( ( { blockName: name } ) => name );
	return getClosestAllowedInsertionPoint( state, names, clientId );
}

/**
 * Where the point where the next block will be inserted into.
 *
 * @param {Object} state
 * @return {Object} where the insertion point in the block editor is or null if none is set.
 */
export function getInsertionPoint( state ) {
	return state.insertionPoint;
}

/**
 * Returns true if the block is hidden anywhere, or false otherwise.
 *
 * This selector checks whether a block has visibility metadata set that would
 * hide it at any viewport or everywhere. It's useful for flagging blocks that
 * have visibility restrictions.
 *
 * A block is considered hidden anywhere if:
 * - blockVisibility is false (hidden everywhere)
 * - blockVisibility.viewport has any viewport set to false (hidden at specific screen sizes)
 *
 * @param {Object} state    Global application state.
 * @param {string} clientId Client ID of the block.
 *
 * @return {boolean} Whether the block is hidden anywhere.
 */
export const isBlockHiddenAnywhere = ( state, clientId ) => {
	const blockName = getBlockName( state, clientId );
	if ( ! hasBlockSupport( blockName, 'visibility', true ) ) {
		return false;
	}
	const attributes = state.blocks.attributes.get( clientId );
	const blockVisibility = attributes?.metadata?.blockVisibility;

	if ( blockVisibility === false ) {
		return true;
	}

	if (
		typeof blockVisibility?.viewport === 'object' &&
		blockVisibility?.viewport !== null
	) {
		// Check if the block is hidden at any viewport.
		return Object.values( BLOCK_VISIBILITY_VIEWPORTS ).some(
			( viewport ) =>
				blockVisibility?.viewport?.[ viewport.key ] === false
		);
	}
	return false;
};

/**
 * Returns true if the block is hidden everywhere (blockVisibility is false).
 *
 * A block is considered hidden everywhere when blockVisibility is explicitly
 * set to false, which means it's hidden on all viewports.
 *
 * @param {Object} state    Global application state.
 * @param {string} clientId Client ID of the block.
 *
 * @return {boolean} Whether the block is hidden everywhere.
 */
export const isBlockHiddenEverywhere = ( state, clientId ) => {
	const blockName = getBlockName( state, clientId );
	if ( ! hasBlockSupport( blockName, 'visibility', true ) ) {
		return false;
	}
	const attributes = state.blocks.attributes.get( clientId );
	const blockVisibility = attributes?.metadata?.blockVisibility;

	if ( blockVisibility === false ) {
		return true;
	}
	return false;
};

/**
 * Returns true if any parent block (immediate or further up the chain) is hidden everywhere.
 *
 * Checks all parent blocks in the hierarchy and returns true if any of them
 * is hidden everywhere.
 *
 * @param {Object} state    Global application state.
 * @param {string} clientId Client ID of the block.
 *
 * @return {boolean} Whether any parent block is hidden everywhere.
 */
export const isBlockParentHiddenEverywhere = ( state, clientId ) => {
	const parents = getBlockParents( state, clientId );
	return parents.some( ( parentId ) =>
		isBlockHiddenEverywhere( state, parentId )
	);
};

/**
 * Returns true if the block is hidden at the given viewport.
 *
 * A block is considered hidden at a viewport if:
 * - blockVisibility is false (hidden everywhere)
 * - blockVisibility is an object with the specified viewport set to false
 *
 * @param {Object} state    Global application state.
 * @param {string} clientId Client ID of the block.
 * @param {string} viewport Viewport to check ('desktop', 'tablet', 'mobile').
 *
 * @return {boolean} Whether the block is hidden at the viewport.
 */
export const isBlockHiddenAtViewport = ( state, clientId, viewport ) => {
	if ( isBlockHiddenEverywhere( state, clientId ) ) {
		return true;
	}

	const attributes = state.blocks.attributes.get( clientId );
	const blockVisibilityViewport =
		attributes?.metadata?.blockVisibility?.viewport;
	if (
		typeof blockVisibilityViewport === 'object' &&
		blockVisibilityViewport !== null &&
		typeof viewport === 'string'
	) {
		return blockVisibilityViewport?.[ viewport.toLowerCase() ] === false;
	}
	return false;
};

/**
 * Returns true if any parent block (immediate or further up the chain) is hidden at the given viewport.
 *
 * Checks all parent blocks in the hierarchy and returns true if any of them
 * is hidden at the specified viewport.
 *
 * @param {Object} state    Global application state.
 * @param {string} clientId Client ID of the block.
 * @param {string} viewport Viewport to check ('desktop', 'tablet', 'mobile').
 *
 * @return {boolean} Whether any parent block is hidden at the viewport.
 */
export const isBlockParentHiddenAtViewport = ( state, clientId, viewport ) => {
	const parents = getBlockParents( state, clientId );
	return parents.some( ( parentId ) =>
		isBlockHiddenAtViewport( state, parentId, viewport )
	);
};

/**
 * Returns true if there is a spotlighted block.
 *
 * The spotlight is also active when a contentOnly section is being edited, the selector
 * also returns true if this is the case.
 *
 * @param {Object} state Global application state.
 *
 * @return {boolean} Whether the block is currently spotlighted.
 */
export function hasBlockSpotlight( state ) {
	return !! state.hasBlockSpotlight || !! state.editedContentOnlySection;
}

/**
 * Returns whether a block is locked to prevent editing.
 *
 * This selector only reasons about block lock, not associated features
 * like `blockEditingMode` that might prevent user modifications to a block.
 * Currently there's also no way to prevent editing via `templateLock`.
 *
 * This distinction is important as this selector specifically drives the block lock UI
 * that a user interacts with. `blockEditingModes` aren't included as a user can't change
 * them.
 *
 * @param {Object} state    Global application state.
 * @param {string} clientId ClientId of the block.
 *
 * @return {boolean} Whether the block is currently locked.
 */
export function isEditLockedBlock( state, clientId ) {
	const attributes = getBlockAttributes( state, clientId );
	return !! attributes?.lock?.edit;
}

/**
 * Returns whether a block is locked to prevent moving.
 *
 * This selector only reasons about templateLock and block lock, not associated features
 * like `blockEditingMode` that might prevent user modifications to a block.
 *
 * This distinction is important as this selector specifically drives the block lock UI
 * that a user interacts with. `blockEditingModes` are excluded as a user can't change
 * them.
 *
 * @param {Object} state    Global application state.
 * @param {string} clientId ClientId of the block.
 *
 * @return {boolean} Whether the block is currently locked.
 */
export function isMoveLockedBlock( state, clientId ) {
	const attributes = getBlockAttributes( state, clientId );
	// If a block explicitly has `move` set to `false`, it turns off
	// any locking that might be inherited from a parent.
	if ( attributes?.lock?.move !== undefined ) {
		return !! attributes?.lock?.move;
	}

	const rootClientId = getBlockRootClientId( state, clientId );
	const templateLock = getTemplateLock( state, rootClientId );

	// While `contentOnly` templateLock does sometimes prevent moving, a user can't modify
	// this, so don't include it in this function. See the `canMoveBlock` selector
	// as an alternative.
	return templateLock === 'all';
}

/**
 * Returns whether a block is locked to prevent removal.
 *
 * This selector only reasons about templateLock and block lock, not associated features
 * like `blockEditingMode` that might prevent user modifications to a block.
 *
 * This distinction is important as this selector specifically drives the block lock UI
 * that a user interacts with. `blockEditingModes` are excluded as a user can't change
 * them.
 *
 * @param {Object} state    Global application state.
 * @param {string} clientId ClientId of the block.
 *
 * @return {boolean} Whether the block is currently locked.
 */
export function isRemoveLockedBlock( state, clientId ) {
	const attributes = getBlockAttributes( state, clientId );
	if ( attributes?.lock?.remove !== undefined ) {
		return !! attributes?.lock?.remove;
	}

	const rootClientId = getBlockRootClientId( state, clientId );
	const templateLock = getTemplateLock( state, rootClientId );

	// While `contentOnly` templateLock does sometimes prevent removal, a user can't modify
	// this, so don't include it in this function. See the `canRemoveBlock` selector
	// as an alternative.
	return templateLock === 'all' || templateLock === 'insert';
}

/**
 * Returns whether a block is locked.
 *
 * This selector only reasons about templateLock and block lock, not associated features
 * like `blockEditingMode` that might prevent user modifications to a block.
 *
 * This distinction is important as this selector specifically drives the block lock UI
 * that a user interacts with. `blockEditingModes` are excluded as a user can't change
 * them.
 *
 * @param {Object} state    Global application state.
 * @param {string} clientId ClientId of the block.
 *
 * @return {boolean} Whether the block is currently locked.
 */
export function isLockedBlock( state, clientId ) {
	return (
		isEditLockedBlock( state, clientId ) ||
		isMoveLockedBlock( state, clientId ) ||
		isRemoveLockedBlock( state, clientId )
	);
}

/**
 * Returns whether the list view content panel popover is open.
 *
 * @param {Object} state Global application state.
 *
 * @return {boolean} Whether the popover is open.
 */
export function isListViewContentPanelOpen( state ) {
	return state.listViewContentPanelOpen;
}

/**
 * Returns whether a List View panel is opened.
 *
 * @param {Object} state    Global application state.
 * @param {string} clientId Client ID of the block.
 *
 * @return {boolean} Whether the panel is opened.
 */
export function isListViewPanelOpened( state, clientId ) {
	// If allOpen flag is set, all panels are open
	if ( state.openedListViewPanels?.allOpen ) {
		return true;
	}
	return state.openedListViewPanels?.panels?.[ clientId ] === true;
}

/**
 * Returns the List View expand revision number.
 *
 * This counter is used in the ListView component's key prop to force remounting.
 *
 * @param {Object} state Global application state.
 *
 * @return {number} The expand revision number.
 */
export function getListViewExpandRevision( state ) {
	return state.listViewExpandRevision || 0;
}

/**
 * Returns the client IDs for the viewport modal, or null if
 * the modal is not open.
 *
 * @param {Object} state Global application state.
 *
 * @return {string[]|null} Client IDs for the visibility modal, or null.
 */
export function getViewportModalClientIds( state ) {
	return state.viewportModalClientIds;
}
