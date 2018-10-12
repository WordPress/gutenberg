/**
 * WordPress dependencies
 */
import '@wordpress/core-data';
import '@wordpress/editor';
import '@wordpress/nux';
import '@wordpress/viewport';
import { registerCoreBlocks } from '@wordpress/block-library';
import { render, unmountComponentAtNode } from '@wordpress/element';
import { dispatch } from '@wordpress/data';
import deprecated from '@wordpress/deprecated';
import { registerBlockType, registerBlockStyle } from '@wordpress/blocks';
import { addFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import './hooks';
import './plugins';
import store from './store';
import { initializeMetaBoxState } from './store/actions';
import Editor from './editor';

/**
 * Reinitializes the editor after the user chooses to reboot the editor after
 * an unhandled error occurs, replacing previously mounted editor element using
 * an initial state from prior to the crash.
 *
 * @param {Object}  postType       Post type of the post to edit.
 * @param {Object}  postId         ID of the post to edit.
 * @param {Element} target         DOM node in which editor is rendered.
 * @param {?Object} settings       Editor settings object.
 * @param {Object}  overridePost   Post properties to override.
 */
export function reinitializeEditor( postType, postId, target, settings, overridePost ) {
	unmountComponentAtNode( target );
	const reboot = reinitializeEditor.bind( null, postType, postId, target, settings, overridePost );

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
 * @param {Object}  postType      Post type of the post to edit.
 * @param {Object}  postId        ID of the post to edit.
 * @param {?Object} settings      Editor settings object.
 * @param {Object}  overridePost  Post properties to override.
 *
 * @return {Object} Editor interface.
 */
export function initializeEditor( id, postType, postId, settings, overridePost ) {
	const target = document.getElementById( id );
	const reboot = reinitializeEditor.bind( null, postType, postId, target, settings, overridePost );

	// TODO: <START>Remove this later</START>.
	registerBlockStyle( 'core/list', {
		label: 'Large',
		name: 'large',
	} );
	registerBlockStyle( 'wp-js-plugin-starter/hello-world', {
		label: 'Hello',
		name: 'hello',
	} );
	addFilter( 'blocks.registerBlockType', 'wp-js-plugin-starter/hello-world/filter-name', ( blockType, name ) => {
		if ( name === 'wp-js-plugin-starter/hello-world' ) {
			return {
				...blockType,
				category: 'nope',
			};
		}

		return blockType;
	} );
	// TODO: <END>Remove this later</END>.

	// TODO: We no longer need to register core blocks in here. We can do it at any time.
	registerCoreBlocks();

	// TODO: <START>Remove this later</START>.
	registerBlockType( 'wp-js-plugin-starter/hello-world', {
		title: 'Hello World',
		description: 'Just another Hello World block',
		icon: 'admin-site',
		category: 'widgets',

		edit: function() {
			return (
				<p>Hello Editor</p>
			);
		},

		save: function() {
			return (
				<p>Hello Frontend</p>
			);
		},
	} );
	// TODO: <END>Remove this later</END>.

	dispatch( 'core/nux' ).triggerGuide( [
		'core/editor.inserter',
		'core/editor.settings',
		'core/editor.preview',
		'core/editor.publish',
	] );

	render(
		<Editor settings={ settings } onError={ reboot } postId={ postId } postType={ postType } overridePost={ overridePost } />,
		target
	);

	return {
		initializeMetaBoxes( metaBoxes ) {
			deprecated( 'editor.initializeMetaBoxes', {
				alternative: 'setActiveMetaBoxLocations action (`core/edit-post`)',
				plugin: 'Gutenberg',
				version: '4.2',
			} );

			store.dispatch( initializeMetaBoxState( metaBoxes ) );
		},
	};
}

export { default as PluginBlockSettingsMenuItem } from './components/block-settings-menu/plugin-block-settings-menu-item';
export { default as PluginPostPublishPanel } from './components/sidebar/plugin-post-publish-panel';
export { default as PluginPostStatusInfo } from './components/sidebar/plugin-post-status-info';
export { default as PluginPrePublishPanel } from './components/sidebar/plugin-pre-publish-panel';
export { default as PluginSidebar } from './components/sidebar/plugin-sidebar';
export { default as PluginSidebarMoreMenuItem } from './components/header/plugin-sidebar-more-menu-item';
