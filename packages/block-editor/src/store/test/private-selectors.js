/**
 * Internal dependencies
 */
import {
	isBlockInterfaceHidden,
	getLastInsertedBlocksClientIds,
	isContentLockingBlock,
	getContentLockingBlock,
	isContentBlock,
	getContentClientIdsTree,
	getTemporarilyUnlockedBlock,
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

			expect( getLastInsertedBlocksClientIds( state ) ).toBeUndefined();
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

	describe( 'content locking selectors', () => {
		const __experimentalHasContentRoleAttribute = jest.fn( () => false );
		isContentBlock.registry = {
			select: jest.fn( () => ( {
				__experimentalHasContentRoleAttribute,
			} ) ),
		};

		const baseState = {
			settings: {},
			blocks: {
				byClientId: new Map(
					Object.entries( {
						'6926a815-c923-4daa-bc3f-7da2133b388d': {
							clientId: '6926a815-c923-4daa-bc3f-7da2133b388d',
							name: 'core/group',
						},
						'9f88f941-9984-419f-8ae7-e427c5b57513': {
							clientId: '9f88f941-9984-419f-8ae7-e427c5b57513',
							name: 'core/post-content',
						},
						'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1': {
							clientId: 'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1',
							name: 'core/paragraph',
						},
					} )
				),
				attributes: new Map(
					Object.entries( {
						'6926a815-c923-4daa-bc3f-7da2133b388d': {},
						'9f88f941-9984-419f-8ae7-e427c5b57513': {},
						'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1': {},
					} )
				),
				order: new Map(
					Object.entries( {
						'': [ '6926a815-c923-4daa-bc3f-7da2133b388d' ],
						'6926a815-c923-4daa-bc3f-7da2133b388d': [
							'9f88f941-9984-419f-8ae7-e427c5b57513',
						],
						'9f88f941-9984-419f-8ae7-e427c5b57513': [
							'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1',
						],
						'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1': [],
					} )
				),
				parents: new Map(
					Object.entries( {
						'6926a815-c923-4daa-bc3f-7da2133b388d': '',
						'9f88f941-9984-419f-8ae7-e427c5b57513':
							'6926a815-c923-4daa-bc3f-7da2133b388d',
						'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1':
							'9f88f941-9984-419f-8ae7-e427c5b57513',
					} )
				),
			},
			blockListSettings: {
				'6926a815-c923-4daa-bc3f-7da2133b388d': {},
				'9f88f941-9984-419f-8ae7-e427c5b57513': {},
				'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1': {},
			},
		};

		describe( 'isContentLockingBlock', () => {
			it( 'should return true if the block is the content locking block', () => {
				const state = {
					...baseState,
					blockListSettings: {
						'6926a815-c923-4daa-bc3f-7da2133b388d': {
							templateLock: 'contentOnly',
						},
						'9f88f941-9984-419f-8ae7-e427c5b57513': {
							templateLock: 'contentOnly',
						},
						'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1': {
							templateLock: 'contentOnly',
						},
					},
				};
				expect(
					isContentLockingBlock(
						state,
						'6926a815-c923-4daa-bc3f-7da2133b388d'
					)
				).toBe( true );
			} );

			it( 'should return false if the block is not the content locking block', () => {
				const state = {
					...baseState,
					blockListSettings: {
						'6926a815-c923-4daa-bc3f-7da2133b388d': {
							templateLock: 'contentOnly',
						},
						'9f88f941-9984-419f-8ae7-e427c5b57513': {
							templateLock: 'contentOnly',
						},
						'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1': {
							templateLock: 'contentOnly',
						},
					},
				};
				expect(
					isContentLockingBlock(
						state,
						'a0d1cb17-2c08-4e7a-91be-007ba7ddc3a1'
					)
				).toBe( false );
			} );
		} );

		describe( 'getContentLockingBlock', () => {
			it( 'should return undefined if there is no content locking block', () => {
				const state = {
					...baseState,
				};
				expect(
					getContentLockingBlock(
						state,
						'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1'
					)
				).toBeUndefined();
			} );

			it( 'should return the topmost content locking block', () => {
				const state = {
					...baseState,
					blockListSettings: {
						'6926a815-c923-4daa-bc3f-7da2133b388d': {
							templateLock: 'contentOnly',
						},
						'9f88f941-9984-419f-8ae7-e427c5b57513': {
							templateLock: 'contentOnly',
						},
						'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1': {
							templateLock: 'contentOnly',
						},
					},
				};
				expect(
					getContentLockingBlock(
						state,
						'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1'
					)
				).toBe( '6926a815-c923-4daa-bc3f-7da2133b388d' );
			} );

			it( 'should return the given block if it is the sole content locking block', () => {
				const state = {
					...baseState,
					blockListSettings: {
						'6926a815-c923-4daa-bc3f-7da2133b388d': {},
						'9f88f941-9984-419f-8ae7-e427c5b57513': {},
						'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1': {
							templateLock: 'contentOnly',
						},
					},
				};
				expect(
					getContentLockingBlock(
						state,
						'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1'
					)
				).toBe( 'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1' );
			} );

			it( 'should return undefined if editor is content locked', () => {
				const state = {
					...baseState,
					settings: {
						templateLock: 'contentOnly',
					},
					blockListSettings: {
						'6926a815-c923-4daa-bc3f-7da2133b388d': {
							templateLock: 'contentOnly',
						},
						'9f88f941-9984-419f-8ae7-e427c5b57513': {
							templateLock: 'contentOnly',
						},
						'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1': {
							templateLock: 'contentOnly',
						},
					},
				};
				expect(
					getContentLockingBlock(
						state,
						'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1'
					)
				).toBeUndefined();
			} );
		} );

		describe( 'isContentBlock', () => {
			it( 'should return false by default', () => {
				const state = {
					...baseState,
				};
				expect(
					isContentBlock(
						state,
						'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1'
					)
				).toBe( false );
			} );

			it( 'should return true if the block type is in settings.contentBlockTypes', () => {
				const state = {
					...baseState,
					settings: {
						contentBlockTypes: [ 'core/paragraph' ],
					},
				};
				expect(
					isContentBlock(
						state,
						'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1'
					)
				).toBe( true );
			} );

			it( 'should return true if the block has a content attribute', () => {
				__experimentalHasContentRoleAttribute.mockReturnValue( true );
				const state = {
					...baseState,
				};
				expect(
					isContentBlock(
						state,
						'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1'
					)
				).toBe( true );
				__experimentalHasContentRoleAttribute.mockReturnValue( false );
			} );
		} );

		describe( 'getContentClientIdsTree', () => {
			it( 'should return an empty array if there are no content blocks', () => {
				const state = {
					...baseState,
				};
				expect( getContentClientIdsTree( state ) ).toEqual( [] );
				getContentClientIdsTree.clear();
			} );

			it( 'should return all content blocks', () => {
				const state = {
					...baseState,
					settings: {
						contentBlockTypes: [ 'core/paragraph' ],
					},
				};
				expect( getContentClientIdsTree( state ) ).toEqual( [
					{
						clientId: 'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1',
						innerBlocks: [],
					},
				] );
				getContentClientIdsTree.clear();
			} );

			it( 'should return all children of content blocks', () => {
				const state = {
					...baseState,
					settings: {
						contentBlockTypes: [ 'core/post-content' ],
					},
				};
				expect( getContentClientIdsTree( state ) ).toEqual( [
					{
						clientId: '9f88f941-9984-419f-8ae7-e427c5b57513',
						innerBlocks: [
							{
								clientId:
									'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1',
								innerBlocks: [],
							},
						],
					},
				] );
				getContentClientIdsTree.clear();
			} );

			it( 'should return content blocks nested within a given root', () => {
				const state = {
					...baseState,
					settings: {
						contentBlockTypes: [
							'core/post-content',
							'core/paragraph',
						],
					},
				};
				expect(
					getContentClientIdsTree(
						state,
						'9f88f941-9984-419f-8ae7-e427c5b57513'
					)
				).toEqual( [
					{
						clientId: 'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1',
						innerBlocks: [],
					},
				] );
				getContentClientIdsTree.clear();
			} );
		} );

		describe( 'getTemporarilyUnlockedBlock', () => {
			it( 'should return undefined if there are no temporarily unlocked blocks', () => {
				const state = {};
				expect( getTemporarilyUnlockedBlock( state ) ).toBeUndefined();
			} );

			it( 'should return the clientId of the temporarily unlocked block', () => {
				const state = {
					temporarilyUnlockedBlock:
						'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1',
				};
				expect( getTemporarilyUnlockedBlock( state ) ).toBe(
					'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1'
				);
			} );
		} );
	} );
} );
