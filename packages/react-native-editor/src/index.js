/**
 * WordPress dependencies
 */
import { applyFilters, doAction } from '@wordpress/hooks';
import { Component, cloneElement, registerComponent } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './globals';
import initialHtml from './initial-html';
import setupLocale from './setup-locale';
import { getTranslation as getGutenbergTranslation } from '../i18n-cache';

/**
 *	Register Gutenberg editor to React Native App registry.
 *
 * @typedef {Object} PluginTranslation
 * @property {string}              domain                       Domain of the plugin.
 * @property {Function}            getTranslation               Function for retrieving translations for a locale.
 *
 * @param    {Object}              arguments
 * @param    {Function}            arguments.beforeInitCallback Callback executed before the editor initialization.
 * @param    {PluginTranslation[]} arguments.pluginTranslations Array with plugin translations.
 */
const registerGutenberg = ( {
	beforeInitCallback,
	pluginTranslations = [],
} = {} ) => {
	class Gutenberg extends Component {
		constructor( props ) {
			super( props );

			const { rootTag, ...parentProps } = this.props;

			// Setup locale.
			setupLocale(
				parentProps.locale,
				parentProps.translations,
				getGutenbergTranslation,
				pluginTranslations
			);

			if ( beforeInitCallback ) {
				beforeInitCallback( parentProps );
			}

			// We have to lazy import the setup code to prevent executing any code located
			// at global scope before the editor is initialized, like translations retrieval.
			const setup = require( './setup' ).default;
			// Initialize editor
			this.editorComponent = setup();

			// TODO: Reinstate the optional setup configuration once we identify why
			// it throws an error after the latest RN 0.73 upgrade.
			// https://github.com/facebook/metro/blob/877933ddc03672a00214d26afe620b79479d6489/packages/metro-file-map/src/lib/TreeFS.js#L417
			// Apply optional setup configuration, enabling modification via hooks.
			// if ( __DEV__ && typeof require.context === 'function' ) {
			// 	const req = require.context( './', false, /setup-local\.js$/ );
			// 	req.keys().forEach( ( key ) => req( key ).default() );
			// }

			// Dispatch pre-render hooks.
			doAction( 'native.pre-render', parentProps );

			this.filteredProps = applyFilters(
				'native.block_editor_props',
				parentProps
			);
		}

		render() {
			return cloneElement( this.editorComponent, this.filteredProps );
		}
	}

	registerComponent( 'gutenberg', () => Gutenberg );
};

export { initialHtml as initialHtmlGutenberg, registerGutenberg, setupLocale };
