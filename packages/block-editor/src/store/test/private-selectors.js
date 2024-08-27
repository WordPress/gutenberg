/**
 * Internal dependencies
 */
import {
	isBlockInterfaceHidden,
	getLastInsertedBlocksClientIds,
	isBlockSubtreeDisabled,
	getEnabledClientIdsTree,
	getEnabledBlockParents,
	getExpandedBlock,
	isDragging,
	getBlockStyles,
} from '../private-selectors';
import { getBlockEditingMode } from '../selectors';

describe( 'private selectors', () => {
	describe( 'isBlockInterfaceHidden', () => {
		it( 'should return the true if toggled true in state', () => {
			const state = {
				isBlockInterfaceHidden: true,
			};

			expect( isBlockInterfaceHidden( state ) ).toBe( true );
		} );

		it( 'should return false if toggled false in state', () => {
			const state = {
				isBlockInterfaceHidden: false,
			};

			expect( isBlockInterfaceHidden( state ) ).toBe( false );
		} );
	} );

	describe( 'getLastInsertedBlocksClientIds', () => {
		it( 'should return undefined if no blocks have been inserted', () => {
			const state = {
				lastBlockInserted: {},
			};

			expect( getLastInsertedBlocksClientIds( state ) ).toEqual(
				undefined
			);
		} );

		it( 'should return clientIds if blocks have been inserted', () => {
			const state = {
				lastBlockInserted: {
					clientIds: [ '123456', '78910' ],
				},
			};

			expect( getLastInsertedBlocksClientIds( state ) ).toEqual( [
				'123456',
				'78910',
			] );
		} );
	} );

	describe( 'isBlockSubtreeDisabled', () => {
		const baseState = {
			settings: {},
			blocks: {
				byClientId: new Map( [
					[ '6cf70164-9097-4460-bcbf-200560546988', {} ], // Header
					[ 'ef45d5fd-5234-4fd5-ac4f-c3736c7f9337', {} ], // Group
					[ 'b26fc763-417d-4f01-b81c-2ec61e14a972', {} ], // |  Post Title
					[ '9b9c5c3f-2e46-4f02-9e14-9fe9515b958f', {} ], // |  Post Content
					[ 'b3247f75-fd94-4fef-97f9-5bfd162cc416', {} ], // | |  Paragraph
					[ 'e178812d-ce5e-48c7-a945-8ae4ffcbbb7c', {} ], // | |  Paragraph
				] ),
				order: new Map( [
					[
						'',
						[
							'6cf70164-9097-4460-bcbf-200560546988',
							'ef45d5fd-5234-4fd5-ac4f-c3736c7f9337',
						],
					],
					[ '6cf70164-9097-4460-bcbf-200560546988', [] ],
					[
						'ef45d5fd-5234-4fd5-ac4f-c3736c7f9337',
						[
							'b26fc763-417d-4f01-b81c-2ec61e14a972',
							'9b9c5c3f-2e46-4f02-9e14-9fe9515b958f',
						],
					],
					[ 'b26fc763-417d-4f01-b81c-2ec61e14a972', [] ],
					[
						'9b9c5c3f-2e46-4f02-9e14-9fe9515b958f',
						[
							'b3247f75-fd94-4fef-97f9-5bfd162cc416',
							'e178812d-ce5e-48c7-a945-8ae4ffcbbb7c',
						],
					],
					[ 'b3247f75-fd94-4fef-97f9-5bfd162cc416', [] ],
					[ 'e178812d-ce5e-48c7-a945-8ae4ffcbbb7c', [] ],
				] ),
				parents: new Map( [
					[ '6cf70164-9097-4460-bcbf-200560546988', '' ],
					[ 'ef45d5fd-5234-4fd5-ac4f-c3736c7f9337', '' ],
					[
						'b26fc763-417d-4f01-b81c-2ec61e14a972',
						'ef45d5fd-5234-4fd5-ac4f-c3736c7f9337',
					],
					[
						'9b9c5c3f-2e46-4f02-9e14-9fe9515b958f',
						'ef45d5fd-5234-4fd5-ac4f-c3736c7f9337',
					],
					[
						'b3247f75-fd94-4fef-97f9-5bfd162cc416',
						'9b9c5c3f-2e46-4f02-9e14-9fe9515b958f',
					],
					[
						'e178812d-ce5e-48c7-a945-8ae4ffcbbb7c',
						'9b9c5c3f-2e46-4f02-9e14-9fe9515b958f',
					],
				] ),
			},
			blockListSettings: {
				'ef45d5fd-5234-4fd5-ac4f-c3736c7f9337': {},
				'9b9c5c3f-2e46-4f02-9e14-9fe9515b958f': {},
			},
			blockEditingModes: new Map( [] ),
		};

		const __experimentalHasContentRoleAttribute = jest.fn( () => false );
		getBlockEditingMode.registry = {
			select: jest.fn( () => ( {
				__experimentalHasContentRoleAttribute,
			} ) ),
		};

		it( 'should return false when top level block is not disabled', () => {
			const state = {
				...baseState,
				blockEditingModes: new Map( [] ),
			};
			expect(
				isBlockSubtreeDisabled(
					state,
					'ef45d5fd-5234-4fd5-ac4f-c3736c7f9337'
				)
			).toBe( false );
		} );

		it( 'should return true when top level block is disabled and there are no editing modes within it', () => {
			const state = {
				...baseState,
				blockEditingModes: new Map( [
					[ 'ef45d5fd-5234-4fd5-ac4f-c3736c7f9337', 'disabled' ],
				] ),
			};
			expect(
				isBlockSubtreeDisabled(
					state,
					'ef45d5fd-5234-4fd5-ac4f-c3736c7f9337'
				)
			).toBe( true );
		} );

		it( 'should return true when top level block is disabled via inheritence and there are no editing modes within it', () => {
			const state = {
				...baseState,
				blockEditingModes: new Map( [ [ '', 'disabled' ] ] ),
			};
			expect(
				isBlockSubtreeDisabled(
					state,
					'ef45d5fd-5234-4fd5-ac4f-c3736c7f9337'
				)
			).toBe( true );
		} );

		it( 'should return true when top level block is disabled and there are disabled editing modes within it', () => {
			const state = {
				...baseState,
				blockEditingModes: new Map( [
					[ 'ef45d5fd-5234-4fd5-ac4f-c3736c7f9337', 'disabled' ],
					[ 'b3247f75-fd94-4fef-97f9-5bfd162cc416', 'disabled' ],
				] ),
			};
			expect(
				isBlockSubtreeDisabled(
					state,
					'ef45d5fd-5234-4fd5-ac4f-c3736c7f9337'
				)
			).toBe( true );
		} );

		it( 'should return false when top level block is disabled and there are non-disabled editing modes within it', () => {
			const state = {
				...baseState,
				blockEditingModes: new Map( [
					[ 'ef45d5fd-5234-4fd5-ac4f-c3736c7f9337', 'disabled' ],
					[ 'b3247f75-fd94-4fef-97f9-5bfd162cc416', 'default' ],
				] ),
			};
			expect(
				isBlockSubtreeDisabled(
					state,
					'ef45d5fd-5234-4fd5-ac4f-c3736c7f9337'
				)
			).toBe( false );
		} );

		it( 'should return false when top level block is disabled via inheritence and there are non-disabled editing modes within it', () => {
			const state = {
				...baseState,
				blockEditingModes: new Map( [
					[ '', 'disabled' ],
					[ 'b3247f75-fd94-4fef-97f9-5bfd162cc416', 'default' ],
				] ),
			};
			expect(
				isBlockSubtreeDisabled(
					state,
					'ef45d5fd-5234-4fd5-ac4f-c3736c7f9337'
				)
			).toBe( false );
		} );
	} );

	describe( 'getEnabledClientIdsTree', () => {
		const baseState = {
			settings: {},
			blocks: {
				byClientId: new Map( [
					[ '6cf70164-9097-4460-bcbf-200560546988', {} ], // Header
					[ 'ef45d5fd-5234-4fd5-ac4f-c3736c7f9337', {} ], // Group
					[ 'b26fc763-417d-4f01-b81c-2ec61e14a972', {} ], // |  Post Title
					[ '9b9c5c3f-2e46-4f02-9e14-9fe9515b958f', {} ], // |  Post Content
					[ 'b3247f75-fd94-4fef-97f9-5bfd162cc416', {} ], // | |  Paragraph
					[ 'e178812d-ce5e-48c7-a945-8ae4ffcbbb7c', {} ], // | |  Paragraph
				] ),
				order: new Map( [
					[
						'',
						[
							'6cf70164-9097-4460-bcbf-200560546988',
							'ef45d5fd-5234-4fd5-ac4f-c3736c7f9337',
						],
					],
					[ '6cf70164-9097-4460-bcbf-200560546988', [] ],
					[
						'ef45d5fd-5234-4fd5-ac4f-c3736c7f9337',
						[
							'b26fc763-417d-4f01-b81c-2ec61e14a972',
							'9b9c5c3f-2e46-4f02-9e14-9fe9515b958f',
						],
					],
					[ 'b26fc763-417d-4f01-b81c-2ec61e14a972', [] ],
					[
						'9b9c5c3f-2e46-4f02-9e14-9fe9515b958f',
						[
							'b3247f75-fd94-4fef-97f9-5bfd162cc416',
							'e178812d-ce5e-48c7-a945-8ae4ffcbbb7c',
						],
					],
					[ 'b3247f75-fd94-4fef-97f9-5bfd162cc416', [] ],
					[ 'e178812d-ce5e-48c7-a945-8ae4ffcbbb7c', [] ],
				] ),
				parents: new Map( [
					[ '6cf70164-9097-4460-bcbf-200560546988', '' ],
					[ 'ef45d5fd-5234-4fd5-ac4f-c3736c7f9337', '' ],
					[
						'b26fc763-417d-4f01-b81c-2ec61e14a972',
						'ef45d5fd-5234-4fd5-ac4f-c3736c7f9337',
					],
					[
						'9b9c5c3f-2e46-4f02-9e14-9fe9515b958f',
						'ef45d5fd-5234-4fd5-ac4f-c3736c7f9337',
					],
					[
						'b3247f75-fd94-4fef-97f9-5bfd162cc416',
						'9b9c5c3f-2e46-4f02-9e14-9fe9515b958f',
					],
					[
						'e178812d-ce5e-48c7-a945-8ae4ffcbbb7c',
						'9b9c5c3f-2e46-4f02-9e14-9fe9515b958f',
					],
				] ),
			},
			blockListSettings: {
				'ef45d5fd-5234-4fd5-ac4f-c3736c7f9337': {},
				'9b9c5c3f-2e46-4f02-9e14-9fe9515b958f': {},
			},
		};

		it( 'should return tree containing only clientId and innerBlocks', () => {
			const state = {
				...baseState,
				blockEditingModes: new Map( [] ),
			};
			expect( getEnabledClientIdsTree( state ) ).toEqual( [
				{
					clientId: '6cf70164-9097-4460-bcbf-200560546988',
					innerBlocks: [],
				},
				{
					clientId: 'ef45d5fd-5234-4fd5-ac4f-c3736c7f9337',
					innerBlocks: [
						{
							clientId: 'b26fc763-417d-4f01-b81c-2ec61e14a972',
							innerBlocks: [],
						},
						{
							clientId: '9b9c5c3f-2e46-4f02-9e14-9fe9515b958f',
							innerBlocks: [
								{
									clientId:
										'b3247f75-fd94-4fef-97f9-5bfd162cc416',
									innerBlocks: [],
								},
								{
									clientId:
										'e178812d-ce5e-48c7-a945-8ae4ffcbbb7c',
									innerBlocks: [],
								},
							],
						},
					],
				},
			] );
		} );

		it( 'should return a subtree when rootBlockClientId is given', () => {
			const state = {
				...baseState,
				blockEditingModes: new Map( [] ),
			};
			expect(
				getEnabledClientIdsTree(
					state,
					'ef45d5fd-5234-4fd5-ac4f-c3736c7f9337'
				)
			).toEqual( [
				{
					clientId: 'b26fc763-417d-4f01-b81c-2ec61e14a972',
					innerBlocks: [],
				},
				{
					clientId: '9b9c5c3f-2e46-4f02-9e14-9fe9515b958f',
					innerBlocks: [
						{
							clientId: 'b3247f75-fd94-4fef-97f9-5bfd162cc416',
							innerBlocks: [],
						},
						{
							clientId: 'e178812d-ce5e-48c7-a945-8ae4ffcbbb7c',
							innerBlocks: [],
						},
					],
				},
			] );
		} );

		it( 'should filter out disabled blocks', () => {
			const state = {
				...baseState,
				blockEditingModes: new Map( [
					[ '', 'disabled' ],
					[ 'b26fc763-417d-4f01-b81c-2ec61e14a972', 'contentOnly' ],
					[ '9b9c5c3f-2e46-4f02-9e14-9fe9515b958f', 'contentOnly' ],
				] ),
			};
			expect( getEnabledClientIdsTree( state ) ).toEqual( [
				{
					clientId: 'b26fc763-417d-4f01-b81c-2ec61e14a972',
					innerBlocks: [],
				},
				{
					clientId: '9b9c5c3f-2e46-4f02-9e14-9fe9515b958f',
					innerBlocks: [
						{
							clientId: 'b3247f75-fd94-4fef-97f9-5bfd162cc416',
							innerBlocks: [],
						},
						{
							clientId: 'e178812d-ce5e-48c7-a945-8ae4ffcbbb7c',
							innerBlocks: [],
						},
					],
				},
			] );
		} );
	} );

	describe( 'getEnabledBlockParents', () => {
		it( 'should return an empty array if block is at the root', () => {
			const state = {
				settings: {},
				blocks: {
					parents: new Map( [
						[ '6cf70164-9097-4460-bcbf-200560546988', '' ],
					] ),
				},
				blockEditingModes: new Map(),
			};
			expect(
				getEnabledBlockParents(
					state,
					'6cf70164-9097-4460-bcbf-200560546988'
				)
			).toEqual( [] );
		} );

		it( 'should return non-disabled parents', () => {
			const state = {
				settings: {},
				blocks: {
					parents: new Map( [
						[ 'ef45d5fd-5234-4fd5-ac4f-c3736c7f9337', '' ],
						[
							'9b9c5c3f-2e46-4f02-9e14-9fe9515b958f',
							'ef45d5fd-5234-4fd5-ac4f-c3736c7f9337',
						],
						[
							'e178812d-ce5e-48c7-a945-8ae4ffcbbb7c',
							'9b9c5c3f-2e46-4f02-9e14-9fe9515b958f',
						],
						[
							'4c2b7140-fffd-44b4-b2a7-820c670a6514',
							'e178812d-ce5e-48c7-a945-8ae4ffcbbb7c',
						],
					] ),
				},
				blockEditingModes: new Map( [
					[ '', 'disabled' ],
					[ '9b9c5c3f-2e46-4f02-9e14-9fe9515b958f', 'default' ],
				] ),
				blockListSettings: {},
			};
			expect(
				getEnabledBlockParents(
					state,
					'4c2b7140-fffd-44b4-b2a7-820c670a6514'
				)
			).toEqual( [
				'9b9c5c3f-2e46-4f02-9e14-9fe9515b958f',
				'e178812d-ce5e-48c7-a945-8ae4ffcbbb7c',
			] );
		} );

		it( 'should order from bottom to top if ascending is true', () => {
			const state = {
				settings: {},
				blocks: {
					parents: new Map( [
						[ 'ef45d5fd-5234-4fd5-ac4f-c3736c7f9337', '' ],
						[
							'9b9c5c3f-2e46-4f02-9e14-9fe9515b958f',
							'ef45d5fd-5234-4fd5-ac4f-c3736c7f9337',
						],
						[
							'e178812d-ce5e-48c7-a945-8ae4ffcbbb7c',
							'9b9c5c3f-2e46-4f02-9e14-9fe9515b958f',
						],
						[
							'4c2b7140-fffd-44b4-b2a7-820c670a6514',
							'e178812d-ce5e-48c7-a945-8ae4ffcbbb7c',
						],
					] ),
				},
				blockEditingModes: new Map( [
					[ '', 'disabled' ],
					[ '9b9c5c3f-2e46-4f02-9e14-9fe9515b958f', 'default' ],
				] ),
				blockListSettings: {},
			};
			expect(
				getEnabledBlockParents(
					state,
					'4c2b7140-fffd-44b4-b2a7-820c670a6514',
					true
				)
			).toEqual( [
				'e178812d-ce5e-48c7-a945-8ae4ffcbbb7c',
				'9b9c5c3f-2e46-4f02-9e14-9fe9515b958f',
			] );
		} );
	} );

	describe( 'isDragging', () => {
		it( 'should return true if the dragging state is true', () => {
			const state = {
				isDragging: true,
			};

			expect( isDragging( state ) ).toBe( true );
		} );

		it( 'should return false if the dragging state is false', () => {
			const state = {
				isDragging: false,
			};

			expect( isDragging( state ) ).toBe( false );
		} );
	} );

	describe( 'getExpandedBlock', () => {
		it( 'should return the expanded block', () => {
			const state = {
				expandedBlock: '9b9c5c3f-2e46-4f02-9e14-9fe9515b958f',
			};

			expect( getExpandedBlock( state ) ).toBe(
				'9b9c5c3f-2e46-4f02-9e14-9fe9515b958f'
			);
		} );
	} );

	describe( 'getBlockStyles', () => {
		it( 'should return an empty object when no client IDs are provided', () => {
			const state = {
				blocks: {
					attributes: new Map(),
				},
			};
			const result = getBlockStyles( state, [] );
			expect( result ).toEqual( {} );
		} );

		it( 'should return styles for a single block', () => {
			const state = {
				blocks: {
					attributes: new Map( [
						[ 'block-1', { style: { color: 'red' } } ],
					] ),
				},
			};
			const result = getBlockStyles( state, [ 'block-1' ] );
			expect( result ).toEqual( {
				'block-1': { color: 'red' },
			} );
		} );

		it( 'should return styles for multiple blocks', () => {
			const state = {
				blocks: {
					attributes: new Map( [
						[ 'block-1', { style: { color: 'red' } } ],
						[ 'block-2', { style: { fontSize: '16px' } } ],
						[ 'block-3', { style: { margin: '10px' } } ],
					] ),
				},
			};
			const result = getBlockStyles( state, [
				'block-1',
				'block-2',
				'block-3',
			] );
			expect( result ).toEqual( {
				'block-1': { color: 'red' },
				'block-2': { fontSize: '16px' },
				'block-3': { margin: '10px' },
			} );
		} );

		it( 'should return undefined for blocks without styles', () => {
			const state = {
				blocks: {
					attributes: new Map( [
						[ 'block-1', { style: { color: 'red' } } ],
						[ 'block-2', {} ],
						[ 'block-3', { style: { margin: '10px' } } ],
					] ),
				},
			};
			const result = getBlockStyles( state, [
				'block-1',
				'block-2',
				'block-3',
			] );
			expect( result ).toEqual( {
				'block-1': { color: 'red' },
				'block-2': undefined,
				'block-3': { margin: '10px' },
			} );
		} );

		it( 'should return undefined for non-existent blocks', () => {
			const state = {
				blocks: {
					attributes: new Map( [
						[ 'block-1', { style: { color: 'red' } } ],
					] ),
				},
			};
			const result = getBlockStyles( state, [
				'block-1',
				'non-existent-block',
			] );
			expect( result ).toEqual( {
				'block-1': { color: 'red' },
				'non-existent-block': undefined,
			} );
		} );
	} );
} );
