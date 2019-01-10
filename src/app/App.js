/** @flow
 * @format */

import '../globals';

import React from 'react';

// Gutenberg imports
import { registerCoreBlocks } from '@wordpress/block-library';
import { registerBlockType, setUnregisteredTypeHandlerName, unregisterBlockType } from '@wordpress/blocks';

import AppContainer from './AppContainer';
import initialHtml from './initial-html';

import * as UnsupportedBlock from '../block-types/unsupported-block/';

registerCoreBlocks();
registerBlockType( UnsupportedBlock.name, UnsupportedBlock.settings );
setUnregisteredTypeHandlerName( UnsupportedBlock.name );

// disable Code and More blocks for release
if ( ! __DEV__ ) {
	unregisterBlockType( 'core/code' );
	unregisterBlockType( 'core/more' );
}

type PropsType = {
	initialData: string,
	initialHtmlModeEnabled: boolean,
	initialTitle: string,
};

const AppProvider = ( { initialTitle, initialData, initialHtmlModeEnabled }: PropsType ) => {
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
			title={ initialTitle } />
	);
};

export default AppProvider;
