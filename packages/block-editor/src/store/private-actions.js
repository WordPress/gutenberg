/**
 * WordPress dependencies
 */
import { Platform } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { undoIgnoreBlocks } from './undo-ignore';

const castArray = ( maybeArray ) =>
	Array.isArray( maybeArray ) ? maybeArray : [ maybeArray ];

/**
 * A list of private/experimental block editor settings that
 * should not become a part of the WordPress public API.
 * BlockEditorProvider will remove these settings from the
 * settings object it receives.
 *
 * @see https://github.com/WordPress/gutenberg/pull/46131
 */
const privateSettings = [
	'inserterMediaCategories',
	'blockInspectorAnimation',
];

/**
 * Action that updates the block editor settings and
 * conditionally preserves the experimental ones.
 *
 * @param {Object}  settings                          Updated settings
 * @param {Object}  options                           Options object.
 * @param {boolean} options.stripExperimentalSettings Whether to strip experimental settings.
 * @param {boolean} options.reset                     Whether to reset the settings.
 * @return {Object} Action object
 */
export function __experimentalUpdateSettings(
	settings,
	{ stripExperimentalSettings = false, reset = false } = {}
) {
	let cleanSettings = settings;
	// There are no plugins in the mobile apps, so there is no
	// need to strip the experimental settings:
	if ( stripExperimentalSettings && Platform.OS === 'web' ) {
		cleanSettings = {};
		for ( const key in settings ) {
			if ( ! privateSettings.includes( key ) ) {
				cleanSettings[ key ] = settings[ key ];
			}
		}
	}
	return {
		type: 'UPDATE_SETTINGS',
		settings: cleanSettings,
		reset,
	};
}

/**
 * Hides the block interface (eg. toolbar, outline, etc.)
 *
 * @return {Object} Action object.
 */
export function hideBlockInterface() {
	return {
		type: 'HIDE_BLOCK_INTERFACE',
	};
}

/**
 * Shows the block interface (eg. toolbar, outline, etc.)
 *
 * @return {Object} Action object.
 */
export function showBlockInterface() {
	return {
		type: 'SHOW_BLOCK_INTERFACE',
	};
}

/**
 * Yields action objects used in signalling that the blocks corresponding to
 * the set of specified client IDs are to be removed.
 *
 * Compared to `removeBlocks`, this private interface exposes an additional
 * parameter; see `forceRemove`.
 *
 * @param {string|string[]} clientIds      Client IDs of blocks to remove.
 * @param {boolean}         selectPrevious True if the previous block
 *                                         or the immediate parent
 *                                         (if no previous block exists)
 *                                         should be selected
 *                                         when a block is removed.
 * @param {boolean}         forceRemove    Whether to force the operation,
 *                                         bypassing any checks for certain
 *                                         block types.
 */
export const privateRemoveBlocks =
	( clientIds, selectPrevious = true, forceRemove = false ) =>
	( { select, dispatch, registry } ) => {
		if ( ! clientIds || ! clientIds.length ) {
			return;
		}

		clientIds = castArray( clientIds );
		const rootClientId = select.getBlockRootClientId( clientIds[ 0 ] );
		const canRemoveBlocks = select.canRemoveBlocks(
			clientIds,
			rootClientId
		);

		if ( ! canRemoveBlocks ) {
			return;
		}

		// In certain editing contexts, we'd like to prevent accidental removal
		// of important blocks. For example, in the site editor, the Query Loop
		// block is deemed important. In such cases, we'll ask the user for
		// confirmation that they intended to remove such block(s). However,
		// the editor instance is responsible for presenting those confirmation
		// prompts to the user. Any instance opting into removal prompts must
		// register using `setBlockRemovalRules()`.
		//
		// @see https://github.com/WordPress/gutenberg/pull/51145
		const rules = ! forceRemove && select.getBlockRemovalRules();
		if ( rules ) {
			const blockNamesForPrompt = new Set();

			// Given a list of client IDs of blocks that the user intended to
			// remove, perform a tree search (BFS) to find all block names
			// corresponding to "important" blocks, i.e. blocks that require a
			// removal prompt.
			const queue = [ ...clientIds ];
			while ( queue.length ) {
				const clientId = queue.shift();
				const blockName = select.getBlockName( clientId );
				if ( rules[ blockName ] ) {
					blockNamesForPrompt.add( blockName );
				}
				const innerBlocks = select.getBlockOrder( clientId );
				queue.push( ...innerBlocks );
			}

			// If any such blocks were found, trigger the removal prompt and
			// skip any other steps (thus postponing actual removal).
			if ( blockNamesForPrompt.size ) {
				dispatch(
					displayBlockRemovalPrompt(
						clientIds,
						selectPrevious,
						Array.from( blockNamesForPrompt )
					)
				);
				return;
			}
		}

		if ( selectPrevious ) {
			dispatch.selectPreviousBlock( clientIds[ 0 ], selectPrevious );
		}

		// We're batching these two actions because an extra `undo/redo` step can
		// be created, based on whether we insert a default block or not.
		registry.batch( () => {
			dispatch( { type: 'REMOVE_BLOCKS', clientIds } );
			// To avoid a focus loss when removing the last block, assure there is
			// always a default block if the last of the blocks have been removed.
			dispatch( ensureDefaultBlock() );
		} );
	};

/**
 * Action which will insert a default block insert action if there
 * are no other blocks at the root of the editor. This action should be used
 * in actions which may result in no blocks remaining in the editor (removal,
 * replacement, etc).
 */
export const ensureDefaultBlock =
	() =>
	( { select, dispatch } ) => {
		// To avoid a focus loss when removing the last block, assure there is
		// always a default block if the last of the blocks have been removed.
		const count = select.getBlockCount();
		if ( count > 0 ) {
			return;
		}

		// If there's an custom appender, don't insert default block.
		// We have to remember to manually move the focus elsewhere to
		// prevent it from being lost though.
		const { __unstableHasCustomAppender } = select.getSettings();
		if ( __unstableHasCustomAppender ) {
			return;
		}

		dispatch.insertDefaultBlock();
	};

/**
 * Returns an action object used in signalling that a block removal prompt must
 * be displayed.
 *
 * Contrast with `setBlockRemovalRules`.
 *
 * @param {string|string[]} clientIds           Client IDs of blocks to remove.
 * @param {boolean}         selectPrevious      True if the previous block
 *                                              or the immediate parent
 *                                              (if no previous block exists)
 *                                              should be selected
 *                                              when a block is removed.
 * @param {string[]}        blockNamesForPrompt Names of the blocks that
 *                                              triggered the need for
 *                                              confirmation before removal.
 *
 * @return {Object} Action object.
 */
function displayBlockRemovalPrompt(
	clientIds,
	selectPrevious,
	blockNamesForPrompt
) {
	return {
		type: 'DISPLAY_BLOCK_REMOVAL_PROMPT',
		clientIds,
		selectPrevious,
		blockNamesForPrompt,
	};
}

/**
 * Returns an action object used in signalling that a block removal prompt must
 * be cleared, either be cause the user has confirmed or canceled the request
 * for removal.
 *
 * @return {Object} Action object.
 */
export function clearBlockRemovalPrompt() {
	return {
		type: 'CLEAR_BLOCK_REMOVAL_PROMPT',
	};
}

/**
 * Returns an action object used to set up any rules that a block editor may
 * provide in order to prevent a user from accidentally removing certain
 * blocks. These rules are then used to display a confirmation prompt to the
 * user. For instance, in the Site Editor, the Query Loop block is important
 * enough to warrant such confirmation.
 *
 * IMPORTANT: Registering rules implicitly signals to the `privateRemoveBlocks`
 * action that the editor will be responsible for displaying block removal
 * prompts and confirming deletions. This action is meant to be used by
 * component `BlockRemovalWarningModal` only.
 *
 * The data is a record whose keys are block types (e.g. 'core/query') and
 * whose values are the explanation to be shown to users (e.g. 'Query Loop
 * displays a list of posts or pages.').
 *
 * Contrast with `displayBlockRemovalPrompt`.
 *
 * @param {Record<string,string>|false} rules Block removal rules.
 * @return {Object} Action object.
 */
export function setBlockRemovalRules( rules = false ) {
	return {
		type: 'SET_BLOCK_REMOVAL_RULES',
		rules,
	};
}

/**
 * Sets the client ID of the block settings menu that is currently open.
 *
 * @param {?string} clientId The block client ID.
 * @return {Object} Action object.
 */
export function setOpenedBlockSettingsMenu( clientId ) {
	return {
		type: 'SET_OPENED_BLOCK_SETTINGS_MENU',
		clientId,
	};
}

export function setStyleOverride( id, style ) {
	return {
		type: 'SET_STYLE_OVERRIDE',
		id,
		style,
	};
}

export function deleteStyleOverride( id ) {
	return {
		type: 'DELETE_STYLE_OVERRIDE',
		id,
	};
}

/**
 * A higher-order action that mark every change inside a callback as "non-persistent"
 * and ignore pushing to the undo history stack. It's primarily used for synchronized
 * derived updates from the block editor without affecting the undo history.
 *
 * @param {() => void} callback The synchronous callback to derive updates.
 */
export function syncDerivedUpdates( callback ) {
	return ( { dispatch, select, registry } ) => {
		registry.batch( () => {
			// Mark every change in the `callback` as non-persistent.
			dispatch( {
				type: 'SET_EXPLICIT_PERSISTENT',
				isPersistentChange: false,
			} );
			callback();
			dispatch( {
				type: 'SET_EXPLICIT_PERSISTENT',
				isPersistentChange: undefined,
			} );

			// Ignore pushing undo stack for the updated blocks.
			const updatedBlocks = select.getBlocks();
			undoIgnoreBlocks.add( updatedBlocks );
		} );
	};
}

/**
 * Action that sets the element that had focus when focus leaves the editor canvas.
 *
 * @param {Object} lastFocus The last focused element.
 *
 *
 * @return {Object} Action object.
 */
export function setLastFocus( lastFocus = null ) {
	return {
		type: 'LAST_FOCUS',
		lastFocus,
	};
}

/**
 * Action that stops temporarily editing as blocks.
 *
 * @param {string} clientId The block's clientId.
 */
export function stopEditingAsBlocks( clientId ) {
	return ( { select, dispatch } ) => {
		const focusModeToRevert =
			select.__unstableGetTemporarilyEditingFocusModeToRevert();
		dispatch.__unstableMarkNextChangeAsNotPersistent();
		dispatch.updateBlockAttributes( clientId, {
			templateLock: 'contentOnly',
		} );
		dispatch.updateBlockListSettings( clientId, {
			...select.getBlockListSettings( clientId ),
			templateLock: 'contentOnly',
		} );
		dispatch.updateSettings( { focusMode: focusModeToRevert } );
		dispatch.__unstableSetTemporarilyEditingAsBlocks();
	};
}

export function registerBlockBindingsSource( source ) {
	return {
		type: 'REGISTER_BLOCK_BINDINGS_SOURCE',
		sourceName: source.name,
		sourceLabel: source.label,
		useSource: source.useSource,
		lockAttributesEditing: source.lockAttributesEditing,
	};
}
