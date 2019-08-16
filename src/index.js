/**
 * External dependencies
 */
import { AppRegistry, I18nManager, YellowBox } from 'react-native';
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

const gutenbergSetup = () => {
	const apiFetch = require( '@wordpress/api-fetch' ).default;
	const wpData = require( '@wordpress/data' );

	// wp-api-fetch
	apiFetch.use( apiFetch.createRootURLMiddleware( 'https://public-api.wordpress.com/' ) );

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
		require( '@wordpress/edit-post' ).initializeEditor();
	}

	render() {
		const { initialHtmlModeEnabled } = this.props;
		let initialData = this.props.initialData;
		let initialTitle = this.props.initialTitle;
		if ( initialData === undefined && __DEV__ ) {
			initialData = initialHtml;
		}
		if ( initialTitle === undefined ) {
			initialTitle = 'Welcome to Gutenberg!';
		}
		const Editor = require( '@wordpress/edit-post' ).Editor;
		return (
			<Editor
				initialHtml={ initialData }
				initialHtmlModeEnabled={ initialHtmlModeEnabled }
				initialTitle={ initialTitle }
			/>
		);
	}
}

export function registerApp() {
	// Disable require circle warnings showing up in the app (they will still be visible in the console)
	YellowBox.ignoreWarnings( [ 'Require cycle:' ] );

	gutenbergSetup();

	AppRegistry.registerComponent( 'gutenberg', () => RootComponent );
}
