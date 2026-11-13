import { describe, expect, it } from 'vitest';
import type { Block } from '@wordpress/blocks';
import reducer from '../reducer';
import { getBlockOperationsSince } from '../block-operations';
import type { State } from '../types';

const block = ( clientId: string, innerBlocks: Block[] = [] ): Block => ( {
	clientId,
	name: 'core/paragraph',
	attributes: { content: clientId },
	innerBlocks,
	isValid: true,
} );
const revision = ( state: State ) =>
	state.blockOperationChanges?.at( -1 )?.revision ?? 0;
const initial = () =>
	reducer( undefined, {
		type: 'RESET_BLOCKS',
		blocks: [ block( 'a' ), block( 'b' ), block( 'c' ) ],
	} );

describe( 'block operations', () => {
	it( 'reports inserted blocks in an order whose anchors already exist', () => {
		const state = initial();
		const next = reducer( state, {
			type: 'INSERT_BLOCKS',
			blocks: [ block( 'x' ), block( 'y' ) ],
			index: 1,
		} );
		expect(
			getBlockOperationsSince(
				next.blockOperationChanges,
				revision( state ),
				''
			)
		).toEqual( [
			{ type: 'insert', block: block( 'y' ), parent: null, before: 'b' },
			{ type: 'insert', block: block( 'x' ), parent: null, before: 'y' },
		] );
	} );

	it( 'reports removal of a subtree once', () => {
		const state = reducer( undefined, {
			type: 'RESET_BLOCKS',
			blocks: [ block( 'a', [ block( 'child' ) ] ), block( 'b' ) ],
		} );
		const next = reducer( state, {
			type: 'REMOVE_BLOCKS',
			clientIds: [ 'a', 'child' ],
		} );
		expect(
			getBlockOperationsSince(
				next.blockOperationChanges,
				revision( state ),
				''
			)
		).toEqual( [ { type: 'remove', clientId: 'a' } ] );
	} );

	it( 'reports a move by block identity and destination anchor', () => {
		const state = initial();
		const next = reducer( state, {
			type: 'MOVE_BLOCKS_TO_POSITION',
			clientIds: [ 'a' ],
			fromRootClientId: '',
			toRootClientId: '',
			index: 2,
		} );
		expect(
			getBlockOperationsSince(
				next.blockOperationChanges,
				revision( state ),
				''
			)
		).toEqual( [
			{ type: 'move', clientId: 'a', parent: null, before: null },
		] );
	} );

	it( 'preserves the order of operations across a batched insert and move', () => {
		const state = initial();
		let next = reducer( state, {
			type: 'INSERT_BLOCKS',
			blocks: [ block( 'x' ) ],
			index: 0,
		} );
		next = reducer( next, {
			type: 'MOVE_BLOCKS_DOWN',
			clientIds: [ 'x' ],
		} );
		expect(
			getBlockOperationsSince(
				next.blockOperationChanges,
				revision( state ),
				''
			)
		).toEqual( [
			{ type: 'insert', block: block( 'x' ), parent: null, before: 'a' },
			{ type: 'move', clientId: 'x', parent: null, before: 'b' },
		] );
	} );

	it( 'keeps structural edits and rich-text values in the same ordered batch', () => {
		const state = initial();
		let next = reducer( state, {
			type: 'INSERT_BLOCKS',
			blocks: [ block( 'x' ) ],
		} );
		next = reducer( next, {
			type: 'UPDATE_BLOCK_ATTRIBUTES',
			clientIds: [ 'a' ],
			attributes: { content: '<strong>Changed</strong>' },
		} );
		expect(
			getBlockOperationsSince(
				next.blockOperationChanges,
				revision( state ),
				''
			)
		).toEqual( [
			{ type: 'insert', block: block( 'x' ), parent: null, before: null },
			{
				type: 'set-attribute',
				clientId: 'a',
				attribute: 'content',
				previousValue: 'a',
				value: '<strong>Changed</strong>',
			},
		] );
	} );

	it( 'preserves the editor baseline for each text change in a batch', () => {
		const state = initial();
		let next = reducer( state, {
			type: 'UPDATE_BLOCK_ATTRIBUTES',
			clientIds: [ 'a' ],
			attributes: { content: 'ab' },
		} );
		next = reducer( next, {
			type: 'UPDATE_BLOCK_ATTRIBUTES',
			clientIds: [ 'a' ],
			attributes: { content: 'abc' },
		} );
		expect(
			getBlockOperationsSince(
				next.blockOperationChanges,
				revision( state ),
				''
			)
		).toEqual( [
			{
				type: 'set-attribute',
				clientId: 'a',
				attribute: 'content',
				previousValue: 'a',
				value: 'ab',
			},
			{
				type: 'set-attribute',
				clientId: 'a',
				attribute: 'content',
				previousValue: 'ab',
				value: 'abc',
			},
		] );
	} );

	it( 'represents a leaf block split as one attribute update and insertion batch', () => {
		const state = initial();
		const head = { ...block( 'a' ), attributes: { content: '' } };
		const tail = { ...block( 'tail' ), attributes: { content: 'a' } };
		const next = reducer( state, {
			type: 'REPLACE_BLOCKS',
			clientIds: [ 'a' ],
			blocks: [ head, tail ],
		} );
		expect(
			getBlockOperationsSince(
				next.blockOperationChanges,
				revision( state ),
				''
			)
		).toEqual( [
			{
				type: 'set-attribute',
				clientId: 'a',
				attribute: 'content',
				previousValue: 'a',
				value: '',
			},
			{ type: 'insert', block: tail, parent: null, before: 'b' },
		] );
	} );

	it( 'uses the accepted value for each block in a multi-block attribute edit', () => {
		const state = initial();
		const next = reducer( state, {
			type: 'UPDATE_BLOCK_ATTRIBUTES',
			clientIds: [ 'a', 'b' ],
			attributes: { a: { content: 'A' }, b: { content: 'B' } },
			options: { uniqueByBlock: true },
		} );
		expect(
			getBlockOperationsSince(
				next.blockOperationChanges,
				revision( state ),
				''
			)
		).toEqual( [
			{
				type: 'set-attribute',
				clientId: 'a',
				attribute: 'content',
				previousValue: 'a',
				value: 'A',
			},
			{
				type: 'set-attribute',
				clientId: 'b',
				attribute: 'content',
				previousValue: 'b',
				value: 'B',
			},
		] );
	} );

	it( 'requires state diffing when an operation batch exceeds the retained history', () => {
		const state = initial();
		let next = state;
		for ( let i = 0; i < 65; i++ ) {
			next = reducer( next, {
				type: 'INSERT_BLOCKS',
				blocks: [ block( `x${ i }` ) ],
			} );
		}
		expect(
			getBlockOperationsSince(
				next.blockOperationChanges,
				revision( state ),
				''
			)
		).toBeUndefined();
	} );

	it( 'requires state diffing for a move between controlled entities', () => {
		let state = reducer( undefined, {
			type: 'RESET_BLOCKS',
			blocks: [ block( 'a' ), block( 'controller' ) ],
		} );
		state = reducer( state, {
			type: 'SET_HAS_CONTROLLED_INNER_BLOCKS',
			clientId: 'controller',
			hasControlledInnerBlocks: true,
		} );
		const next = reducer( state, {
			type: 'MOVE_BLOCKS_TO_POSITION',
			clientIds: [ 'a' ],
			fromRootClientId: '',
			toRootClientId: 'controller',
			index: 0,
		} );
		expect(
			getBlockOperationsSince(
				next.blockOperationChanges,
				revision( state ),
				''
			)
		).toBeUndefined();
		expect(
			getBlockOperationsSince(
				next.blockOperationChanges,
				revision( state ),
				'controller'
			)
		).toBeUndefined();
	} );

	it( 'requires state diffing for replacement edits', () => {
		const state = initial();
		const next = reducer( state, {
			type: 'REPLACE_BLOCKS',
			clientIds: [ 'a' ],
			blocks: [ block( 'x' ) ],
		} );
		expect(
			getBlockOperationsSince(
				next.blockOperationChanges,
				revision( state ),
				''
			)
		).toBeUndefined();
	} );
} );
