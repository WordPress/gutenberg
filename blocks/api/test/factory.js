/**
 * External dependencies
 */
import { expect } from 'chai';

/**
 * Internal dependencies
 */
import { createBlock, switchToBlockType } from '../factory';
import { getBlocks, unregisterBlock, setUnknownTypeHandler, registerBlock } from '../registration';

describe( 'block factory', () => {
	afterEach( () => {
		setUnknownTypeHandler( undefined );
		getBlocks().forEach( ( block ) => {
			unregisterBlock( block.slug );
		} );
	} );

	describe( 'createBlock()', () => {
		it( 'should create a block given its blockType and attributes', () => {
			const block = createBlock( 'core/test-block', {
				align: 'left'
			} );

			expect( block.blockType ).to.eql( 'core/test-block' );
			expect( block.attributes ).to.eql( {
				align: 'left'
			} );
			expect( block.uid ).to.be.a( 'string' );
		} );
	} );

	describe( 'switchToBlockType()', () => {
		it( 'should switch the blockType of a block using the "transform form"', () => {
			registerBlock( 'core/updated-text-block', {
				transforms: {
					from: [ {
						blocks: [ 'core/text-block' ],
						transform: ( { value } ) => {
							return {
								blockType: 'core/updated-text-block',
								attributes: {
									value: 'chicken ' + value
								}
							};
						}
					} ]
				}
			} );
			registerBlock( 'core/text-block', {} );

			const block = {
				uid: 1,
				blockType: 'core/text-block',
				attributes: {
					value: 'ribs'
				}
			};

			const updateBlock = switchToBlockType( block, 'core/updated-text-block' );

			expect( updateBlock ).to.eql( [ {
				uid: 1,
				blockType: 'core/updated-text-block',
				attributes: {
					value: 'chicken ribs'
				}
			} ] );
		} );

		it( 'should switch the blockType of a block using the "transform to"', () => {
			registerBlock( 'core/updated-text-block', {} );
			registerBlock( 'core/text-block', {
				transforms: {
					to: [ {
						blocks: [ 'core/updated-text-block' ],
						transform: ( { value } ) => {
							return {
								blockType: 'core/updated-text-block',
								attributes: {
									value: 'chicken ' + value
								}
							};
						}
					} ]
				}
			} );

			const block = {
				uid: 1,
				blockType: 'core/text-block',
				attributes: {
					value: 'ribs'
				}
			};

			const updateBlock = switchToBlockType( block, 'core/updated-text-block' );

			expect( updateBlock ).to.eql( [ {
				uid: 1,
				blockType: 'core/updated-text-block',
				attributes: {
					value: 'chicken ribs'
				}
			} ] );
		} );

		it( 'should return null if no transformation is found', () => {
			registerBlock( 'core/updated-text-block', {} );
			registerBlock( 'core/text-block', {} );

			const block = {
				uid: 1,
				blockType: 'core/text-block',
				attributes: {
					value: 'ribs'
				}
			};

			const updateBlock = switchToBlockType( block, 'core/updated-text-block' );

			expect( updateBlock ).to.be.null();
		} );
	} );
} );
