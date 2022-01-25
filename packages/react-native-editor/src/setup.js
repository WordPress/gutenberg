/**
 * External dependencies
 */
import { I18nManager, LogBox } from 'react-native';

/**
 * WordPress dependencies
 */
import {
	validateThemeColors,
	validateThemeGradients,
} from '@wordpress/block-editor';
import { unregisterBlockType, getBlockType } from '@wordpress/blocks';
import { addAction, addFilter } from '@wordpress/hooks';
import * as wpData from '@wordpress/data';
import { initializeEditor } from '@wordpress/edit-post';
import { registerCoreBlocks } from '@wordpress/block-library';

/**
 * Internal dependencies
 */
import initialHtml from './initial-html';
import setupApiFetch from './api-fetch-setup';

const reactNativeSetup = () => {
	LogBox.ignoreLogs( [
		'Require cycle:', // TODO: Refactor to remove require cycles
		'lineHeight', // TODO: Remove lineHeight warning from Aztec
		/**
		 * TODO: Migrate to @gorhom/bottom-sheet or replace usage of
		 * LayoutAnimation to Animated. KeyboardAvoidingView's usage of
		 * LayoutAnimation collides with both BottomSheet and NavigationContainer
		 * usage of LayoutAnimation simultaneously https://git.io/J1lZv,
		 * https://git.io/J1lZY
		 */
		'Overriding previous layout animation',
	] );

	I18nManager.forceRTL( false ); // Change to `true` to debug RTL layout easily.
};

const gutenbergSetup = () => {
	// wp-data
	const userId = 1;
	const storageKey = 'WP_DATA_USER_' + userId;
	wpData.use( wpData.plugins.persistence, { storageKey } );

	setupApiFetch();

	const isHermes = () => global.HermesInternal !== null;
	// eslint-disable-next-line no-console
	console.log( 'Hermes is: ' + isHermes() );

	setupInitHooks();
};

const setupInitHooks = () => {
	addAction( 'native.pre-render', 'core/react-native-editor', ( props ) => {
		registerBlocks();

		const capabilities = props.capabilities ?? {};
		// Unregister non-supported blocks by capabilities
		if (
			getBlockType( 'core/block' ) !== undefined &&
			capabilities.reusableBlock !== true
		) {
			unregisterBlockType( 'core/block' );
		}
	} );

	// Map native props to Editor props
	// TODO: normalize props in the bridge (So we don't have to map initialData to initialHtml)
	addFilter(
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
				rawStyles,
				rawFeatures,
				galleryWithImageBlocks,
				locale,
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
				rawStyles,
				rawFeatures,
				galleryWithImageBlocks,
				locale,
			};
		}
	);
};

let blocksRegistered = false;
const registerBlocks = () => {
	if ( blocksRegistered ) {
		return;
	}

	registerCoreBlocks();

	blocksRegistered = true;
};

let editorComponent;
export default () => {
	if ( editorComponent ) {
		return editorComponent;
	}

	reactNativeSetup();
	gutenbergSetup();
	editorComponent = initializeEditor( 'gutenberg', 'post', 1 );

	return editorComponent;
};
