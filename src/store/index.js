/**
 * @format
 * @flow
 */

// Gutenberg imports
import { registerCoreBlocks } from '@wordpress/block-library';
import { registerBlockType, setUnregisteredTypeHandlerName } from '@wordpress/blocks';

import { createStore, applyMiddleware } from 'redux';
import { reducer } from './reducers';
import { html2State } from './utils';

import * as UnsupportedBlock from '../block-types/unsupported-block/';

import gutenbergBridgeMiddleware from './gutenbergBridgeMiddleware';

import type { StateType } from './types';

export * from './utils';
export * from './types';

registerCoreBlocks();
registerBlockType( UnsupportedBlock.name, UnsupportedBlock.settings );
setUnregisteredTypeHandlerName( UnsupportedBlock.name );

// const devToolsEnhancer =
// 	// ( 'development' === process.env.NODE_ENV && require( 'remote-redux-devtools' ).default ) ||
// 	() => {};

export function setupStore( state: StateType = html2State( '' ) ) {
	const store = createStore( reducer, state, applyMiddleware( gutenbergBridgeMiddleware ) );
	return store;
}
