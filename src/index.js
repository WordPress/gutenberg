/**
 * External dependencies
 *
 * @format
 */

/**
 * External dependencies
 */
import { AppRegistry, I18nManager } from 'react-native';
import React from 'react';

/**
 * WordPress dependencies
 */
import { setLocaleData } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './globals';
import { getTranslation } from '../i18n-cache';
import initialHtml from './initial-html';
import setupApiFetch from './api-fetch-setup';
import correctTextFontWeight from './text-font-weight-correct';
import setupJetpackEditor from './jetpack-editor-setup';

const gutenbergSetup = () => {
	const wpData = require( '@wordpress/data' );

	// wp-data
	const userId = 1;
	const storageKey = 'WP_DATA_USER_' + userId;
	wpData.use( wpData.plugins.persistence, { storageKey } );
};

const setupLocale = ( locale, extraTranslations ) => {
	I18nManager.forceRTL( false ); // Change to `true` to debug RTL layout easily.

	let gutenbergTranslations = getTranslation( locale );
	if ( locale && ! gutenbergTranslations ) {
		// Try stripping out the regional
		locale = locale.replace( /[-_][A-Za-z]+$/, '' );
		gutenbergTranslations = getTranslation( locale );
	}
	const translations = Object.assign( {}, gutenbergTranslations, extraTranslations );
	// eslint-disable-next-line no-console
	console.log( 'locale', locale, translations );
	// Only change the locale if it's supported by gutenberg
	if ( gutenbergTranslations || extraTranslations ) {
		setLocaleData( translations );
	}
};

export class RootComponent extends React.Component {
	constructor( props ) {
		super( props );
		setupLocale( props.locale, props.translations );
		setupApiFetch();
		correctTextFontWeight();
		setupJetpackEditor( props.jetpackState || { blogId: 1, isJetpackActive: true } );
		require( '@wordpress/edit-post' ).initializeEditor();

		const isHermes = () => global.HermesInternal !== null;
		// eslint-disable-next-line no-console
		console.log( 'Hermes is: ' + isHermes() );
	}

	render() {
		let { initialData, initialTitle, postType, capabilities = {} } = this.props;

		if ( initialData === undefined && __DEV__ ) {
			initialData = initialHtml;
		}
		if ( initialTitle === undefined ) {
			initialTitle = 'Welcome to Gutenberg!';
		}
		if ( postType === undefined ) {
			postType = 'post';
		}
		const Editor = require( '@wordpress/edit-post' ).Editor;
		return (
			<Editor
				initialHtml={ initialData }
				initialHtmlModeEnabled={ this.props.initialHtmlModeEnabled }
				initialTitle={ initialTitle }
				postType={ postType }
				capabilities={ capabilities }
				colors={ this.props.colors }
				gradients={ this.props.gradients }
			/>
		);
	}
}

export function registerApp() {
	// Disable warnings as they disrupt the user experience in dev mode
	// eslint-disable-next-line no-console
	console.disableYellowBox = true;

	gutenbergSetup();

	AppRegistry.registerComponent( 'gutenberg', () => RootComponent );
}
