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
import { omit } from 'lodash';
import initialHtml from './initial-html';

const registerGutenberg = ( initCallback ) => {
	class Gutenberg extends Component {
		constructor() {
			super( ...arguments );

			const parentProps = omit( this.props || {}, [ 'rootTag' ] );

			// Setup locale
			const setupLocale = require( './setup-locale' ).default;
			setupLocale( parentProps.locale, parentProps.translations );

			// Initialize editor
			const setup = require( './setup' ).default;
			this.editorComponent = setup();

			if ( initCallback ) {
				initCallback( parentProps );
			}

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

export { initialHtml as initialHtmlGutenberg, registerGutenberg };
