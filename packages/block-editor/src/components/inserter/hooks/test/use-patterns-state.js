/**
 * WordPress dependencies
 */
import { registerBlockType, unregisterBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
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
		registerBlockType( 'core/paragraph', {
			apiVersion: 3,
			save: () => null,
			category: 'text',
			title: 'Paragraph',
			attributes: {
				content: {
					type: 'string',
				},
				metadata: {
					type: 'object',
				},
			},
		} );
	} );

	afterAll( () => {
		unregisterBlockType( 'core/block' );
		unregisterBlockType( 'core/paragraph' );
	} );

	it( 'falls back to a reusable block when an unsynced user pattern has no parsed blocks', () => {
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

	it( 'falls back to a reusable block when a synced user pattern has parsed blocks', () => {
		const result = getPatternBlocksForInsertion(
			{
				type: INSERTER_PATTERN_TYPES.user,
				syncStatus: undefined,
				id: 42,
			},
			[
				{
					name: 'core/paragraph',
					attributes: { content: 'Pattern content' },
					innerBlocks: [],
				},
			]
		);

		expect( result ).toHaveLength( 1 );
		expect( result[ 0 ].name ).toBe( 'core/block' );
		expect( result[ 0 ].attributes ).toEqual( { ref: 42 } );
	} );

	it( 'keeps cloned blocks for an unsynced user pattern', () => {
		const parsedBlocks = [
			{
				name: 'core/paragraph',
				attributes: { content: 'Pattern content' },
				innerBlocks: [],
			},
		];

		const result = getPatternBlocksForInsertion(
			{
				type: INSERTER_PATTERN_TYPES.user,
				syncStatus: 'unsynced',
				id: 42,
			},
			parsedBlocks
		);

		expect( result ).toHaveLength( 1 );
		expect( result[ 0 ] ).not.toBe( parsedBlocks[ 0 ] );
		expect( result[ 0 ].name ).toBe( 'core/paragraph' );
		expect( result[ 0 ].attributes ).toEqual( {
			content: 'Pattern content',
		} );
	} );

	it( 'keeps only the selected pattern category on cloned blocks', () => {
		const result = getPatternBlocksForInsertion(
			{
				type: INSERTER_PATTERN_TYPES.theme,
				name: 'theme/pattern',
			},
			[
				{
					name: 'core/paragraph',
					attributes: {
						content: 'Pattern content',
						metadata: {
							categories: [ 'featured', 'about' ],
						},
					},
					innerBlocks: [],
				},
			],
			'featured'
		);

		expect( result[ 0 ].attributes.metadata.categories ).toEqual( [
			'featured',
		] );
	} );
} );
