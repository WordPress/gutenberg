/**
 * @format
 * @flow
 */

// Gutenberg imports
import { registerCoreBlocks } from '@wordpress/block-library';
import {
	parse,
	registerBlockType,
	serialize,
	setUnregisteredTypeHandlerName,
} from '@wordpress/blocks';

import md5 from 'md5';
import { createStore, applyMiddleware, Store } from 'redux';
import { reducer } from './reducers';

import * as UnsupportedBlock from '../block-types/unsupported-block/';

import gutenbergBridgeMiddleware from './gutenbergBridgeMiddleware';

import type { BlockType, StateType } from './types';

registerCoreBlocks();
registerBlockType( UnsupportedBlock.name, UnsupportedBlock.settings );
setUnregisteredTypeHandlerName( UnsupportedBlock.name );

export function html2State( html: string ) {
	const blocksFromHtml = parse( html );
	const reserialized = blocks2html( blocksFromHtml );
	const hash = md5( reserialized );
	const state: StateType = {
		// TODO: get blocks list block state should be externalized (shared with Gutenberg at some point?).
		// If not it should be created from a string parsing (commented HTML to json).
		blocks: blocksFromHtml.map( ( block ) => ( { ...block, focused: false } ) ),
		initialHtmlHash: hash,
		refresh: false,
		fullparse: false,
	};
	return state;
}

export function blocks2html( blocks: Array<BlockType> ) {
	return blocks.map( serialize ).join( '\n\n' );
}

export function store2html( store: Store ) {
	return blocks2html( store.getState().blocks );
}

// const devToolsEnhancer =
// 	// ( 'development' === process.env.NODE_ENV && require( 'remote-redux-devtools' ).default ) ||
// 	() => {};

export function setupStore( state: StateType = html2State( '' ) ) {
	const store = createStore( reducer, state, applyMiddleware( gutenbergBridgeMiddleware ) );
	return store;
}
