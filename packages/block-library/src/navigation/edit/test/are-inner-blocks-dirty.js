/**
 * Internal dependencies
 */
import { areInnerBlocksDirty } from '../are-inner-blocks-dirty';

describe( 'areInnerBlocksDirty', () => {
	it( 'should be false if the inner blocks are the same', () => {
		expect(
			areInnerBlocksDirty(
				[
					{
						name: 'core/group',
						innerBlocks: [
							{ name: 'core/paragraph', innerBlocks: [] },
						],
					},
				],
				[
					{
						name: 'core/group',
						innerBlocks: [
							{ name: 'core/paragraph', innerBlocks: [] },
						],
					},
				]
			)
		).toBe( false );
	} );

	it( 'should be true if the inner blocks are dirty', () => {
		expect(
			areInnerBlocksDirty(
				[
					{
						name: 'core/group',
						innerBlocks: [
							{ name: 'core/paragraph', innerBlocks: [] },
						],
					},
				],
				[
					{
						name: 'core/group',
						innerBlocks: [
							{ name: 'core/paragraph', innerBlocks: [] },
							{ name: 'core/paragraph', innerBlocks: [] },
						],
					},
				]
			)
		).toBe( true );
	} );
} );
