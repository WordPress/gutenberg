/** @flow
 * @format */

import '../globals';

import React from 'react';

// Gutenberg imports
import { registerCoreBlocks } from '@wordpress/block-library';
import { registerBlockType, setUnregisteredTypeHandlerName } from '@wordpress/blocks';

import AppContainer from './AppContainer';
import initialHtml from './initial-html';

import * as UnsupportedBlock from '../block-types/unsupported-block/';

registerCoreBlocks();
registerBlockType( UnsupportedBlock.name, UnsupportedBlock.settings );
setUnregisteredTypeHandlerName( UnsupportedBlock.name );

const AppProvider = () => (
	<AppContainer initialHtml={ initialHtml } />
);

export default AppProvider;
