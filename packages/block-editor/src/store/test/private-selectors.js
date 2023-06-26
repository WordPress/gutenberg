/**
 * WordPress dependencies
 */
import { select } from '@wordpress/data';

/**
 * Internal dependencies
 */
import {
	isBlockInterfaceHidden,
	getLastInsertedBlocksClientIds,
	getBlockEditingMode,
	isBlockSubtreeDisabled,
	getListViewClientIdsTree,
	getEnabledBlockParents,
} from '../private-selectors';

jest.mock( '@wordpress/data/src/select', () => ( {
	select: jest.fn(),
} ) );

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

	describe( 'block editing mode selectors', () => {
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

		describe( 'getBlockEditingMode', () => {
			const __experimentalHasContentRoleAttribute = jest.fn(
				() => false
			);
			select.mockReturnValue( {
				__experimentalHasContentRoleAttribute,
			} );

			it( 'should return default by default', () => {
				expect(
					getBlockEditingMode(
						baseState,
						'b3247f75-fd94-4fef-97f9-5bfd162cc416'
					)
				).toBe( 'default' );
			} );

			it( 'should return disabled if explicitly set', () => {
				const state = {
					...baseState,
					blockEditingModes: new Map( [
						[ 'b3247f75-fd94-4fef-97f9-5bfd162cc416', 'disabled' ],
					] ),
				};
				expect(
					getBlockEditingMode(
						state,
						'b3247f75-fd94-4fef-97f9-5bfd162cc416'
					)
				).toBe( 'disabled' );
			} );

			it( 'should return contentOnly if explicitly set', () => {
				const state = {
					...baseState,
					blockEditingModes: new Map( [
						[
							'b3247f75-fd94-4fef-97f9-5bfd162cc416',
							'contentOnly',
						],
					] ),
				};
				expect(
					getBlockEditingMode(
						state,
						'b3247f75-fd94-4fef-97f9-5bfd162cc416'
					)
				).toBe( 'contentOnly' );
			} );

			it( 'should return disabled if explicitly set on a parent', () => {
				const state = {
					...baseState,
					blockEditingModes: new Map( [
						[ 'ef45d5fd-5234-4fd5-ac4f-c3736c7f9337', 'disabled' ],
					] ),
				};
				expect(
					getBlockEditingMode(
						state,
						'b3247f75-fd94-4fef-97f9-5bfd162cc416'
					)
				).toBe( 'disabled' );
			} );

			it( 'should return default if parent is set to contentOnly', () => {
				const state = {
					...baseState,
					blockEditingModes: new Map( [
						[
							'ef45d5fd-5234-4fd5-ac4f-c3736c7f9337',
							'contentOnly',
						],
					] ),
				};
				expect(
					getBlockEditingMode(
						state,
						'b3247f75-fd94-4fef-97f9-5bfd162cc416'
					)
				).toBe( 'default' );
			} );

			it( 'should return disabled if overridden by a parent', () => {
				const state = {
					...baseState,
					blockEditingModes: new Map( [
						[ '', 'disabled' ],
						[ 'ef45d5fd-5234-4fd5-ac4f-c3736c7f9337', 'default' ],
						[ '9b9c5c3f-2e46-4f02-9e14-9fe9515b958f', 'disabled' ],
					] ),
				};
				expect(
					getBlockEditingMode(
						state,
						'b3247f75-fd94-4fef-97f9-5bfd162cc416'
					)
				).toBe( 'disabled' );
			} );

			it( 'should return disabled if explicitly set on root', () => {
				const state = {
					...baseState,
					blockEditingModes: new Map( [ [ '', 'disabled' ] ] ),
				};
				expect(
					getBlockEditingMode(
						state,
						'b3247f75-fd94-4fef-97f9-5bfd162cc416'
					)
				).toBe( 'disabled' );
			} );

			it( 'should return default if root is contentOnly', () => {
				const state = {
					...baseState,
					blockEditingModes: new Map( [ [ '', 'contentOnly' ] ] ),
				};
				expect(
					getBlockEditingMode(
						state,
						'b3247f75-fd94-4fef-97f9-5bfd162cc416'
					)
				).toBe( 'default' );
			} );

			it( 'should return disabled if parent is locked and the block has no content role', () => {
				const state = {
					...baseState,
					blockListSettings: {
						...baseState.blockListSettings,
						'9b9c5c3f-2e46-4f02-9e14-9fe9515b958f': {
							templateLock: 'contentOnly',
						},
					},
				};
				__experimentalHasContentRoleAttribute.mockReturnValueOnce(
					false
				);
				expect(
					getBlockEditingMode(
						state,
						'b3247f75-fd94-4fef-97f9-5bfd162cc416'
					)
				).toBe( 'disabled' );
			} );

			it( 'should return contentOnly if parent is locked and the block has a content role', () => {
				const state = {
					...baseState,
					blockListSettings: {
						...baseState.blockListSettings,
						'9b9c5c3f-2e46-4f02-9e14-9fe9515b958f': {
							templateLock: 'contentOnly',
						},
					},
				};
				__experimentalHasContentRoleAttribute.mockReturnValueOnce(
					true
				);
				expect(
					getBlockEditingMode(
						state,
						'b3247f75-fd94-4fef-97f9-5bfd162cc416'
					)
				).toBe( 'contentOnly' );
			} );
		} );

		describe( 'isBlockSubtreeDisabled', () => {
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
	} );

	describe( 'getListViewClientIdsTree', () => {
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
			expect( getListViewClientIdsTree( state ) ).toEqual( [
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
				getListViewClientIdsTree(
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
			expect( getListViewClientIdsTree( state ) ).toEqual( [
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
} );
