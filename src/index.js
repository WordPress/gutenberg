// External dependencies
import { AppRegistry, I18nManager, YellowBox } from 'react-native';
import React from 'react';

// Setting up environment
import './globals';
import { getTranslation } from '../i18n-cache';
import { setLocaleData } from '@wordpress/i18n';

const gutenbergSetup = () => {
	const apiFetch = require( '@wordpress/api-fetch' ).default;
	const wpData = require( '@wordpress/data' );

	// wp-api-fetch
	apiFetch.use( apiFetch.createRootURLMiddleware( 'https://public-api.wordpress.com/' ) );

	// wp-data
	const userId = 1;
	const storageKey = 'WP_DATA_USER_' + userId;
	wpData.use( wpData.plugins.persistence, { storageKey: storageKey } );
	wpData.use( wpData.plugins.controls );
};

const editorSetup = () => {
	require( '@wordpress/format-library' );
	const wpBlockLibrary = require( '@wordpress/block-library' );
	const wpBlocks = require( '@wordpress/blocks' );
	const registerCoreBlocks = wpBlockLibrary.registerCoreBlocks;
	const registerBlockType = wpBlocks.registerBlockType;
	const setUnregisteredTypeHandlerName = wpBlocks.setUnregisteredTypeHandlerName;
	const unregisterBlockType = wpBlocks.unregisterBlockType;
	const UnsupportedBlock = require( './block-types/unsupported-block' );

	// register and setup blocks
	registerCoreBlocks();
	registerBlockType( UnsupportedBlock.name, UnsupportedBlock.settings );
	setUnregisteredTypeHandlerName( UnsupportedBlock.name );

	// disable Code and More blocks for release
	if ( ! __DEV__ ) {
		unregisterBlockType( 'core/code' );
		unregisterBlockType( 'core/more' );
	}
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
		gutenbergSetup();
		editorSetup();
	}

	render() {
		// eslint-disable-next-line no-unused-vars
		const { locale, translations, ...otherProps } = this.props;
		// Need to wait for everything to be setup before requiring our App
		const App = require( './app/App' ).default;
		return (
			<App { ...otherProps } />
		);
	}
}

export function registerApp() {
	// Disable require circle warnings showing up in the app (they will still be visible in the console)
	YellowBox.ignoreWarnings( [ 'Require cycle:' ] );

	AppRegistry.registerComponent( 'gutenberg', () => RootComponent );
}
