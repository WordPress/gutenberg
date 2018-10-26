/**
 * @format
 * @flow
 */

// Gutenberg imports
import { registerCoreBlocks } from '@wordpress/block-library';
import { parse, registerBlockType, setUnknownTypeHandlerName, serialize } from '@wordpress/blocks';

import { createStore } from 'redux';
import { reducer } from './reducers';

import GutenbergBridge, { registerBridgeListener } from 'react-native-gutenberg-bridge';

import * as UnsupportedBlock from '../block-types/unsupported-block/';

export type BlockType = {
	clientId: string,
	name: string,
	isValid: boolean,
	attributes: Object,
	innerBlocks: Array<BlockType>,
	focused: boolean,
};

export type StateType = {
	blocks: Array<BlockType>,
	refresh: boolean,
};

registerCoreBlocks();
registerBlockType( UnsupportedBlock.name, UnsupportedBlock.settings );
setUnknownTypeHandlerName( UnsupportedBlock.name );

export function html2State( html: string ) {
	const blocksFromHtml = parse( html );
	const state: StateType = {
		// TODO: get blocks list block state should be externalized (shared with Gutenberg at some point?).
		// If not it should be created from a string parsing (commented HTML to json).
		blocks: blocksFromHtml.map( ( block ) => ( { ...block, focused: false } ) ),
		refresh: false,
	};
	return state;
}

const devToolsEnhancer =
	// ( 'development' === process.env.NODE_ENV && require( 'remote-redux-devtools' ).default ) ||
	() => {};

function serializeBlocksToHtml( blocks: Array<Object> ): string {
	return blocks.map( serialize ).join( '' );
}

export function setupStore( state: StateType = html2State( '' ) ) {
	const store = createStore( reducer, state, devToolsEnhancer() );
	registerBridgeListener( 'requestGetHtml', ( data ) => {
		const html = serializeBlocksToHtml( store.getState().blocks );
		console.log( 'editor html: ' + html );
		GutenbergBridge.provideToNative_Html( html );
	} );
	return store;
}
