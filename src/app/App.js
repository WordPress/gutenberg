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
};

const AppProvider = ( { initialData, initialHtmlModeEnabled }: PropsType ) => {
	if ( initialData === undefined ) {
		initialData = initialHtml;
	}
	return (
		<AppContainer initialHtml={ initialData } initialHtmlModeEnabled={ initialHtmlModeEnabled } />
	);
};

export default AppProvider;
