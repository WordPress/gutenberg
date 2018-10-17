/**
 * @format
 * @flow
 */

// Gutenberg imports
import { registerCoreBlocks } from '@wordpress/block-library';
import {
	parse,
	registerBlockType,
	setUnknownTypeHandlerName,
} from '@wordpress/blocks';

import { createStore } from 'redux';
import { reducer } from './reducers';

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

const initialHtml = `
<!-- wp:image -->
<figure class="wp-block-image"><img alt=""/></figure>
<!-- /wp:image -->

<!-- wp:image -->
<figure class="wp-block-image"><img src="https://cldup.com/cXyG__fTLN.jpg" alt=""/></figure>
<!-- /wp:image -->

<!-- wp:title -->
Hello World
<!-- /wp:title -->

<!-- wp:paragraph -->
<p><b>Hello</b> World!</p>
<!-- /wp:paragraph -->
`;

const initialBlocks = parse( initialHtml );

export const initialState: StateType = {
	// TODO: get blocks list block state should be externalized (shared with Gutenberg at some point?).
	// If not it should be created from a string parsing (commented HTML to json).
	blocks: initialBlocks.map( ( block ) => ( { ...block, focused: false } ) ),
	refresh: false,
};

const devToolsEnhancer =
	// ( 'development' === process.env.NODE_ENV && require( 'remote-redux-devtools' ).default ) ||
	() => {};

export function setupStore( state: StateType = initialState ) {
	const store = createStore( reducer, state, devToolsEnhancer() );
	return store;
}
