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
		registerBlockType( 'core/buttons', {
			apiVersion: 3,
			save: () => null,
			category: 'design',
			title: 'Buttons',
		} );
		registerBlockType( 'core/button', {
			apiVersion: 3,
			save: () => null,
			category: 'design',
			title: 'Button',
			parent: [ 'core/buttons' ],
			attributes: {
				text: {
					type: 'string',
				},
			},
		} );
	} );

	afterAll( () => {
		unregisterBlockType( 'core/block' );
		unregisterBlockType( 'core/button' );
		unregisterBlockType( 'core/buttons' );
	} );

	it( 'falls back to a reusable block when an unsynced user pattern has no parsed blocks', () => {
		expect(
			getPatternBlocksForInsertion(
				{
					type: INSERTER_PATTERN_TYPES.user,
					syncStatus: 'unsynced',
					id: 42,
				},
				[]
			)
		).toEqual( [
			expect.objectContaining( {
				name: 'core/block',
				attributes: { ref: 42 },
			} ),
		] );
	} );

	it( 'falls back to a reusable block when a synced user pattern has parsed blocks', () => {
		const result = getPatternBlocksForInsertion(
			{
				type: INSERTER_PATTERN_TYPES.user,
				syncStatus: undefined,
				id: 42,
			},
			[
				{
					name: 'core/button',
					attributes: { text: 'Pattern content' },
					innerBlocks: [],
				},
			]
		);

		expect( result ).toHaveLength( 1 );
		expect( result[ 0 ].name ).toBe( 'core/block' );
		expect( result[ 0 ].attributes ).toEqual( { ref: 42 } );
	} );

	it( 'keeps child-only root blocks for an unsynced user pattern', () => {
		const result = getPatternBlocksForInsertion(
			{
				type: INSERTER_PATTERN_TYPES.user,
				syncStatus: 'unsynced',
				id: 42,
			},
			[
				{
					name: 'core/button',
					attributes: { text: 'Pattern content' },
					innerBlocks: [],
				},
			],
			undefined
		);

		expect( result ).toHaveLength( 1 );
		expect( result[ 0 ].name ).toBe( 'core/button' );
		expect( result[ 0 ].attributes ).toEqual( {
			text: 'Pattern content',
		} );
	} );
} );
