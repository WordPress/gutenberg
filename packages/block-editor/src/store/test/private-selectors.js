/**
 * Internal dependencies
 */
import {
	isBlockInterfaceHidden,
	getLastInsertedBlocksClientIds,
	getBlockEditingMode,
} from '../private-selectors';

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

	describe( 'getBlockEditingMode', () => {
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

		it( 'should return default by default', () => {
			expect(
				getBlockEditingMode(
					baseState,
					'b3247f75-fd94-4fef-97f9-5bfd162cc416'
				)
			).toBe( 'default' );
		} );

		[ 'disabled', 'contentOnly' ].forEach( ( mode ) => {
			it( `should return ${ mode } if explicitly set`, () => {
				const state = {
					...baseState,
					blockEditingModes: new Map( [
						[ 'b3247f75-fd94-4fef-97f9-5bfd162cc416', mode ],
					] ),
				};
				expect(
					getBlockEditingMode(
						state,
						'b3247f75-fd94-4fef-97f9-5bfd162cc416'
					)
				).toBe( mode );
			} );

			it( `should return ${ mode } if explicitly set on a parent`, () => {
				const state = {
					...baseState,
					blockEditingModes: new Map( [
						[ 'ef45d5fd-5234-4fd5-ac4f-c3736c7f9337', mode ],
					] ),
				};
				expect(
					getBlockEditingMode(
						state,
						'b3247f75-fd94-4fef-97f9-5bfd162cc416'
					)
				).toBe( mode );
			} );

			it( `should return ${ mode } if overridden by a parent`, () => {
				const state = {
					...baseState,
					blockEditingModes: new Map( [
						[ '', mode ],
						[ 'ef45d5fd-5234-4fd5-ac4f-c3736c7f9337', 'default' ],
						[ '9b9c5c3f-2e46-4f02-9e14-9fe9515b958f', mode ],
					] ),
				};
				expect(
					getBlockEditingMode(
						state,
						'b3247f75-fd94-4fef-97f9-5bfd162cc416'
					)
				).toBe( mode );
			} );

			it( `should return ${ mode } if explicitly set on root`, () => {
				const state = {
					...baseState,
					blockEditingModes: new Map( [ [ '', mode ] ] ),
				};
				expect(
					getBlockEditingMode(
						state,
						'b3247f75-fd94-4fef-97f9-5bfd162cc416'
					)
				).toBe( mode );
			} );
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
			__experimentalHasContentRoleAttribute.mockReturnValueOnce( false );
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
			__experimentalHasContentRoleAttribute.mockReturnValueOnce( true );
			expect(
				getBlockEditingMode(
					state,
					'b3247f75-fd94-4fef-97f9-5bfd162cc416'
				)
			).toBe( 'contentOnly' );
		} );
	} );
} );
