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

			const updatedBlock = switchToBlockType( block, 'core/updated-text-block' );

			expect( updatedBlock ).to.eql( [ {
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

			const updatedBlock = switchToBlockType( block, 'core/updated-text-block' );

			expect( updatedBlock ).to.eql( [ {
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

			const updatedBlock = switchToBlockType( block, 'core/updated-text-block' );

			expect( updatedBlock ).to.be.null();
		} );

		it( 'should reject transformations that return null', () => {
			registerBlock( 'core/updated-text-block', {
				transforms: {
					from: [ {
						blocks: [ 'core/text-block' ],
						transform: ( { value } ) => {
							return null;
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

			const updatedBlock = switchToBlockType( block, 'core/updated-text-block' );

			expect( updatedBlock ).to.be.null();
		} );


		it( 'should reject transformations that return an empty array', () => {
			registerBlock( 'core/updated-text-block', {
				transforms: {
					from: [ {
						blocks: [ 'core/text-block' ],
						transform: ( { value } ) => {
							return [];
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

			const updatedBlock = switchToBlockType( block, 'core/updated-text-block' );

			expect( updatedBlock ).to.be.null();
		} );

		it( 'should reject single transformations that do not include block types', () => {
			registerBlock( 'core/updated-text-block', {
				transforms: {
					from: [ {
						blocks: [ 'core/text-block' ],
						transform: ( { value } ) => {
							return {
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

			const updatedBlock = switchToBlockType( block, 'core/updated-text-block' );

			expect( updatedBlock ).to.be.null();
		} );

		it( 'should reject array transformations that do not include block types', () => {
			registerBlock( 'core/updated-text-block', {
				transforms: {
					from: [ {
						blocks: [ 'core/text-block' ],
						transform: ( { value } ) => {
							return [
								{
									blockType: 'core/updated-text-block',
									attributes: {
										value: 'chicken ' + value
									}
								}, {
									attributes: {
										value: 'smoked ' + value
									}
								}
							];
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

			const updatedBlock = switchToBlockType( block, 'core/updated-text-block' );

			expect( updatedBlock ).to.be.null();
		} );

		it( 'should reject single transformations with unexpected block types', () => {
			registerBlock( 'core/updated-text-block', {} );
			registerBlock( 'core/text-block', {
				transforms: {
					to: [ {
						blocks: [ 'core/updated-text-block' ],
						transform: ( { value } ) => {
							return {
								blockType: 'core/text-block',
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

			const updatedBlock = switchToBlockType( block, 'core/updated-text-block' );

			expect( updatedBlock ).to.eql( null );
		} );

		it( 'should reject array transformations with unexpected block types', () => {
			registerBlock( 'core/updated-text-block', {} );
			registerBlock( 'core/text-block', {
				transforms: {
					to: [ {
						blocks: [ 'core/updated-text-block' ],
						transform: ( { value } ) => {
							return [
								{
									blockType: 'core/text-block',
									attributes: {
										value: 'chicken ' + value
									}
								}, {
									blockType: 'core/text-block',
									attributes: {
										value: 'smoked ' + value
									}
								}
							];
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

			const updatedBlock = switchToBlockType( block, 'core/updated-text-block' );

			expect( updatedBlock ).to.eql( null );
		} );

		it( 'should accept valid array transformations', () => {
			registerBlock( 'core/updated-text-block', {} );
			registerBlock( 'core/text-block', {
				transforms: {
					to: [ {
						blocks: [ 'core/updated-text-block' ],
						transform: ( { value } ) => {
							return [
								{
									blockType: 'core/text-block',
									attributes: {
										value: 'chicken ' + value
									}
								}, {
									blockType: 'core/updated-text-block',
									attributes: {
										value: 'smoked ' + value
									}
								}
							];
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

			const updatedBlock = switchToBlockType( block, 'core/updated-text-block' );

			// Make sure the block UIDs are set as expected: the first
			// transformed block whose type matches the "destination" type gets
			// to keep the existing block's UID.
			expect( updatedBlock ).to.have.lengthOf( 2 );
			expect( updatedBlock[ 0 ].uid ).to.exist().and.not.eql( 1 );
			expect( updatedBlock[ 1 ].uid ).to.eql( 1 );
			updatedBlock[ 0 ].uid = 2;

			expect( updatedBlock ).to.eql( [ {
				uid: 2,
				blockType: 'core/text-block',
				attributes: {
					value: 'chicken ribs'
				}
			}, {
				uid: 1,
				blockType: 'core/updated-text-block',
				attributes: {
					value: 'smoked ribs'
				}
			} ] );
		} );
	} );
} );
