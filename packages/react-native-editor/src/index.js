/**
 * External dependencies
 */
import 'react-native-gesture-handler';

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

			// eslint-disable-next-line no-unused-vars
			const { rootTag, ...parentProps } = this.props;

			// Setup locale
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

			// Dispatch pre-render hooks
			doAction( 'native.pre-render', parentProps );

			this.filteredProps = applyFilters(
				'native.block_editor_props',
				parentProps
			);
		}

		componentDidMount() {
			// Dispatch post-render hooks
			doAction( 'native.render', this.filteredProps );
		}

		render() {
			return cloneElement( this.editorComponent, this.filteredProps );
		}
	}

	registerComponent( 'gutenberg', () => Gutenberg );
};

export { initialHtml as initialHtmlGutenberg, registerGutenberg, setupLocale };
