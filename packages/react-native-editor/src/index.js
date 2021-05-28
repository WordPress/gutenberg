/**
 * External dependencies
 */
import { I18nManager } from 'react-native';

/**
 * Internal dependencies
 */
import './globals';
import { getTranslation } from '../i18n-cache';
import initialHtml from './initial-html';
import setupApiFetch from './api-fetch-setup';

/**
 * WordPress dependencies
 */
import {
	validateThemeColors,
	validateThemeGradients,
} from '@wordpress/block-editor';
import { dispatch } from '@wordpress/data';
import { unregisterBlockType } from '@wordpress/blocks';

const reactNativeSetup = () => {
	// Disable warnings as they disrupt the user experience in dev mode
	// eslint-disable-next-line no-console
	console.disableYellowBox = true;

	I18nManager.forceRTL( false ); // Change to `true` to debug RTL layout easily.
};

const gutenbergSetup = () => {
	const wpData = require( '@wordpress/data' );

	// wp-data
	const userId = 1;
	const storageKey = 'WP_DATA_USER_' + userId;
	wpData.use( wpData.plugins.persistence, { storageKey } );

	setupApiFetch();

	const isHermes = () => global.HermesInternal !== null;
	// eslint-disable-next-line no-console
	console.log( 'Hermes is: ' + isHermes() );

	setupInitHooks();

	const initializeEditor = require( '@wordpress/edit-post' ).initializeEditor;
	initializeEditor( 'gutenberg', 'post', 1 );
};

const setupInitHooks = () => {
	const wpHooks = require( '@wordpress/hooks' );

	wpHooks.addAction(
		'native.pre-render',
		'core/react-native-editor',
		( props ) => {
			setupLocale( props.locale, props.translations );

			const capabilities = props.capabilities ?? {};
			if ( capabilities.reusableBlock !== true ) {
				unregisterBlockType( 'core/block' );
			}
		}
	);

	// Map native props to Editor props
	// TODO: normalize props in the bridge (So we don't have to map initialData to initialHtml)
	wpHooks.addFilter(
		'native.block_editor_props',
		'core/react-native-editor',
		( props ) => {
			const { capabilities = {} } = props;
			let {
				initialData,
				initialTitle,
				postType,
				featuredImageId,
				colors,
				gradients,
			} = props;

			if ( initialData === undefined && __DEV__ ) {
				initialData = initialHtml;
			}
			if ( initialTitle === undefined ) {
				initialTitle = 'Welcome to Gutenberg!';
			}
			if ( postType === undefined ) {
				postType = 'post';
			}

			colors = validateThemeColors( colors );

			gradients = validateThemeGradients( gradients );

			return {
				initialHtml: initialData,
				initialHtmlModeEnabled: props.initialHtmlModeEnabled,
				initialTitle,
				postType,
				featuredImageId,
				capabilities,
				colors,
				gradients,
			};
		}
	);

	wpHooks.addAction(
		'native.render',
		'core/react-native-editor',
		( props ) => {
			const isAudioBlockEnabled =
				props.capabilities && props.capabilities.audioBlock;

			if ( isAudioBlockEnabled === true ) {
				dispatch( 'core/edit-post' ).showBlockTypes( [ 'core/audio' ] );
			} else {
				dispatch( 'core/edit-post' ).hideBlockTypes( [ 'core/audio' ] );
			}
		}
	);
};

let blocksRegistered = false;

const setupLocale = ( locale, extraTranslations ) => {
	const setLocaleData = require( '@wordpress/i18n' ).setLocaleData;

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

	if ( blocksRegistered ) {
		return;
	}

	const registerCoreBlocks = require( '@wordpress/block-library' )
		.registerCoreBlocks;
	registerCoreBlocks();
	blocksRegistered = true;
};

export { initialHtml as initialHtmlGutenberg };
export function doGutenbergNativeSetup() {
	reactNativeSetup();
	gutenbergSetup();
}
