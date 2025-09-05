/**
 * WordPress dependencies
 */
import { Platform } from '@wordpress/element';
import deprecated from '@wordpress/deprecated';
import { speak } from '@wordpress/a11y';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from './index';
import { unlock } from '../lock-unlock';

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
	'mediaSideload',
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
	let incomingSettings = settings;

	if ( Object.hasOwn( incomingSettings, '__unstableIsPreviewMode' ) ) {
		deprecated(
			"__unstableIsPreviewMode argument in wp.data.dispatch('core/block-editor').updateSettings",
			{
				since: '6.8',
				alternative: 'isPreviewMode',
			}
		);

		incomingSettings = { ...incomingSettings };
		incomingSettings.isPreviewMode =
			incomingSettings.__unstableIsPreviewMode;
		delete incomingSettings.__unstableIsPreviewMode;
	}

	let cleanSettings = incomingSettings;

	// There are no plugins in the mobile apps, so there is no
	// need to strip the experimental settings:
	if ( stripExperimentalSettings && Platform.OS === 'web' ) {
		cleanSettings = {};
		for ( const key in incomingSettings ) {
			if ( ! privateSettings.includes( key ) ) {
				cleanSettings[ key ] = incomingSettings[ key ];
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
		const canRemoveBlocks = select.canRemoveBlocks( clientIds );

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
			function flattenBlocks( blocks ) {
				const result = [];
				const stack = [ ...blocks ];
				while ( stack.length ) {
					const { innerBlocks, ...block } = stack.shift();
					stack.push( ...innerBlocks );
					result.push( block );
				}
				return result;
			}

			const blockList = clientIds.map( select.getBlock );
			const flattenedBlocks = flattenBlocks( blockList );

			// Find the first message and use it.
			let message;
			for ( const rule of rules ) {
				message = rule.callback( flattenedBlocks );
				if ( message ) {
					dispatch(
						displayBlockRemovalPrompt(
							clientIds,
							selectPrevious,
							message
						)
					);
					return;
				}
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
 * @param {string|string[]} clientIds      Client IDs of blocks to remove.
 * @param {boolean}         selectPrevious True if the previous block or the
 *                                         immediate parent (if no previous
 *                                         block exists) should be selected
 *                                         when a block is removed.
 * @param {string}          message        Message to display in the prompt.
 *
 * @return {Object} Action object.
 */
function displayBlockRemovalPrompt( clientIds, selectPrevious, message ) {
	return {
		type: 'DISPLAY_BLOCK_REMOVAL_PROMPT',
		clientIds,
		selectPrevious,
		message,
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
	return ( { select, dispatch, registry } ) => {
		const focusModeToRevert = unlock(
			registry.select( blockEditorStore )
		).getTemporarilyEditingFocusModeToRevert();
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

/**
 * Returns an action object used in signalling that the user has begun to drag.
 *
 * @return {Object} Action object.
 */
export function startDragging() {
	return {
		type: 'START_DRAGGING',
	};
}

/**
 * Returns an action object used in signalling that the user has stopped dragging.
 *
 * @return {Object} Action object.
 */
export function stopDragging() {
	return {
		type: 'STOP_DRAGGING',
	};
}

/**
 * @param {string|null} clientId The block's clientId, or `null` to clear.
 *
 * @return  {Object} Action object.
 */
export function expandBlock( clientId ) {
	return {
		type: 'SET_BLOCK_EXPANDED_IN_LIST_VIEW',
		clientId,
	};
}

/**
 * @param {Object} value
 * @param {string} value.rootClientId The root client ID to insert at.
 * @param {number} value.index        The index to insert at.
 *
 * @return {Object} Action object.
 */
export function setInsertionPoint( value ) {
	return {
		type: 'SET_INSERTION_POINT',
		value,
	};
}

/**
 * Temporarily modify/unlock the content-only block for editions.
 *
 * @param {string} clientId The client id of the block.
 */
export const modifyContentLockBlock =
	( clientId ) =>
	( { select, dispatch } ) => {
		dispatch.selectBlock( clientId );
		dispatch.__unstableMarkNextChangeAsNotPersistent();
		dispatch.updateBlockAttributes( clientId, {
			templateLock: undefined,
		} );
		dispatch.updateBlockListSettings( clientId, {
			...select.getBlockListSettings( clientId ),
			templateLock: false,
		} );
		const focusModeToRevert = select.getSettings().focusMode;
		dispatch.updateSettings( { focusMode: true } );
		dispatch.__unstableSetTemporarilyEditingAsBlocks(
			clientId,
			focusModeToRevert
		);
	};

/**
 * Sets the zoom level.
 *
 * @param {number} zoom the new zoom level
 * @return {Object} Action object.
 */
export const setZoomLevel =
	( zoom = 100 ) =>
	( { select, dispatch } ) => {
		// When switching to zoom-out mode, we need to select the parent section
		if ( zoom !== 100 ) {
			const firstSelectedClientId = select.getBlockSelectionStart();
			const sectionRootClientId = select.getSectionRootClientId();

			if ( firstSelectedClientId ) {
				let sectionClientId;

				if ( sectionRootClientId ) {
					const sectionClientIds =
						select.getBlockOrder( sectionRootClientId );

					// If the selected block is a section block, use it.
					if ( sectionClientIds?.includes( firstSelectedClientId ) ) {
						sectionClientId = firstSelectedClientId;
					} else {
						// If the selected block is not a section block, find
						// the parent section that contains the selected block.
						sectionClientId = select
							.getBlockParents( firstSelectedClientId )
							.find( ( parent ) =>
								sectionClientIds.includes( parent )
							);
					}
				} else {
					sectionClientId = select.getBlockHierarchyRootClientId(
						firstSelectedClientId
					);
				}

				if ( sectionClientId ) {
					dispatch.selectBlock( sectionClientId );
				} else {
					dispatch.clearSelectedBlock();
				}

				speak( __( 'You are currently in zoom-out mode.' ) );
			}
		}

		dispatch( {
			type: 'SET_ZOOM_LEVEL',
			zoom,
		} );
	};

/**
 * Resets the Zoom state.
 * @return {Object} Action object.
 */
export function resetZoomLevel() {
	return {
		type: 'RESET_ZOOM_LEVEL',
	};
}
