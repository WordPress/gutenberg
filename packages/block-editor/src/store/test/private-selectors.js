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
	isEditLockedBlock,
	isMoveLockedBlock,
	isRemoveLockedBlock,
	isLockedBlock,
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
			derivedBlockEditingModes: new Map( [] ),
		};

		const hasContentRoleAttribute = jest.fn( () => false );
		const get = jest.fn( () => 'edit' );
		getBlockEditingMode.registry = {
			select: jest.fn( () => ( {
				hasContentRoleAttribute,
				get,
			} ) ),
		};

		it( 'should return false when top level block is not disabled', () => {
			const state = {
				...baseState,
				blockEditingModes: new Map( [] ),
				derivedBlockEditingModes: new Map( [] ),
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
				derivedBlockEditingModes: new Map( [
					[ 'b26fc763-417d-4f01-b81c-2ec61e14a972', 'disabled' ],
					[ '9b9c5c3f-2e46-4f02-9e14-9fe9515b958f', 'disabled' ],
					[ 'b3247f75-fd94-4fef-97f9-5bfd162cc416', 'disabled' ],
					[ 'e178812d-ce5e-48c7-a945-8ae4ffcbbb7c', 'disabled' ],
				] ),
			};
			expect(
				isBlockSubtreeDisabled(
					state,
					'ef45d5fd-5234-4fd5-ac4f-c3736c7f9337'
				)
			).toBe( true );
		} );

		it( 'should return true when top level block is disabled via inheritance and there are no editing modes within it', () => {
			const state = {
				...baseState,
				blockEditingModes: new Map( [ [ '', 'disabled' ] ] ),
				derivedBlockEditingModes: new Map( [
					[ '6cf70164-9097-4460-bcbf-200560546988', 'disabled' ],
					[ 'ef45d5fd-5234-4fd5-ac4f-c3736c7f9337', 'disabled' ],
					[ 'b26fc763-417d-4f01-b81c-2ec61e14a972', 'disabled' ],
					[ '9b9c5c3f-2e46-4f02-9e14-9fe9515b958f', 'disabled' ],
					[ 'b3247f75-fd94-4fef-97f9-5bfd162cc416', 'disabled' ],
					[ 'e178812d-ce5e-48c7-a945-8ae4ffcbbb7c', 'disabled' ],
				] ),
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
				derivedBlockEditingModes: new Map( [
					[ 'b26fc763-417d-4f01-b81c-2ec61e14a972', 'disabled' ],
					[ '9b9c5c3f-2e46-4f02-9e14-9fe9515b958f', 'disabled' ],
					[ 'e178812d-ce5e-48c7-a945-8ae4ffcbbb7c', 'disabled' ],
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
				derivedBlockEditingModes: new Map( [
					[ 'b26fc763-417d-4f01-b81c-2ec61e14a972', 'disabled' ],
					[ '9b9c5c3f-2e46-4f02-9e14-9fe9515b958f', 'disabled' ],
					[ 'e178812d-ce5e-48c7-a945-8ae4ffcbbb7c', 'disabled' ],
				] ),
			};
			expect(
				isBlockSubtreeDisabled(
					state,
					'ef45d5fd-5234-4fd5-ac4f-c3736c7f9337'
				)
			).toBe( false );
		} );

		it( 'should return false when top level block is disabled via inheritance and there are non-disabled editing modes within it', () => {
			const state = {
				...baseState,
				blockEditingModes: new Map( [
					[ '', 'disabled' ],
					[ 'b3247f75-fd94-4fef-97f9-5bfd162cc416', 'default' ],
				] ),
				derivedBlockEditingModes: new Map( [
					[ '6cf70164-9097-4460-bcbf-200560546988', 'disabled' ],
					[ 'ef45d5fd-5234-4fd5-ac4f-c3736c7f9337', 'disabled' ],
					[ 'b26fc763-417d-4f01-b81c-2ec61e14a972', 'disabled' ],
					[ '9b9c5c3f-2e46-4f02-9e14-9fe9515b958f', 'disabled' ],
					[ 'e178812d-ce5e-48c7-a945-8ae4ffcbbb7c', 'disabled' ],
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
		getEnabledClientIdsTree.registry = {
			select: jest.fn( () => ( {} ) ),
		};

		it( 'should return tree containing only clientId and innerBlocks', () => {
			const state = {
				...baseState,
				blockEditingModes: new Map( [] ),
				derivedBlockEditingModes: new Map( [] ),
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
				derivedBlockEditingModes: new Map( [] ),
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
				derivedBlockEditingModes: new Map( [
					[ '6cf70164-9097-4460-bcbf-200560546988', 'disabled' ],
					[ 'ef45d5fd-5234-4fd5-ac4f-c3736c7f9337', 'disabled' ],
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
					order: new Map( [
						[ '6cf70164-9097-4460-bcbf-200560546988', [] ],
						[ '', [ '6cf70164-9097-4460-bcbf-200560546988' ] ],
					] ),
				},
				blockEditingModes: new Map(),
				derivedBlockEditingModes: new Map(),
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
							'ef45d5fd-5234-4fd5-ac4f-c3736c7f9337',
						],
						[
							'4c2b7140-fffd-44b4-b2a7-820c670a6514',
							'e178812d-ce5e-48c7-a945-8ae4ffcbbb7c',
						],
					] ),

					order: new Map( [
						[ '', [ 'ef45d5fd-5234-4fd5-ac4f-c3736c7f9337' ] ],
						[
							'ef45d5fd-5234-4fd5-ac4f-c3736c7f9337',
							[
								'9b9c5c3f-2e46-4f02-9e14-9fe9515b958f',
								'e178812d-ce5e-48c7-a945-8ae4ffcbbb7c',
							],
						],
						[
							'e178812d-ce5e-48c7-a945-8ae4ffcbbb7c',
							[ '4c2b7140-fffd-44b4-b2a7-820c670a6514' ],
						],
					] ),
				},
				blockEditingModes: new Map( [
					[ '', 'disabled' ],
					[ 'e178812d-ce5e-48c7-a945-8ae4ffcbbb7c', 'default' ],
				] ),
				derivedBlockEditingModes: new Map( [
					[ 'ef45d5fd-5234-4fd5-ac4f-c3736c7f9337', 'disabled' ],
					[ '9b9c5c3f-2e46-4f02-9e14-9fe9515b958f', 'disabled' ],
				] ),
				blockListSettings: {},
			};
			expect(
				getEnabledBlockParents(
					state,
					'4c2b7140-fffd-44b4-b2a7-820c670a6514'
				)
			).toEqual( [ 'e178812d-ce5e-48c7-a945-8ae4ffcbbb7c' ] );
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
					order: new Map( [
						[ '', [ 'ef45d5fd-5234-4fd5-ac4f-c3736c7f9337' ] ],
						[
							'ef45d5fd-5234-4fd5-ac4f-c3736c7f9337',
							[ '9b9c5c3f-2e46-4f02-9e14-9fe9515b958f' ],
						],
						[
							'9b9c5c3f-2e46-4f02-9e14-9fe9515b958f',
							[ 'e178812d-ce5e-48c7-a945-8ae4ffcbbb7c' ],
						],
						[
							'e178812d-ce5e-48c7-a945-8ae4ffcbbb7c',
							[ '4c2b7140-fffd-44b4-b2a7-820c670a6514' ],
						],
					] ),
				},
				blockEditingModes: new Map( [
					[ '', 'disabled' ],
					[ '9b9c5c3f-2e46-4f02-9e14-9fe9515b958f', 'default' ],
				] ),
				derivedBlockEditingModes: new Map( [
					[ 'ef45d5fd-5234-4fd5-ac4f-c3736c7f9337', 'disabled' ],
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

	describe( 'isEditLockedBlock', () => {
		it( 'returns false when block has no lock attribute', () => {
			const state = {
				blocks: {
					byClientId: new Map( [
						[ 'block-1', { clientId: 'block-1' } ],
					] ),
					attributes: new Map( [ [ 'block-1', {} ] ] ),
				},
			};
			expect( isEditLockedBlock( state, 'block-1' ) ).toBe( false );
		} );

		it( 'returns false when block has lock attribute but edit is false', () => {
			const state = {
				blocks: {
					byClientId: new Map( [
						[ 'block-1', { clientId: 'block-1' } ],
					] ),
					attributes: new Map( [
						[ 'block-1', { lock: { edit: false, move: true } } ],
					] ),
				},
			};
			expect( isEditLockedBlock( state, 'block-1' ) ).toBe( false );
		} );

		it( 'returns true when block has lock attribute with edit set to true', () => {
			const state = {
				blocks: {
					byClientId: new Map( [
						[ 'block-1', { clientId: 'block-1' } ],
					] ),
					attributes: new Map( [
						[ 'block-1', { lock: { edit: true } } ],
					] ),
				},
			};
			expect( isEditLockedBlock( state, 'block-1' ) ).toBe( true );
		} );

		it( 'returns false when block has no attributes', () => {
			const state = {
				blocks: {
					byClientId: new Map(),
					attributes: new Map(),
				},
			};
			expect( isEditLockedBlock( state, 'block-1' ) ).toBe( false );
		} );
	} );

	describe( 'isMoveLockedBlock', () => {
		const createState = ( templateLock, blockLock ) => ( {
			blocks: {
				byClientId: new Map( [
					[ 'block-1', { clientId: 'block-1' } ],
					[ 'parent-block', { clientId: 'parent-block' } ],
				] ),
				attributes: new Map( [
					[ 'block-1', blockLock ? { lock: blockLock } : {} ],
					[ 'parent-block', {} ],
				] ),
				parents: new Map( [
					[ 'block-1', 'parent-block' ],
					[ 'parent-block', '' ],
				] ),
			},
			settings: {},
			blockListSettings: {
				'parent-block': templateLock ? { templateLock } : {},
			},
		} );

		it( 'returns false when block has no lock and no templateLock', () => {
			const state = createState( null, null );
			expect( isMoveLockedBlock( state, 'block-1' ) ).toBe( false );
		} );

		it( 'returns true when parent has templateLock set to "all"', () => {
			const state = createState( 'all', null );
			expect( isMoveLockedBlock( state, 'block-1' ) ).toBe( true );
		} );

		it( 'returns false when parent has templateLock set to "contentOnly"', () => {
			const state = createState( 'contentOnly', null );
			expect( isMoveLockedBlock( state, 'block-1' ) ).toBe( false );
		} );

		it( 'returns true when block has lock.move set to true', () => {
			const state = createState( null, { move: true } );
			expect( isMoveLockedBlock( state, 'block-1' ) ).toBe( true );
		} );

		it( 'returns false when block has lock.move set to false', () => {
			const state = createState( null, { move: false } );
			expect( isMoveLockedBlock( state, 'block-1' ) ).toBe( false );
		} );

		it( 'prioritizes block lock over template lock', () => {
			const state = createState( 'all', { move: false } );
			expect( isMoveLockedBlock( state, 'block-1' ) ).toBe( false );
		} );
	} );

	describe( 'isRemoveLockedBlock', () => {
		const createState = ( templateLock, blockLock ) => ( {
			blocks: {
				byClientId: new Map( [
					[ 'block-1', { clientId: 'block-1' } ],
					[ 'parent-block', { clientId: 'parent-block' } ],
				] ),
				attributes: new Map( [
					[ 'block-1', blockLock ? { lock: blockLock } : {} ],
					[ 'parent-block', {} ],
				] ),
				parents: new Map( [
					[ 'block-1', 'parent-block' ],
					[ 'parent-block', '' ],
				] ),
			},
			settings: {},
			blockListSettings: {
				'parent-block': templateLock ? { templateLock } : {},
			},
		} );

		it( 'returns false when block has no lock and no templateLock', () => {
			const state = createState( null, null );
			expect( isRemoveLockedBlock( state, 'block-1' ) ).toBe( false );
		} );

		it( 'returns true when parent has templateLock set to "all"', () => {
			const state = createState( 'all', null );
			expect( isRemoveLockedBlock( state, 'block-1' ) ).toBe( true );
		} );

		it( 'returns true when parent has templateLock set to "insert"', () => {
			const state = createState( 'insert', null );
			expect( isRemoveLockedBlock( state, 'block-1' ) ).toBe( true );
		} );

		it( 'returns false when parent has templateLock set to "contentOnly"', () => {
			const state = createState( 'contentOnly', null );
			expect( isRemoveLockedBlock( state, 'block-1' ) ).toBe( false );
		} );

		it( 'returns true when block has lock.remove set to true', () => {
			const state = createState( null, { remove: true } );
			expect( isRemoveLockedBlock( state, 'block-1' ) ).toBe( true );
		} );

		it( 'returns false when block has lock.remove set to false', () => {
			const state = createState( null, { remove: false } );
			expect( isRemoveLockedBlock( state, 'block-1' ) ).toBe( false );
		} );

		it( 'prioritizes block lock over template lock', () => {
			const state = createState( 'all', { remove: false } );
			expect( isRemoveLockedBlock( state, 'block-1' ) ).toBe( false );
		} );
	} );

	describe( 'isLockedBlock', () => {
		const createState = ( templateLock, blockLock ) => ( {
			blocks: {
				byClientId: new Map( [
					[ 'block-1', { clientId: 'block-1' } ],
					[ 'parent-block', { clientId: 'parent-block' } ],
				] ),
				attributes: new Map( [
					[ 'block-1', blockLock ? { lock: blockLock } : {} ],
					[ 'parent-block', {} ],
				] ),
				parents: new Map( [
					[ 'block-1', 'parent-block' ],
					[ 'parent-block', '' ],
				] ),
			},
			settings: {},
			blockListSettings: {
				'parent-block': templateLock ? { templateLock } : {},
			},
		} );

		it( 'returns false when block is not locked in any way', () => {
			const state = createState( null, null );
			expect( isLockedBlock( state, 'block-1' ) ).toBe( false );
		} );

		it( 'returns true when block has lock.edit set to true', () => {
			const state = createState( null, { edit: true } );
			expect( isLockedBlock( state, 'block-1' ) ).toBe( true );
		} );

		it( 'returns true when block has lock.move set to true', () => {
			const state = createState( null, { move: true } );
			expect( isLockedBlock( state, 'block-1' ) ).toBe( true );
		} );

		it( 'returns true when block has lock.remove set to true', () => {
			const state = createState( null, { remove: true } );
			expect( isLockedBlock( state, 'block-1' ) ).toBe( true );
		} );

		it( 'returns true when parent has templateLock set to "all"', () => {
			const state = createState( 'all', null );
			expect( isLockedBlock( state, 'block-1' ) ).toBe( true );
		} );

		it( 'returns true when block has multiple locks', () => {
			const state = createState( null, {
				edit: true,
				move: true,
				remove: true,
			} );
			expect( isLockedBlock( state, 'block-1' ) ).toBe( true );
		} );

		it( 'returns true when only one lock type is active', () => {
			const state = createState( null, {
				edit: false,
				move: true,
				remove: false,
			} );
			expect( isLockedBlock( state, 'block-1' ) ).toBe( true );
		} );

		it( 'returns false when all lock types are explicitly false', () => {
			const state = createState( null, {
				edit: false,
				move: false,
				remove: false,
			} );
			expect( isLockedBlock( state, 'block-1' ) ).toBe( false );
		} );
	} );
} );
