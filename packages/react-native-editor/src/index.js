/**
 * External dependencies
 */
import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';

/**
 * WordPress dependencies
 */
import { applyFilters, doAction } from '@wordpress/hooks';
import { Component, cloneElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './globals';
import { omit } from 'lodash';
import initialHtml from './initial-html';
import setupLocale from './setup-locale';
import { getTranslation as getGutenbergTranslation } from '../i18n-cache';

const registerGutenberg = ( { beforeInitCallback, pluginTranslations } ) => {
	class Gutenberg extends Component {
		constructor() {
			super( ...arguments );

			const parentProps = omit( this.props || {}, [ 'rootTag' ] );

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

			// Initialize editor
			const setup = require( './setup' ).default;
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

	AppRegistry.registerComponent( 'gutenberg', () => Gutenberg );
};

export { initialHtml as initialHtmlGutenberg, registerGutenberg, setupLocale };
