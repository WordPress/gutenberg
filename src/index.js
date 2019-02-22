// External dependencies
import { AppRegistry } from 'react-native';
import React from 'react';

// Setting up environment
import './globals';

class RootComponent extends React.Component {
	constructor( props ) {
		super( props );
		this.setupLocale();
	}

	setupLocale() {
		const translationsFromParentApp = this.props.translations;
		let locale = this.props.locale;

		const setLocaleData = require( '@wordpress/i18n' ).setLocaleData;
		const getTranslation = require( '../i18n-cache' ).getTranslation;

		let gutenbergTranslations = getTranslation( locale );
		if ( locale && ! gutenbergTranslations ) {
			// Try stripping out the regional
			locale = locale.replace( /[-_][A-Za-z]+$/, '' );
			gutenbergTranslations = getTranslation( locale );
		}
		const translations = Object.assign( {}, gutenbergTranslations, translationsFromParentApp );
		// eslint-disable-next-line no-console
		console.log( 'locale', locale, translations );
		// Only change the locale if it's supported by gutenberg
		if ( gutenbergTranslations || translationsFromParentApp ) {
			setLocaleData( translations );
		}
	}

	render() {
		const App = require( './app/App' ).default;
		const initialProps = this.props;
		return (
			<App { ...this.props } />
		);
	}
}

export function registerApp() {
	// Making sure the environment is set up before loading any Component
	AppRegistry.registerComponent( 'gutenberg', () => RootComponent );
}
