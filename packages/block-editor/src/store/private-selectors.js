/**
 * External dependencies
 */
import createSelector from 'rememo';

/**
 * WordPress dependencies
 */
import { select } from '@wordpress/data';
import { store as blocksStore } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import {
	getBlockRootClientId,
	getTemplateLock,
	getBlockName,
	getBlockOrder,
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
 * @typedef {import('../components/block-editing-mode').BlockEditingMode} BlockEditingMode
 */

/**
 * Returns the block editing mode for a given block.
 *
 * The mode can be one of three options:
 *
 * - `'disabled'`: Prevents editing the block entirely, i.e. it cannot be
 *   selected.
 * - `'contentOnly'`: Hides all non-content UI, e.g. auxiliary controls in the
 *   toolbar, the block movers, block settings.
 * - `'default'`: Allows editing the block as normal.
 *
 * Blocks can set a mode using the `useBlockEditingMode` hook.
 *
 * The mode is inherited by all of the block's inner blocks, unless they have
 * their own mode.
 *
 * A template lock can also set a mode. If the template lock is `'contentOnly'`,
 * the block's mode is overridden to `'contentOnly'` if the block has a content
 * role attribute, or `'disabled'` otherwise.
 *
 * @see useBlockEditingMode
 *
 * @param {Object} state    Global application state.
 * @param {string} clientId The block client ID, or `''` for the root container.
 *
 * @return {BlockEditingMode} The block editing mode. One of `'disabled'`,
 *                            `'contentOnly'`, or `'default'`.
 */
export const getBlockEditingMode = createSelector(
	( state, clientId = '' ) => {
		if ( state.blockEditingModes.has( clientId ) ) {
			return state.blockEditingModes.get( clientId );
		}
		if ( ! clientId ) {
			return 'default';
		}
		const rootClientId = getBlockRootClientId( state, clientId );
		const templateLock = getTemplateLock( state, rootClientId );
		if ( templateLock === 'contentOnly' ) {
			const name = getBlockName( state, clientId );
			// TODO: Terrible hack! We're calling the global select() function
			// here instead of using createRegistrySelector(). The problem with
			// using createRegistrySelector() is that then the public
			// block-editor selectors (e.g. canInsertBlockTypeUnmemoized) can't
			// call this private block-editor selector due to a bug in
			// @wordpress/data. See
			// https://github.com/WordPress/gutenberg/pull/50985.
			const isContent =
				select( blocksStore ).__experimentalHasContentRoleAttribute(
					name
				);
			return isContent ? 'contentOnly' : 'disabled';
		}
		const parentMode = getBlockEditingMode( state, rootClientId );
		return parentMode === 'contentOnly' ? 'default' : parentMode;
	},
	( state ) => [
		state.blockEditingModes,
		state.blocks.parents,
		state.settings.templateLock,
		state.blockListSettings,
	]
);

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
			const mode = state.blockEditingModes.get( childClientId );
			return (
				( mode === undefined || mode === 'disabled' ) &&
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
	( state ) => [ state.blockEditingModes, state.blocks.parents ]
);
