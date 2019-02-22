/** @flow
 * @format */

import { I18nManager } from 'react-native';
import React from 'react';

// Gutenberg imports
import apiFetch from '@wordpress/api-fetch';
import * as data from '@wordpress/data';
import { registerCoreBlocks } from '@wordpress/block-library';
import { registerBlockType, setUnregisteredTypeHandlerName, unregisterBlockType } from '@wordpress/blocks';
import '@wordpress/format-library';

import AppContainer from './AppContainer';
import initialHtml from './initial-html';
import * as UnsupportedBlock from '../block-types/unsupported-block';

type PropsType = {
	initialData: string,
	initialHtmlModeEnabled: boolean,
	initialTitle: string,
};

export default class AppProvider extends React.Component<PropsType> {
	constructor( props: PropsType ) {
		super( props );
		this.gutenbergSetup();
		this.editorSetup();
	}

	gutenbergSetup() {
		I18nManager.forceRTL( false ); // Change to `true` to debug RTL layout easily.

		// wp-api-fetch
		apiFetch.use( apiFetch.createRootURLMiddleware( 'https://public-api.wordpress.com/' ) );

		// wp-data
		const userId = 1;
		const storageKey = 'WP_DATA_USER_' + userId;
		data.use( data.plugins.persistence, { storageKey: storageKey } );
		data.use( data.plugins.controls );
	}

	editorSetup() {
		// register and setup blocks
		registerCoreBlocks();
		registerBlockType( UnsupportedBlock.name, UnsupportedBlock.settings );
		setUnregisteredTypeHandlerName( UnsupportedBlock.name );

		// disable Code and More blocks for release
		if ( ! __DEV__ ) {
			unregisterBlockType( 'core/code' );
			unregisterBlockType( 'core/more' );
		}
	}

	render() {
		const { initialHtmlModeEnabled } = this.props;
		let initialData = this.props.initialData;
		let initialTitle = this.props.initialTitle;
		if ( initialData === undefined ) {
			initialData = initialHtml;
		}
		if ( initialTitle === undefined ) {
			initialTitle = 'Welcome to Gutenberg!';
		}
		return (
			<AppContainer
				initialHtml={ initialData }
				initialHtmlModeEnabled={ initialHtmlModeEnabled }
				initialTitle={ initialTitle } />
		);
	}
}

