/**
 * External dependencies
 */
import createSelector from 'rememo';

/**
 * WordPress dependencies
 */
import { createRegistrySelector } from '@wordpress/data';

/**
 * Internal dependencies
 */
import {
	getBlockOrder,
	getBlockParents,
	getBlockEditingMode,
	getSettings,
	canInsertBlockType,
} from './selectors';
import { checkAllowListRecursive, getAllPatternsDependants } from './utils';
import { INSERTER_PATTERN_TYPES } from '../components/inserter/block-patterns-tab/utils';
import { STORE_NAME } from './constants';
import { unlock } from '../lock-unlock';

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
 * Returns a tree of block objects with only clientID and innerBlocks set.
 * Blocks with a 'disabled' editing mode are not included.
 *
 * @param {Object}  state        Global application state.
 * @param {?string} rootClientId Optional root client ID of block list.
 *
 * @return {Object[]} Tree of block objects with only clientID and innerBlocks set.
 */
export const getEnabledClientIdsTree = createSelector(
	( state, rootClientId = '' ) => {
		return getBlockOrder( state, rootClientId ).flatMap( ( clientId ) => {
			if ( getBlockEditingMode( state, clientId ) !== 'disabled' ) {
				return [
					{
						clientId,
						innerBlocks: getEnabledClientIdsTree( state, clientId ),
					},
				];
			}
			return getEnabledClientIdsTree( state, clientId );
		} );
	},
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
 * @param {Object} state Global application state.
 *
 * @return {Map} A map of style IDs to style overrides.
 */
export function getStyleOverrides( state ) {
	return state.styleOverrides;
}

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

export function getFetchedPatterns( state ) {
	return state.blockPatterns;
}

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
			getAllPatternsDependants( state ),
			state.settings.allowedBlockTypes,
			state.settings.templateLock,
			state.blockListSettings[ rootClientId ],
			state.blocks.byClientId.get( rootClientId ),
		]
	)
);

export const getAllPatterns = createRegistrySelector( ( select ) =>
	createSelector( ( state ) => {
		// This setting is left for back compat.
		const {
			__experimentalBlockPatterns = [],
			__experimentalUserPatternCategories = [],
			__experimentalReusableBlocks = [],
		} = state.settings;
		const userPatterns = ( __experimentalReusableBlocks ?? [] ).map(
			( userPattern ) => {
				return {
					name: `core/block/${ userPattern.id }`,
					id: userPattern.id,
					type: INSERTER_PATTERN_TYPES.user,
					title: userPattern.title.raw,
					categories: userPattern.wp_pattern_category.map(
						( catId ) => {
							const category = (
								__experimentalUserPatternCategories ?? []
							).find( ( { id } ) => id === catId );
							return category ? category.slug : catId;
						}
					),
					content: userPattern.content.raw,
					syncStatus: userPattern.wp_pattern_sync_status,
				};
			}
		);
		return [
			...userPatterns,
			...__experimentalBlockPatterns,
			...unlock( select( STORE_NAME ) ).getFetchedPatterns(),
		].filter(
			( x, index, arr ) =>
				index === arr.findIndex( ( y ) => x.name === y.name )
		);
	}, getAllPatternsDependants )
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

export function getAllBlockBindingsSources( state ) {
	return state.blockBindingsSources;
}

export function getBlockBindingsSource( state, sourceName ) {
	return state.blockBindingsSources[ sourceName ];
}
