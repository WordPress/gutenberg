/**
 * External dependencies
 */
import { I18nManager, LogBox } from 'react-native';

/**
 * WordPress dependencies
 */
import { unregisterBlockType, getBlockType } from '@wordpress/blocks';
import { addAction, addFilter, doAction } from '@wordpress/hooks';
import * as wpData from '@wordpress/data';
import { registerCoreBlocks } from '@wordpress/block-library';
// eslint-disable-next-line no-restricted-imports
import { initializeEditor } from '@wordpress/edit-post';

/**
 * Internal dependencies
 */
import initialHtml from './initial-html';
import setupApiFetch from './api-fetch-setup';

const reactNativeSetup = () => {
	LogBox.ignoreLogs( [
		'Require cycle:', // TODO: Refactor to remove require cycles
	] );

	I18nManager.forceRTL( false ); // Change to `true` to debug RTL layout easily.
};

const gutenbergSetup = () => {
	// wp-data
	const userId = 1;
	const storageKey = 'WP_DATA_USER_' + userId;
	wpData.use( wpData.plugins.persistence, { storageKey } );

	setupApiFetch();

	setupInitHooks();
};

const setupInitHooks = () => {
	addAction( 'native.pre-render', 'core/react-native-editor', ( props ) => {
		const capabilities = props.capabilities ?? {};

		registerBlocks();

		// Unregister non-supported blocks by capabilities
		if (
			getBlockType( 'core/block' ) !== undefined &&
			capabilities.reusableBlock !== true
		) {
			unregisterBlockType( 'core/block' );
		}

		doAction( 'native.post-register-core-blocks', props );
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
				hostAppNamespace,
				featuredImageId,
				rawStyles,
				rawFeatures,
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

			return {
				initialHtml: initialData,
				initialHtmlModeEnabled: props.initialHtmlModeEnabled,
				initialTitle,
				postType,
				hostAppNamespace,
				featuredImageId,
				capabilities,
				rawStyles,
				rawFeatures,
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
