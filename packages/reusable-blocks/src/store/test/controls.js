/**
 * WordPress dependencies
 */
import {
	registerBlockType,
	unregisterBlockType,
	createBlock,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import controls from '../controls';

const {
	CONVERT_BLOCK_TO_STATIC,
	CONVERT_BLOCKS_TO_REUSABLE,
	DELETE_REUSABLE_BLOCK,
} = controls;

describe( 'reusable blocks effects', () => {
	beforeAll( () => {
		registerBlockType( 'core/test-block', {
			title: 'Test block',
			category: 'text',
			save: () => null,
			attributes: {
				name: { type: 'string' },
			},
		} );

		registerBlockType( 'core/block', {
			title: 'Reusable Block',
			category: 'text',
			save: () => null,
			attributes: {
				ref: { type: 'string' },
			},
		} );
	} );

	afterAll( () => {
		unregisterBlockType( 'core/test-block' );
		unregisterBlockType( 'core/block' );
	} );

	describe( 'CONVERT_BLOCKS_TO_REUSABLE', () => {
		it( 'should convert a static block into a reusable block', async () => {
			const staticBlock = createBlock( 'core/test-block', {
				name: 'Big Bird',
			} );
			const saveEntityRecord = jest.fn( () => ( { id: 456 } ) );
			const replaceBlocks = jest.fn();
			const __experimentalSetEditingReusableBlock = jest.fn();
			const getBlocksByClientId = jest.fn( () => [ staticBlock ] );
			const registry = {
				select: jest.fn( () => ( {
					getBlocksByClientId,
				} ) ),
				dispatch: jest.fn( () => ( {
					saveEntityRecord,
					replaceBlocks,
					__experimentalSetEditingReusableBlock,
				} ) ),
			};

			await CONVERT_BLOCKS_TO_REUSABLE( registry )( {
				clientIds: [ staticBlock.clientId ],
			} );

			expect( saveEntityRecord ).toHaveBeenCalledWith(
				'postType',
				'wp_block',
				expect.objectContaining( {
					content: '<!-- wp:test-block {"name":"Big Bird"} /-->',
					status: 'publish',
					title: 'Untitled Reusable Block',
				} )
			);
			expect( replaceBlocks ).toHaveBeenCalledWith(
				[ staticBlock.clientId ],
				expect.objectContaining( {
					attributes: expect.objectContaining( { ref: 456 } ),
					isValid: true,
					name: 'core/block',
				} )
			);
			expect( __experimentalSetEditingReusableBlock ).toHaveBeenCalled();
		} );

		describe( 'CONVERT_BLOCK_TO_STATIC', () => {
			it( 'should convert a reusable block into a static block', async () => {
				const associatedBlock = createBlock( 'core/block', {
					ref: 123,
				} );
				const reusableBlock = {
					id: 123,
					title: 'My cool block',
					content:
						'<!-- wp:test-block {"name":"Big Bird"} --><!-- wp:test-block {"name":"Oscar the Grouch"} /--><!-- wp:test-block {"name":"Cookie Monster"} /--><!-- /wp:test-block -->',
				};
				const replaceBlocks = jest.fn();
				const getBlock = jest.fn( () => associatedBlock );
				const getEditedEntityRecord = jest.fn( () => reusableBlock );
				const registry = {
					select: jest.fn( () => ( {
						getBlock,
						getEditedEntityRecord,
					} ) ),
					dispatch: jest.fn( () => ( {
						replaceBlocks,
					} ) ),
				};

				CONVERT_BLOCK_TO_STATIC( registry )( {
					clientId: associatedBlock.clientId,
				} );

				expect( replaceBlocks ).toHaveBeenCalledWith(
					associatedBlock.clientId,
					[
						expect.objectContaining( {
							name: 'core/test-block',
							attributes: { name: 'Big Bird' },
							innerBlocks: [
								expect.objectContaining( {
									attributes: { name: 'Oscar the Grouch' },
								} ),
								expect.objectContaining( {
									attributes: { name: 'Cookie Monster' },
								} ),
							],
						} ),
					]
				);
			} );
		} );

		describe( 'DELETE_REUSABLE_BLOCK', () => {
			it( 'should delete a reusable block and remove all its instances from the store', async () => {
				const associatedBlock = createBlock( 'core/block', {
					ref: 123,
				} );
				const reusableBlock = {
					id: 123,
				};
				const availableBlocks = [
					createBlock( 'core/block' ),
					createBlock( 'core/block', {
						ref: 123,
					} ),
					createBlock( 'core/block', {
						ref: 456,
					} ),
					createBlock( 'core/block', {
						ref: 123,
					} ),
					createBlock( 'core/test-block', {
						ref: 123,
					} ),
				];
				const removeBlocks = jest.fn();
				const deleteEntityRecord = jest.fn();
				const getBlock = jest.fn( () => associatedBlock );
				const getBlocks = jest.fn( () => availableBlocks );
				const getEditedEntityRecord = jest.fn( () => reusableBlock );
				const registry = {
					select: jest.fn( () => ( {
						getBlock,
						getBlocks,
						getEditedEntityRecord,
					} ) ),
					dispatch: jest.fn( () => ( {
						removeBlocks,
						deleteEntityRecord,
					} ) ),
				};

				DELETE_REUSABLE_BLOCK( registry )( {
					id: reusableBlock.id,
				} );

				expect( deleteEntityRecord ).toHaveBeenCalledWith(
					'postType',
					'wp_block',
					123
				);
				expect( removeBlocks ).toHaveBeenCalledWith( [
					availableBlocks[ 1 ].clientId,
					availableBlocks[ 3 ].clientId,
				] );
			} );
		} );
	} );
} );
