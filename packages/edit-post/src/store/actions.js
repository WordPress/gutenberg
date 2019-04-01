/**
 * External dependencies
 */
import { castArray } from 'lodash';

/**
 * Internal dependencies
 */
import { subscribe, adjustSidebar } from './controls';
import { onChangeListener } from './utils';
import { STORE_KEY, VIEW_AS_LINK_SELECTOR } from './constants';

/**
 * Returns an action object used in signalling that the user opened an editor sidebar.
 *
 * @param {string} name Sidebar name to be opened.
 *
 * @return {Object} Action object.
 */
export function openGeneralSidebar( name ) {
	return {
		type: 'OPEN_GENERAL_SIDEBAR',
		name,
	};
}

/**
 * Returns an action object signalling that the user closed the sidebar.
 *
 * @return {Object} Action object.
 */
export function closeGeneralSidebar() {
	return {
		type: 'CLOSE_GENERAL_SIDEBAR',
	};
}

/**
 * Returns an action object used in signalling that the user opened a modal.
 *
 * @param {string} name A string that uniquely identifies the modal.
 *
 * @return {Object} Action object.
 */
export function openModal( name ) {
	return {
		type: 'OPEN_MODAL',
		name,
	};
}

/**
 * Returns an action object signalling that the user closed a modal.
 *
 * @return {Object} Action object.
 */
export function closeModal() {
	return {
		type: 'CLOSE_MODAL',
	};
}

/**
 * Returns an action object used in signalling that the user opened the publish
 * sidebar.
 *
 * @return {Object} Action object
 */
export function openPublishSidebar() {
	return {
		type: 'OPEN_PUBLISH_SIDEBAR',
	};
}

/**
 * Returns an action object used in signalling that the user closed the
 * publish sidebar.
 *
 * @return {Object} Action object.
 */
export function closePublishSidebar() {
	return {
		type: 'CLOSE_PUBLISH_SIDEBAR',
	};
}

/**
 * Returns an action object used in signalling that the user toggles the publish sidebar.
 *
 * @return {Object} Action object
 */
export function togglePublishSidebar() {
	return {
		type: 'TOGGLE_PUBLISH_SIDEBAR',
	};
}

/**
 * Returns an action object used to enable or disable a panel in the editor.
 *
 * @param {string} panelName A string that identifies the panel to enable or disable.
 *
 * @return {Object} Action object.
 */
export function toggleEditorPanelEnabled( panelName ) {
	return {
		type: 'TOGGLE_PANEL_ENABLED',
		panelName,
	};
}

/**
 * Returns an action object used to open or close a panel in the editor.
 *
 * @param {string} panelName A string that identifies the panel to open or close.
 *
 * @return {Object} Action object.
*/
export function toggleEditorPanelOpened( panelName ) {
	return {
		type: 'TOGGLE_PANEL_OPENED',
		panelName,
	};
}

/**
 * Returns an action object used to remove a panel from the editor.
 *
 * @param {string} panelName A string that identifies the panel to remove.
 *
 * @return {Object} Action object.
 */
export function removeEditorPanel( panelName ) {
	return {
		type: 'REMOVE_PANEL',
		panelName,
	};
}

/**
 * Returns an action object used to toggle a feature flag.
 *
 * @param {string} feature Feature name.
 *
 * @return {Object} Action object.
 */
export function toggleFeature( feature ) {
	return {
		type: 'TOGGLE_FEATURE',
		feature,
	};
}

export function switchEditorMode( mode ) {
	return {
		type: 'SWITCH_MODE',
		mode,
	};
}

/**
 * Returns an action object used to toggle a plugin name flag.
 *
 * @param {string} pluginName Plugin name.
 *
 * @return {Object} Action object.
 */
export function togglePinnedPluginItem( pluginName ) {
	return {
		type: 'TOGGLE_PINNED_PLUGIN_ITEM',
		pluginName,
	};
}

/**
 * Returns an action object used in signalling that block types by the given
 * name(s) should be hidden.
 *
 * @param {string[]} blockNames Names of block types to hide.
 *
 * @return {Object} Action object.
 */
export function hideBlockTypes( blockNames ) {
	return {
		type: 'HIDE_BLOCK_TYPES',
		blockNames: castArray( blockNames ),
	};
}

/**
 * Returns an action object used in signalling that block types by the given
 * name(s) should be shown.
 *
 * @param {string[]} blockNames Names of block types to show.
 *
 * @return {Object} Action object.
 */
export function showBlockTypes( blockNames ) {
	return {
		type: 'SHOW_BLOCK_TYPES',
		blockNames: castArray( blockNames ),
	};
}

/**
 * Returns an action object used in signaling
 * what Meta boxes are available in which location.
 *
 * @param {Object} metaBoxesPerLocation Meta boxes per location.
 *
 * @return {Object} Action object.
 */
export function setAvailableMetaBoxesPerLocation( metaBoxesPerLocation ) {
	return {
		type: 'SET_META_BOXES_PER_LOCATIONS',
		metaBoxesPerLocation,
	};
}

/**
 * Returns an action object used to request meta box update.
 *
 * @return {Object} Action object.
 */
export function requestMetaBoxUpdates() {
	return {
		type: 'REQUEST_META_BOX_UPDATES',
	};
}

/**
 * Returns an action object used signal a successful meta box update.
 *
 * @return {Object} Action object.
 */
export function metaBoxUpdatesSuccess() {
	return {
		type: 'META_BOX_UPDATES_SUCCESS',
	};
}

/**
 * Returns an action generator used to initialize some subscriptions for the
 * post editor:
 *
 * - subscription for toggling the `edit-post/block` general sidebar when a
 *   block is selected.
 * - subscription for hiding/showing the sidebar depending on size of viewport.
 * - subscription for updating the "View Post" link in the admin bar when
 *   permalink is updated.
 */
export function* init() {
	// Select the block settings tab when the selected block changes
	yield subscribe( ( registry ) => onChangeListener(
		() => !! registry.select( 'core/block-editor' )
			.getBlockSelectionStart(),
		( hasBlockSelection ) => {
			if ( ! registry.select( 'core/edit-post' ).isEditorSidebarOpened() ) {
				return;
			}
			if ( hasBlockSelection ) {
				registry.dispatch( STORE_KEY )
					.openGeneralSidebar( 'edit-post/block' );
			} else {
				registry.dispatch( STORE_KEY )
					.openGeneralSidebar( 'edit-post/document' );
			}
		}
	) );
	// hide/show the sidebar depending on size of viewport.
	yield adjustSidebar();
	// Update View Post link in the admin bar when permalink is updated.
	yield subscribe( ( registry ) => onChangeListener(
		() => registry.select( 'core/editor' ).getCurrentPost().link,
		( newPermalink ) => {
			if ( ! newPermalink ) {
				return;
			}
			const nodeToUpdate = document.querySelector( VIEW_AS_LINK_SELECTOR );
			if ( ! nodeToUpdate ) {
				return;
			}
			nodeToUpdate.setAttribute( 'href', newPermalink );
		}
	) );
}

