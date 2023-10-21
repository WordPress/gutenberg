/**
 * External dependencies
 */
import createSelector from 'rememo';

/**
 * Internal dependencies
 */
import {
	getBlockOrder,
	getBlockParents,
	getBlockEditingMode,
} from './selectors';

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

/**
 * Returns true if the block with the given client ID and all of its descendants
 * have an editing mode of 'disabled', or false otherwise.
 *
 * @param {Object} state    Global application state.
 * @param {string} clientId The block client ID.
 *
 * @return {boolean} Whether the block and its descendants are disabled.
 */
export const isBlockSubtreeDisabled = createSelector(
	( state, clientId ) => {
		const isChildSubtreeDisabled = ( childClientId ) => {
			return (
				getBlockEditingMode( state, childClientId ) === 'disabled' &&
				getBlockOrder( state, childClientId ).every(
					isChildSubtreeDisabled
				)
			);
		};
		return (
			getBlockEditingMode( state, clientId ) === 'disabled' &&
			getBlockOrder( state, clientId ).every( isChildSubtreeDisabled )
		);
	},
	( state ) => [
		state.blocks.parents,
		state.blocks.order,
		state.blockEditingModes,
		state.blockListSettings,
	]
);

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
