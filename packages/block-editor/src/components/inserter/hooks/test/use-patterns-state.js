import { registerBlockType, unregisterBlockType } from '@wordpress/blocks';
import { getPatternBlocksForInsertion } from '../use-patterns-state';
import { INSERTER_PATTERN_TYPES } from '../../block-patterns-tab/utils';

describe( 'getPatternBlocksForInsertion', () => {
	beforeAll( () => {
		registerBlockType( 'core/block', {
			apiVersion: 3,
			save: () => null,
			category: 'reusable',
			title: 'Pattern',
			attributes: {
				ref: {
					type: 'number',
				},
			},
		} );
	} );

	afterAll( () => {
		unregisterBlockType( 'core/block' );
	} );

	it( 'falls back to a reusable block when an unsynced user pattern has no blocks', () => {
		const result = getPatternBlocksForInsertion(
			{
				type: INSERTER_PATTERN_TYPES.user,
				syncStatus: 'unsynced',
				id: 42,
			},
			[]
		);

		expect( result ).toHaveLength( 1 );
		expect( result[ 0 ].name ).toBe( 'core/block' );
		expect( result[ 0 ].attributes ).toEqual( { ref: 42 } );
	} );

	it( 'keeps parsed blocks for an unsynced user pattern', () => {
		const parsedBlocks = [
			{
				name: 'core/paragraph',
				attributes: { content: 'Pattern content' },
				innerBlocks: [],
			},
		];

		expect(
			getPatternBlocksForInsertion(
				{
					type: INSERTER_PATTERN_TYPES.user,
					syncStatus: 'unsynced',
					id: 42,
				},
				parsedBlocks
			)
		).toBe( parsedBlocks );
	} );
} );
