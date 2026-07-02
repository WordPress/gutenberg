/**
 * WordPress dependencies
 */
import type { select as globalSelect } from '@wordpress/data';
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
	getBlockListSettings,
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
	userPatternCategoriesSelectKey,
	sectionRootClientIdKey,
	isIsolatedEditorKey,
} from './private-keys';
import { BLOCK_VISIBILITY_VIEWPORTS } from '../components/block-visibility/constants';
import type {
	BlockAttributes,
	EditorSettings,
	State,
	UserPattern,
	Pattern,
	InserterMediaCategory,
	ClientIdTree,
	BlockListSettings,
} from './types';

const { isContentBlock } = unlock( blocksPrivateApis );

export { getBlockSettings } from './get-block-settings';

/**
 * Returns true if the block interface is hidden, or false otherwise.
 *
 * @param state Global application state.
 *
 * @return Whether the block toolbar is hidden.
 */
export function isBlockInterfaceHidden( state: State ): boolean {
	return state.isBlockInterfaceHidden;
}

/**
 * Gets the client ids of the last inserted blocks.
 *
 * @param state Global application state.
 * @return Client Ids of the last inserted block(s).
 */
export function getLastInsertedBlocksClientIds(
	state: State
): string[] | undefined {
	return state?.lastBlockInserted?.clientIds;
}

export function getBlockWithoutAttributes( state: State, clientId: string ) {
	return state.blocks.byClientId.get( clientId );
}

/**
 * Returns true if all of the descendants of a block with the given client ID
 * have an editing mode of 'disabled', or false otherwise.
 *
 * @param state    Global application state.
 * @param clientId The block client ID.
 *
 * @return  Whether the block descendants are disabled.
 */
export const isBlockSubtreeDisabled = (
	state: State,
	clientId: string
): boolean => {
	const isChildSubtreeDisabled = ( childClientId: string ): boolean => {
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
 * @param state        Editor state.
 * @param blockName    The block name to insert.
 * @param rootClientId The client ID of the root container block.
 * @return  Whether the container allows insertion.
 */
export function isContainerInsertableToInContentOnlyMode(
	state: State,
	blockName: string,
	rootClientId: string
): boolean {
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

function getClientIdWithClientIdsTreeUnmemoized(
	state: State,
	clientId: string
) {
	return {
		clientId,
		innerBlocks: getClientIdsTreeUnmemoized( state, clientId ),
	};
}

function getClientIdsTreeUnmemoized(
	state: State,
	rootClientId = ''
): ClientIdTree[] {
	return getBlockOrder( state, rootClientId ).map( ( clientId ) =>
		getClientIdWithClientIdsTreeUnmemoized( state, clientId )
	);
}

/**
 * Returns a stripped down block object containing only its client ID,
 * and its inner blocks' client IDs.
 *
 * @param state    Editor state.
 * @param clientId Client ID of the block to get.
 *
 * @return Client IDs of the post blocks.
 */
export const getClientIdWithClientIdsTree = createSelector(
	getClientIdWithClientIdsTreeUnmemoized,
	( state ) => [ state.blocks.order ]
);

/**
 * Returns the block tree represented in the block-editor store from the
 * given root, consisting of stripped down block objects containing only
 * their client IDs, and their inner blocks' client IDs.
 *
 * @param state        Editor state.
 * @param rootClientId Optional root client ID of block list.
 *
 * @return  Client IDs of the post blocks.
 */
export const getClientIdsTree = createSelector(
	getClientIdsTreeUnmemoized,
	( state ) => [ state.blocks.order ]
);

/**
 * Returns a tree of block objects filtered by a block inclusion callback.
 * Excluded blocks are replaced by any included descendants.
 *
 * @param state         Global application state.
 * @param rootClientId  Optional root client ID of block list.
 * @param includesBlock Callback that returns whether to include a block.
 *
 * @return Tree of block objects with only clientID and innerBlocks set.
 */
function getFilteredClientIdsTreeUnmemoized(
	state: State,
	rootClientId: string,
	includesBlock: ( state: State, clientId: string ) => boolean
): ClientIdTree[] {
	const blockOrder = getBlockOrder( state, rootClientId );
	const result: ClientIdTree[] = [];

	for ( const clientId of blockOrder ) {
		const innerBlocks = getFilteredClientIdsTreeUnmemoized(
			state,
			clientId,
			includesBlock
		);
		if ( includesBlock( state, clientId ) ) {
			result.push( { clientId, innerBlocks } );
		} else {
			result.push( ...innerBlocks );
		}
	}

	return result;
}

function getEnabledClientIdsTreeUnmemoized(
	state: State,
	rootClientId: string
) {
	return getFilteredClientIdsTreeUnmemoized(
		state,
		rootClientId,
		( _state, clientId ) =>
			getBlockEditingMode( _state, clientId ) !== 'disabled'
	);
}

/**
 * Returns whether the nearest explicit block editing mode in the block's
 * ancestry is disabled.
 *
 * @param state    Global application state.
 * @param clientId The block client ID.
 *
 * @return  Whether an explicit parent block editing mode disables this
 *                   block.
 */
function hasExplicitDisabledParent( state: State, clientId: string ): boolean {
	let parent = state.blocks.parents.get( clientId );

	while ( parent !== undefined ) {
		const parentBlockEditingMode =
			state.blocks.blockEditingModes.get( parent );

		if ( parentBlockEditingMode ) {
			return parentBlockEditingMode === 'disabled';
		}

		parent = state.blocks.parents.get( parent );
	}

	return false;
}

/**
 * Returns the block tree displayed by List View.
 *
 * @param state        Global application state.
 * @param rootClientId Optional root client ID of block list.
 *
 * @return Tree of block objects with only clientID and innerBlocks set.
 */
function getListViewClientIdsTreeUnmemoized(
	state: State,
	rootClientId: string
) {
	return getFilteredClientIdsTreeUnmemoized(
		state,
		rootClientId,
		( _state, clientId ) => {
			// Non-disabled blocks are always shown in List view.
			if ( getBlockEditingMode( _state, clientId ) !== 'disabled' ) {
				return true;
			}

			const explicitBlockEditingMode =
				_state.blocks.blockEditingModes.get( clientId );
			if ( explicitBlockEditingMode ) {
				return explicitBlockEditingMode !== 'disabled';
			}

			if ( hasExplicitDisabledParent( _state, clientId ) ) {
				return false;
			}

			// When a contentOnly section is being edited, there's some special handling.
			if ( _state.editedContentOnlySection ) {
				// Blocks within the edited content only section generally have their block
				// editing mode flipped from disabled to default for editing, any disabled
				// blocks can still be excluded.
				if ( isWithinEditedContentOnlySection( _state, clientId ) ) {
					return false;
				}

				// Blocks that are not in another section but are disabled are shown.
				// These are blocks that would usually be visible.
				const parentSectionBlock = getParentSectionBlock(
					_state,
					clientId
				);
				if ( ! parentSectionBlock ) {
					return true;
				}

				// If a block is in another section, then it is only visible if its a content block.
				if ( isContentBlock( getBlockName( _state, clientId ) ) ) {
					return true;
				}
			}

			return false;
		}
	);
}

/**
 * Returns a tree of block objects with only clientID and innerBlocks set.
 * Blocks with a 'disabled' editing mode are not included.
 *
 * @param state        Global application state.
 * @param rootClientId Optional root client ID of block list.
 *
 * @return Tree of block objects with only clientID and innerBlocks set.
 */
export const getEnabledClientIdsTree = createRegistrySelector( () =>
	createSelector( getEnabledClientIdsTreeUnmemoized, ( state ) => [
		state.blocks.order,
		state.derivedBlockEditingModes,
		state.blocks.blockEditingModes,
	] )
);

/**
 * Returns the block tree displayed by List View.
 *
 * Blocks with a 'disabled' editing mode are usually not included. When a
 * content-only section is being edited, List View keeps visible outside-section
 * context blocks in the tree so they can be faded. Blocks that were already
 * hidden because they are non-content blocks inside another content-only section
 * remain hidden.
 *
 * @param state        Global application state.
 * @param rootClientId Optional root client ID of block list.
 *
 * @return Tree of block objects with only clientID and innerBlocks set.
 */
export const getListViewClientIdsTree = createRegistrySelector( () =>
	createSelector( getListViewClientIdsTreeUnmemoized, ( state ) => [
		state.blocks.order,
		state.derivedBlockEditingModes,
		state.blocks.blockEditingModes,
		state.blocks.parents,
		state.blocks.byClientId,
		state.blocks.attributes,
		state.blockListSettings,
		state.editedContentOnlySection,
		state.settings,
	] )
);

/**
 * Returns a list of a given block's ancestors, from top to bottom. Blocks with
 * a 'disabled' editing mode are excluded.
 *
 * @see getBlockParents
 *
 * @param state     Global application state.
 * @param clientId  The block client ID.
 * @param ascending Order results from bottom to top (true) or top
 *                  to bottom (false).
 */
export const getEnabledBlockParents = createSelector(
	( state, clientId, ascending = false ) => {
		return getBlockParents( state, clientId, ascending ).filter(
			( parent ) => getBlockEditingMode( state, parent ) !== 'disabled'
		);
	},
	( state ) => [
		state.blocks.parents,
		state.blocks.blockEditingModes,
		state.settings.templateLock,
		state.blockListSettings,
	]
);

/**
 * Selector that returns the data needed to display a prompt when certain
 * blocks are removed, or `false` if no such prompt is requested.
 *
 * @param state Global application state.
 *
 * @return  Data for removal prompt display, if any.
 */
export function getRemovalPromptData( state: State ) {
	return state.removalPromptData;
}

/**
 * Returns true if removal prompt exists, or false otherwise.
 *
 * @param state Global application state.
 *
 * @return Whether removal prompt exists.
 */
export function getBlockRemovalRules( state: State ) {
	return state.blockRemovalRules;
}

/**
 * Returns all style overrides, intended to be merged with global editor styles.
 *
 * Overrides are sorted to match the order of the blocks they relate to. This
 * is useful to maintain correct CSS cascade order.
 *
 * @param state Global application state.
 *
 * @return An array of style ID to style override pairs.
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
 * @param {State} state Editor state.
 *
 * @return {InserterMediaCategory[]} Inserter media categories.
 */
export function getRegisteredInserterMediaCategories( state: State ) {
	return state.registeredInserterMediaCategories;
}

/**
 * Returns an array containing the allowed inserter media categories.
 * It merges the registered media categories from extenders with the
 * core ones. It also takes into account the allowed `mime_types`, which
 * can be altered by `upload_mimes` filter and restrict some of them.
 *
 * @param state Global application state.
 *
 * @return Allowed inserter media categories.
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
		const coreInserterMediaCategoriesNames: string[] =
			inserterMediaCategories?.map(
				( { name }: InserterMediaCategory ) => name
			) || [];

		const mergedCategories: InserterMediaCategory[] = [
			...( inserterMediaCategories || [] ),
			...( registeredInserterMediaCategories || [] ).filter(
				( { name }: InserterMediaCategory ) =>
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
				( mimeType as string ).startsWith( `${ category.mediaType }/` )
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
 * @param state               Editor state.
 * @param [rootClientId=null] Target root client ID.
 *
 * @return  If there is at least one allowed pattern.
 */
export const hasAllowedPatterns = createRegistrySelector(
	( select: typeof globalSelect ) =>
		createSelector(
			( state, rootClientId = null ) => {
				const { getAllPatterns } = unlock( select( STORE_NAME ) );
				const patterns = getAllPatterns();
				const { allowedBlockTypes } = getSettings(
					state
				) as EditorSettings;
				return patterns.some( ( pattern: Pattern ) => {
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
			( state: State, rootClientId: string ) => [
				...getAllPatternsDependants( select )( state ),
				...getInsertBlockTypeDependants()(
					state,
					rootClientId ?? undefined
				),
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
					.find( ( { id }: { id: unknown } ) => id === _id );

				if ( ! block ) {
					return null;
				}

				return mapUserPattern(
					block,
					state.settings[ userPatternCategoriesSelectKey ]?.(
						select
					) ?? state.settings.__experimentalUserPatternCategories
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
				.map( ( userPattern: UserPattern ) =>
					mapUserPattern(
						userPattern,
						state.settings[ userPatternCategoriesSelectKey ]?.(
							select
						) ?? state.settings.__experimentalUserPatternCategories
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

const EMPTY_ARRAY: readonly unknown[] = [];

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
 * @param state Block editor state.
 *
 * @return  Element.
 */
export function getLastFocus( state: State ) {
	return state.lastFocus;
}

/**
 * Returns true if the user is dragging anything, or false otherwise. It is possible for a
 * user to be dragging data from outside of the editor, so this selector is separate from
 * the `isDraggingBlocks` selector which only returns true if the user is dragging blocks.
 *
 * @param state Global application state.
 *
 * @return Whether user is dragging.
 */
export function isDragging( state: State ) {
	return state.isDragging;
}

/**
 * Retrieves the expanded block from the state.
 *
 * @param state Block editor state.
 *
 * @return The client ID of the expanded block, if set.
 */
export function getExpandedBlock( state: State ) {
	return state.expandedBlock;
}

/**
 * Retrieves the client ID of the ancestor block that is content locking the block
 * with the provided client ID.
 *
 * @param state    Global application state.
 * @param clientId Client Id of the block.
 *
 * @return  Client ID of the ancestor block that is content locking the block.
 */
export const getContentLockingParent = ( state: State, clientId: string ) => {
	let current: string | undefined = clientId;
	let result;
	while ( ! result && ( current = state.blocks.parents.get( current ) ) ) {
		if ( getTemplateLock( state, current ) === 'contentOnly' ) {
			result = current;
		}
	}
	return result;
};

/**
 * Checks whether a block meets the raw criteria to be a section block,
 * without considering contextual factors like nesting or the edited
 * content-only section. Used internally by `isSectionBlock` and
 * `getParentSectionBlock` to avoid circular calls between them.
 *
 * @param state    Global application state.
 * @param clientId Client Id of the block.
 *
 * @return Whether the block is a candidate section block.
 */
function isSectionBlockCandidate( state: State, clientId: string ) {
	const blockName = getBlockName( state, clientId );
	if ( blockName === 'core/block' ) {
		return true;
	}

	const attributes = getBlockAttributes( state, clientId ) as BlockAttributes;
	const isTemplatePart = blockName === 'core/template-part';

	// When in an isolated editing context (e.g., editing a template part or pattern directly),
	// don't treat nested unsynced patterns as section blocks.
	const isIsolatedEditor = state.settings?.[ isIsolatedEditorKey ];

	const disableContentOnlyForUnsyncedPatterns =
		state.settings?.disableContentOnlyForUnsyncedPatterns;

	const disableContentOnlyForTemplateParts =
		state.settings?.disableContentOnlyForTemplateParts;

	if (
		( ( ! disableContentOnlyForUnsyncedPatterns &&
			attributes?.metadata?.patternName ) ||
			( isTemplatePart && ! disableContentOnlyForTemplateParts ) ) &&
		! isIsolatedEditor
	) {
		return true;
	}

	// TemplateLock cascades to all inner parent blocks. Only the top-level
	// block that's contentOnly templateLocked is the true contentLocker,
	// all the others are mere imitators.
	const hasContentOnlyTemplateLock =
		getTemplateLock( state, clientId ) === 'contentOnly';
	const rootClientId = getBlockRootClientId( state, clientId );
	const hasRootContentOnlyTemplateLock =
		getTemplateLock( state, rootClientId ) === 'contentOnly';
	if ( hasContentOnlyTemplateLock && ! hasRootContentOnlyTemplateLock ) {
		return true;
	}

	return false;
}

/**
 * Retrieves the client ID of the parent section block.
 *
 * @param state    Global application state.
 * @param clientId Client Id of the block.
 *
 * @return  Client ID of the ancestor block that is a contentOnly section, or undefined if none exists.
 */
export const getParentSectionBlock = ( state: State, clientId: string ) => {
	// If this block is within the edited content-only section,
	// it has no parent section — it's temporarily fully editable.
	if ( isWithinEditedContentOnlySection( state, clientId ) ) {
		return undefined;
	}

	let current: string | undefined = clientId;
	let result;

	// If sections are nested, return the top level section block.
	// Don't return early.
	while ( ( current = state.blocks.parents.get( current ) ) ) {
		if ( isSectionBlockCandidate( state, current ) ) {
			result = current;
		}
	}
	return result;
};

/**
 * Returns whether the block is a contentOnly section.
 *
 * @param state    Global application state.
 * @param clientId Client Id of the block.
 *
 * @return  Whether the block is a contentOnly section.
 */
export function isSectionBlock( state: State, clientId: string ) {
	// isWithinEditedContentOnlySection -
	// If the section is being edited or a parent section is being edited,
	// this block is temporarily not considered a section.
	//
	// getParentSectionBlock -
	// Only the top level section is considered the section,
	// a nested section is managed by its parent section.
	if (
		isWithinEditedContentOnlySection( state, clientId ) ||
		getParentSectionBlock( state, clientId )
	) {
		return false;
	}

	return isSectionBlockCandidate( state, clientId );
}

/**
 * Retrieves the client ID of the block that is a contentOnly section but is
 * currently being temporarily edited (contentOnly is deactivated).
 *
 * @param state Global application state.
 *
 * @return  The client ID of the block being temporarily edited.
 */
export function getEditedContentOnlySection( state: State ) {
	return state.editedContentOnlySection;
}

export function isWithinEditedContentOnlySection(
	state: State,
	clientId: string
) {
	if ( ! state.editedContentOnlySection ) {
		return false;
	}

	if ( state.editedContentOnlySection === clientId ) {
		return true;
	}

	let current: string | undefined = clientId;
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
 * @param state     Global application state.
 * @param clientIds An array of block client IDs.
 *
 * @return  An object where keys are client IDs and values are the corresponding block styles or undefined.
 */
export const getBlockStyles = createSelector(
	( state, clientIds ) =>
		clientIds.reduce(
			( styles: Record< string, any >, clientId: string ) => {
				styles[ clientId ] =
					state.blocks.attributes.get( clientId )?.style;
				return styles;
			},
			{}
		),
	( state: State, clientIds: string[] ) => [
		...clientIds.map(
			( clientId: string ) =>
				state.blocks.attributes.get( clientId )?.style
		),
	]
);

/**
 * Retrieves the client ID of the block which contains the blocks
 * acting as "sections" in the editor. This is typically the "main content"
 * of the template/post.
 *
 * @param state Editor state.
 *
 * @return  The section root client ID or undefined if not set.
 */
export function getSectionRootClientId( state: State ) {
	return state.settings?.[ sectionRootClientIdKey ];
}

/**
 * Returns whether the editor is considered zoomed out.
 *
 * @param state Global application state.
 * @return Whether the editor is zoomed.
 */
export function isZoomOut( state: State ) {
	return state.zoomLevel === 'auto-scaled' || state.zoomLevel < 100;
}

/**
 * Returns whether the zoom level.
 *
 * @param state Global application state.
 * @return Zoom level.
 */
export function getZoomLevel( state: State ) {
	return state.zoomLevel;
}

/**
 * Finds the closest block where the block is allowed to be inserted.
 *
 * @param state    Editor state.
 * @param name     Block name or names.
 * @param clientId Default insertion point.
 *
 * @return clientID of the closest container when the block name can be inserted.
 */
export function getClosestAllowedInsertionPoint(
	state: State,
	name: string[] | string,
	clientId = ''
) {
	const blockNames = Array.isArray( name ) ? name : [ name ];
	const areBlockNamesAllowedInClientId = ( id: string ) =>
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
		const parentClientId = getBlockRootClientId( state, current ) as string;
		current = parentClientId;
	}

	return current;
}

export function getClosestAllowedInsertionPointForPattern(
	state: State,
	pattern: Pattern,
	clientId: string
) {
	const { allowedBlockTypes } = getSettings( state ) as EditorSettings;
	const isAllowed = checkAllowListRecursive(
		getGrammar( pattern ),
		allowedBlockTypes
	);
	if ( ! isAllowed ) {
		return null;
	}
	const names = getGrammar( pattern )
		.map( ( { blockName: name } ) => name )
		.filter( ( name ): name is string => name !== null );
	return getClosestAllowedInsertionPoint( state, names, clientId );
}

/**
 * Where the point where the next block will be inserted into.
 *
 * @param state
 * @return  where the insertion point in the block editor is or null if none is set.
 */
export function getInsertionPoint( state: State ) {
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
 * @param state    Global application state.
 * @param clientId Client ID of the block.
 *
 * @return  Whether the block is hidden anywhere.
 */
export const isBlockHiddenAnywhere = ( state: State, clientId: string ) => {
	const blockName = getBlockName( state, clientId );
	if ( ! hasBlockSupport( blockName, 'visibility', true ) ) {
		return false;
	}
	const attributes = state.blocks.attributes.get( clientId ) as
		| BlockAttributes
		| undefined;
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
 * @param state    Global application state.
 * @param clientId Client ID of the block.
 *
 * @return  Whether the block is hidden everywhere.
 */
export const isBlockHiddenEverywhere = ( state: State, clientId: string ) => {
	const blockName = getBlockName( state, clientId );
	if ( ! hasBlockSupport( blockName, 'visibility', true ) ) {
		return false;
	}
	const attributes = state.blocks.attributes.get( clientId ) as
		| BlockAttributes
		| undefined;
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
 * @param state    Global application state.
 * @param clientId Client ID of the block.
 *
 * @return  Whether any parent block is hidden everywhere.
 */
export const isBlockParentHiddenEverywhere = (
	state: State,
	clientId: string
) => {
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
 * @param state    Global application state.
 * @param clientId Client ID of the block.
 * @param viewport Viewport to check ('desktop', 'tablet', 'mobile').
 *
 * @return  Whether the block is hidden at the viewport.
 */
export const isBlockHiddenAtViewport = (
	state: State,
	clientId: string,
	viewport: string
) => {
	if ( isBlockHiddenEverywhere( state, clientId ) ) {
		return true;
	}

	const attributes = state.blocks.attributes.get(
		clientId
	) as BlockAttributes;
	const blockVisibility = attributes?.metadata?.blockVisibility;

	const blockVisibilityViewport =
		blockVisibility && typeof blockVisibility === 'object'
			? blockVisibility.viewport
			: undefined;
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
 * @param state    Global application state.
 * @param clientId Client ID of the block.
 * @param viewport Viewport to check ('desktop', 'tablet', 'mobile').
 *
 * @return  Whether any parent block is hidden at the viewport.
 */
export const isBlockParentHiddenAtViewport = (
	state: State,
	clientId: string,
	viewport: string
) => {
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
 * @param state Global application state.
 * @return  Whether the block is currently sptlighted.
 */
export function hasBlockSpotlight( state: State ) {
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
 * @param state    Global application state.
 * @param clientId ClientId of the block.
 *
 * @return  Whether the block is currently locked.
 */
export function isEditLockedBlock( state: State, clientId: string ) {
	const attributes = getBlockAttributes( state, clientId ) as BlockAttributes;
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
 * @param state    Global application state.
 * @param clientId ClientId of the block.
 *
 * @return  Whether the block is currently locked.
 */
export function isMoveLockedBlock( state: State, clientId: string ) {
	const attributes = getBlockAttributes( state, clientId ) as BlockAttributes;
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
export function isRemoveLockedBlock( state: State, clientId: string ) {
	const attributes = getBlockAttributes( state, clientId ) as BlockAttributes;
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
 * @param state    Global application state.
 * @param clientId ClientId of the block.
 *
 * @return Whether the block is currently locked.
 */
export function isLockedBlock( state: State, clientId: string ) {
	return (
		isEditLockedBlock( state, clientId ) ||
		isMoveLockedBlock( state, clientId ) ||
		isRemoveLockedBlock( state, clientId )
	);
}

/**
 * Returns whether the list view content panel popover is open.
 *
 * @param state Global application state.
 *
 * @return Whether the popover is open.
 */
export function isListViewContentPanelOpen( state: State ) {
	return state.listViewContentPanelOpen;
}

/**
 * Returns whether a List View panel is opened.
 *
 * @param state    Global application state.
 * @param clientId Client ID of the block.
 *
 * @return Whether the panel is opened.
 */
export function isListViewPanelOpened( state: State, clientId: string ) {
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
 * @param state Global application state.
 *
 * @return The expand revision number.
 */
export function getListViewExpandRevision( state: State ) {
	return state.listViewExpandRevision || 0;
}

/**
 * Returns whether a block instance participates in List View-specific UI for
 * its inner blocks.
 *
 * Intentionally private: this is the derived participation logic (block type
 * `listView` support and the `core/navigation` special case) shared by the List
 * View consumers. A `listView`-supporting block drops out when it has no inner
 * blocks and its `allowedBlocks` (`[]` or `false`) permits no block: the nested
 * List View panel would render no rows and no appender, so it is hidden rather
 * than shown empty. This is a signal, not a guarantee — a child naming this
 * block as its `parent` stays insertable regardless (see `canInsertBlockType`);
 * that edge case is accepted to keep the check cheap. Keeping the read internal
 * lets this computation evolve without a back-compat commitment.
 *
 * @param state    Global application state.
 * @param clientId Client ID of the block.
 *
 * @return Whether the block participates in List View-specific UI.
 */
export function shouldRenderBlockListView( state: State, clientId: string ) {
	const blockName = getBlockName( state, clientId );

	// The navigation block always participates; its List View is core to how it
	// is edited, regardless of how its menu is locked or populated.
	if ( blockName === 'core/navigation' ) {
		return true;
	}

	if ( ! hasBlockSupport( blockName, 'listView' ) ) {
		return false;
	}

	// `allowedBlocks` permits no block when it is `[]` or `false`; an unset value
	// is unrestricted and is intentionally not matched.
	const allowedBlocks = (
		getBlockListSettings( state, clientId ) as BlockListSettings
	 )?.allowedBlocks;

	const isEmptyAndNoAllowedBlocks =
		getBlockOrder( state, clientId ).length === 0 &&
		( allowedBlocks === false ||
			( Array.isArray( allowedBlocks ) && allowedBlocks.length === 0 ) );

	return ! isEmptyAndNoAllowedBlocks;
}

/**
 * Returns the client IDs for the viewport modal, or null if
 * the modal is not open.
 *
 * @param state Global application state.
 *
 * @return Client IDs for the visibility modal, or null.
 */
export function getViewportModalClientIds( state: State ) {
	return state.viewportModalClientIds;
}

/**
 * Returns the requested inspector tab state, if any.
 *
 * @param state Global application state.
 *
 * @return The requested tab state with tabName and options, or null if no request is pending.
 */
export function getRequestedInspectorTab( state: State ) {
	return state.requestedInspectorTab;
}

const DEFAULT_BLOCK_STYLE_STATE = {
	viewport: 'default',
	pseudo: 'default',
};

/**
 * Returns the globally selected viewport style state. When set to a value other
 * than 'default', block style edits in the inspector apply to that viewport.
 *
 * @param state Global application state.
 *
 * @return The selected viewport style state.
 */
export function getStyleStateViewport( state: State ) {
	return state.styleStateViewport ?? DEFAULT_BLOCK_STYLE_STATE.viewport;
}

/**
 * Returns whether Responsive editing is enabled. When enabled, the device
 * preview also drives which viewport block style edits are applied to.
 *
 * @param state Global application state.
 *
 * @return Whether Responsive editing is enabled.
 */
export function isResponsiveEditing( state: State ) {
	return state.isResponsiveEditing;
}

/**
 * Returns the selected style state for a block's style controls.
 *
 * @param state    Global application state.
 * @param clientId The block client ID.
 *
 * @return The selected block style state.
 */
export const getSelectedBlockStyleState = createSelector(
	( state, clientId ) => {
		const perBlockState =
			state.selectedBlockStyleState?.clientId === clientId
				? state.selectedBlockStyleState.value ??
				  DEFAULT_BLOCK_STYLE_STATE
				: DEFAULT_BLOCK_STYLE_STATE;

		return {
			...perBlockState,
			// The viewport is tracked globally, so inject it here. This way
			// consumers receive a single combined state object instead of
			// merging the global viewport themselves, and selectors derived
			// from this stay consistent.
			viewport: getStyleStateViewport( state ),
		};
	},
	( state ) => [ state.styleStateViewport, state.selectedBlockStyleState ]
);

/**
 * Returns whether a non-default style state is selected for a block.
 *
 * @param state    Global application state.
 * @param clientId The block client ID.
 *
 * @return Whether a non-default block style state is selected.
 */
export function hasSelectedStyleState( state: State, clientId: string ) {
	const selectedState = getSelectedBlockStyleState( state, clientId );

	return (
		selectedState.viewport !== DEFAULT_BLOCK_STYLE_STATE.viewport ||
		selectedState.pseudo !== DEFAULT_BLOCK_STYLE_STATE.pseudo
	);
}

/**
 * Returns whether the selected style state is shown on the canvas.
 *
 * @param state    Global application state.
 * @param clientId The block client ID.
 *
 * @return Whether the selected style state is shown on the canvas.
 */
export function isSelectedBlockStyleStateShownOnCanvas(
	state: State,
	clientId: string
) {
	if ( state.selectedBlockStyleState?.clientId !== clientId ) {
		return true;
	}

	return state.selectedBlockStyleState.showStateOnCanvas ?? true;
}
