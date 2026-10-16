import { beforeAll, describe, expect, it } from 'vitest';
import type { Block } from '@wordpress/blocks';
import reducer from '../reducer';
import type { State } from '../types';

// The reducer only reads these fields of the blocks.
type BlockFixture = Pick< Block, 'clientId' | 'attributes' | 'innerBlocks' >;

describe( 'performance', () => {
	const state = reducer(
		undefined,
		// @ts-expect-error Deliberately unknown action type.
		{ type: '@@init' }
	);
	const blocks: BlockFixture[] = [];
	for ( let i = 0; i < 100000; i++ ) {
		blocks.push( {
			clientId: `block-${ i }`,
			attributes: { content: `paragraph ${ i }` },
			innerBlocks: [],
		} );
	}

	let preparedState: State;
	beforeAll( () => {
		preparedState = reducer( state, {
			type: 'RESET_BLOCKS',
			blocks: blocks as Block[],
		} );
	}, 60_000 );

	it( 'should reset blocks', () => {
		const updatedState = reducer( state, {
			type: 'RESET_BLOCKS',
			blocks: blocks as Block[],
		} );
		expect( updatedState ).toBeDefined();
	}, 60_000 );

	it( 'should update blocks', () => {
		const updatedState = reducer( preparedState, {
			type: 'UPDATE_BLOCK_ATTRIBUTES',
			clientIds: [ 'block-10' ],
			attributes: {
				content: 'updated paragraph 10',
			},
		} );

		expect( updatedState ).toBeDefined();
	} );

	it( 'should replace blocks (Enter in paragraphs)', () => {
		const updatedState = reducer( preparedState, {
			type: 'REPLACE_BLOCKS',
			clientIds: [ 'block-10' ],
			blocks: [
				{
					clientId: `block-10`,
					attributes: { content: `paragraph 10` },
					innerBlocks: [],
				},
				{
					clientId: `block-10-2`,
					attributes: { content: '' },
					innerBlocks: [],
				},
			] as BlockFixture[] as Block[],
			indexToSelect: 10,
			initialPosition: 0,
		} );

		expect( updatedState ).toBeDefined();
	} );

	it( 'should move blocks', () => {
		const updatedState = reducer( preparedState, {
			type: 'MOVE_BLOCKS_DOWN',
			clientIds: [ 'block-10' ],
			rootClientId: '',
		} );

		expect( updatedState ).toBeDefined();
	} );
} );
