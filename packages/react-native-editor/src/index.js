/**
 * External dependencies
 */
import 'react-native-get-random-values'; // This library works as a polyfill for the global crypto.getRandomValues which is needed by `uuid` version 7.0.0
import { AppRegistry, I18nManager } from 'react-native';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { setLocaleData } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './globals';
import { getTranslation } from '../i18n-cache';
import initialHtml from './initial-html';
import setupApiFetch from './api-fetch-setup';
import correctTextFontWeight from './text-font-weight-correct';

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
	const translations = Object.assign(
		{},
		gutenbergTranslations,
		extraTranslations
	);
	// eslint-disable-next-line no-console
	console.log( 'locale', locale, translations );
	// Only change the locale if it's supported by gutenberg
	if ( gutenbergTranslations || extraTranslations ) {
		setLocaleData( translations );
	}
};

export class RootComponent extends Component {
	constructor( props ) {
		super( props );
		setupLocale( props.locale, props.translations );
		setupApiFetch();
		correctTextFontWeight();
		require( '@wordpress/edit-post' ).initializeEditor();

		const isHermes = () => global.HermesInternal !== null;
		// eslint-disable-next-line no-console
		console.log( 'Hermes is: ' + isHermes() );
	}

	render() {
		const { initialHtmlModeEnabled } = this.props;
		let initialData = this.props.initialData;
		let initialTitle = this.props.initialTitle;
		let postType = this.props.postType;

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
				initialHtmlModeEnabled={ initialHtmlModeEnabled }
				initialTitle={ initialTitle }
				postType={ postType }
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
