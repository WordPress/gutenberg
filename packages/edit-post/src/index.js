/**
 * WordPress dependencies
 */
import '@wordpress/core-data';
import '@wordpress/block-editor';
import '@wordpress/editor';
import '@wordpress/nux';
import '@wordpress/viewport';
import '@wordpress/notices';
import { registerCoreBlocks } from '@wordpress/block-library';
import { render, unmountComponentAtNode } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './hooks';
import './plugins';
import './store';
import Editor from './editor';

/**
 * Reinitializes the editor after the user chooses to reboot the editor after
 * an unhandled error occurs, replacing previously mounted editor element using
 * an initial state from prior to the crash.
 *
 * @param {Object}  postType     Post type of the post to edit.
 * @param {Object}  postId       ID of the post to edit.
 * @param {Element} target       DOM node in which editor is rendered.
 * @param {?Object} settings     Editor settings object.
 * @param {Object}  initialEdits Programmatic edits to apply initially, to be
 *                               considered as non-user-initiated (bypass for
 *                               unsaved changes prompt).
 */
export function reinitializeEditor( postType, postId, target, settings, initialEdits ) {
	unmountComponentAtNode( target );
	const reboot = reinitializeEditor.bind( null, postType, postId, target, settings, initialEdits );

	render(
		<Editor
			settings={ settings }
			onError={ reboot }
			postId={ postId }
			postType={ postType }
			initialEdits={ initialEdits }
			recovery
		/>,
		target
	);
}

/**
 * Initializes and returns an instance of Editor.
 *
 * The return value of this function is not necessary if we change where we
 * call initializeEditor(). This is due to metaBox timing.
 *
 * @param {string}  id           Unique identifier for editor instance.
 * @param {Object}  postType     Post type of the post to edit.
 * @param {Object}  postId       ID of the post to edit.
 * @param {?Object} settings     Editor settings object.
 * @param {Object}  initialEdits Programmatic edits to apply initially, to be
 *                               considered as non-user-initiated (bypass for
 *                               unsaved changes prompt).
 */
export function initializeEditor( id, postType, postId, settings, initialEdits ) {
	const target = document.getElementById( id );
	const reboot = reinitializeEditor.bind( null, postType, postId, target, settings, initialEdits );

	registerCoreBlocks();

	// Show a console log warning if the browser is not in Standards rendering mode.
	const documentMode = document.compatMode === 'CSS1Compat' ? 'Standards' : 'Quirks';
	if ( documentMode !== 'Standards' ) {
		// eslint-disable-next-line no-console
		console.warn( "Your browser is using Quirks Mode. \nThis can cause rendering issues such as blocks overlaying meta boxes in the editor. Quirks Mode can be triggered by PHP errors or HTML code appearing before the opening <!DOCTYPE html>. Try checking the raw page source or your site's PHP error log and resolving errors there, removing any HTML before the doctype, or disabling plugins." );
	}

	render(
		<Editor
			settings={ settings }
			onError={ reboot }
			postId={ postId }
			postType={ postType }
			initialEdits={ initialEdits }
		/>,
		target
	);
}

export { default as PluginBlockSettingsMenuItem } from './components/block-settings-menu/plugin-block-settings-menu-item';
export { default as PluginDocumentSettingPanel } from './components/sidebar/plugin-document-setting-panel';
export { default as PluginMoreMenuItem } from './components/header/plugin-more-menu-item';
export { default as PluginPostPublishPanel } from './components/sidebar/plugin-post-publish-panel';
export { default as PluginPostStatusInfo } from './components/sidebar/plugin-post-status-info';
export { default as PluginPrePublishPanel } from './components/sidebar/plugin-pre-publish-panel';
export { default as PluginSidebar } from './components/sidebar/plugin-sidebar';
export { default as PluginSidebarMoreMenuItem } from './components/header/plugin-sidebar-more-menu-item';
