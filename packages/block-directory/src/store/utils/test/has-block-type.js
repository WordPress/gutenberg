/**
 * Internal dependencies
 */
import {
	blockList,
	blockTypeInstalled,
	blockTypeUnused,
} from '../../test/fixtures';
import hasBlockType from '../has-block-type';

describe( 'hasBlockType', () => {
	it( 'should find the block', () => {
		const found = hasBlockType( blockTypeInstalled, blockList );
		expect( found ).toBe( true );
	} );

	it( 'should not find the unused block', () => {
		const found = hasBlockType( blockTypeUnused, blockList );
		expect( found ).toBe( false );
	} );

	it( 'should find the block in innerBlocks', () => {
		const innerBlockList = [
			...blockList,
			{
				clientId: 4,
				name: 'core/cover',
				attributes: {},
				innerBlocks: [
					{
						clientId: 5,
						name: blockTypeUnused.name,
						attributes: {},
						innerBlocks: [],
					},
				],
			},
		];
		const found = hasBlockType( blockTypeUnused, innerBlockList );
		expect( found ).toBe( true );
	} );
} );
