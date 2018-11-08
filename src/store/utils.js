/**
 * @format
 * @flow
 */

// Gutenberg imports
import { parse, serialize } from '@wordpress/blocks';

import md5 from 'md5';
import { Store } from 'redux';

import type { BlockType, StateType } from './';

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
