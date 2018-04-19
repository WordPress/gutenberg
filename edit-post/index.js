/**
 * External dependencies
 */
import { get, isString, some } from 'lodash';

/**
 * WordPress dependencies
 */
import { registerCoreBlocks } from '@wordpress/core-blocks';
import domReady from '@wordpress/dom-ready';
import { render, unmountComponentAtNode } from '@wordpress/element';
import { deprecated } from '@wordpress/utils';

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
 * @param {Element} target   DOM node in which editor is rendered.
 * @param {?Object} settings Editor settings object.
 */
export function reinitializeEditor( target, settings ) {
	unmountComponentAtNode( target );
	const reboot = reinitializeEditor.bind( null, target, settings );

	render(
		<Editor settings={ settings } onError={ reboot } recovery />,
		target
	);
}

/**
 * Initializes and returns an instance of Editor.
 *
 * The return value of this function is not necessary if we change where we
 * call initializeEditor(). This is due to metaBox timing.
 *
 * @param {string}  id       Unique identifier for editor instance.
 * @param {Object}  post     API entity for post to edit.
 * @param {?Object} settings Editor settings object.
 *
 * @return {Object} Editor interface.
 */
export function initializeEditor( id, post, settings ) {
	if ( 'production' !== process.env.NODE_ENV ) {
		// Remove with 3.0 release.
		window.console.info(
			'`isSelected` usage is no longer mandatory with `BlockControls`, `InspectorControls` and `RichText`. ' +
			'It is now handled by the editor internally to ensure that controls are visible only when block is selected. ' +
			'See updated docs: https://github.com/WordPress/gutenberg/blob/master/blocks/README.md#components.'
		);
	}

	let migratedSettings;
	const colors = get( settings, [ 'colors' ] );
	if ( some( colors, isString ) ) {
		migratedSettings = {
			...settings,
			colors: colors.map( ( color ) => isString( color ) ? { color } : color ),
		};
		deprecated( 'Setting theme colors without names', {
			version: '2.9',
			alternative: 'add_theme_support( \'colors\', array( \'name\' => \'my-color\', \'color\': \'#ff0\' );' }
		);
	}

	return new Promise( ( resolve ) => {
		domReady( () => {
			const target = document.getElementById( id );
			const reboot = reinitializeEditor.bind( null, target, settings );

			registerCoreBlocks();

			render(
				<Editor settings={ migratedSettings || settings } onError={ reboot } post={ post } />,
				target
			);

			resolve( {
				initializeMetaBoxes( metaBoxes ) {
					store.dispatch( initializeMetaBoxState( metaBoxes ) );
				},
			} );
		} );
	} );
}

export { default as PluginPostStatusVisibility } from './components/sidebar/plugin-post-status-visibility';
export { default as PluginSidebar } from './components/sidebar/plugin-sidebar';
export { default as PluginSidebarMoreMenuItem } from './components/header/plugin-sidebar-more-menu-item';
