/**
 * WordPress dependencies
 */
import { registerCoreBlocks } from '@wordpress/core-blocks';
import { render, unmountComponentAtNode } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './assets/stylesheets/main.scss';
import './hooks';
import store from './store';
import { initializeMetaBoxState } from './store/actions';
import Editor from './editor';

/**
 * Configure heartbeat to refresh the wp-api nonce, keeping the editor
 * authorization intact.
 */
window.jQuery( document ).on( 'heartbeat-tick', ( event, response ) => {
	if ( response[ 'rest-nonce' ] ) {
		window.wpApiSettings.nonce = response[ 'rest-nonce' ];
	}
} );

/**
 * Reinitializes the editor after the user chooses to reboot the editor after
 * an unhandled error occurs, replacing previously mounted editor element using
 * an initial state from prior to the crash.
 *
 * @param {Object}  postId         ID of the post to edit.
 * @param {Object}  postType       Post type of the post to edit.
 * @param {Element} target         DOM node in which editor is rendered.
 * @param {?Object} settings       Editor settings object.
 * @param {Object}  overridePost   Post properties to override.
 */
export function reinitializeEditor( postId, postType, target, settings, overridePost ) {
	unmountComponentAtNode( target );
	const reboot = reinitializeEditor.bind( null, postId, target, settings, overridePost );

	render(
		<Editor settings={ settings } onError={ reboot } postId={ postId } postType={ postType } overridePost={ overridePost } recovery />,
		target
	);
}

/**
 * Initializes and returns an instance of Editor.
 *
 * The return value of this function is not necessary if we change where we
 * call initializeEditor(). This is due to metaBox timing.
 *
 * @param {string}  id            Unique identifier for editor instance.
 * @param {Object}  postId        ID of the post to edit.
 * @param {Object}  postType      Post type of the post to edit.
 * @param {?Object} settings      Editor settings object.
 * @param {Object}  overridePost  Post properties to override.
 *
 * @return {Object} Editor interface.
 */
export function initializeEditor( id, postId, postType, settings, overridePost ) {
	if ( 'production' !== process.env.NODE_ENV ) {
		// Remove with 3.0 release.
		window.console.info(
			'`isSelected` usage is no longer mandatory with `BlockControls`, `InspectorControls` and `RichText`. ' +
			'It is now handled by the editor internally to ensure that controls are visible only when block is selected. ' +
			'See updated docs: https://github.com/WordPress/gutenberg/blob/master/blocks/README.md#components.'
		);
	}

	const target = document.getElementById( id );
	const reboot = reinitializeEditor.bind( null, postId, postType, target, settings, overridePost );

	registerCoreBlocks();

	render(
		<Editor settings={ settings } onError={ reboot } postId={ postId } postType={ postType } overridePost={ overridePost } />,
		target
	);

	return {
		initializeMetaBoxes( metaBoxes ) {
			store.dispatch( initializeMetaBoxState( metaBoxes ) );
		},
	};
}

export { default as PluginPostPublishPanel } from './components/sidebar/plugin-post-publish-panel';
export { default as PluginPostStatusInfo } from './components/sidebar/plugin-post-status-info';
export { default as PluginPrePublishPanel } from './components/sidebar/plugin-pre-publish-panel';
export { default as PluginSidebar } from './components/sidebar/plugin-sidebar';
export { default as PluginSidebarMoreMenuItem } from './components/header/plugin-sidebar-more-menu-item';
