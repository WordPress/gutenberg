/**
 * External dependencies
 */
import { expect } from 'chai';
import { values } from 'lodash';

/**
 * Internal dependencies
 */
import {
	blocks,
	hoveredBlock,
	selectedBlock,
	mode,
	createReduxStore
} from '../state';

describe( 'state', () => {
	describe( 'blocks()', () => {
		before( () => {
			wp.blocks.registerBlock( 'core/test-block', {} );
		} );

		after( () => {
			wp.blocks.unregisterBlock( 'core/test-block' );
		} );

		it( 'should return empty byUid, order, history by default', () => {
			const state = blocks( undefined, {} );

			expect( state.byUid ).to.eql( {} );
			expect( state.order ).to.eql( [] );
			expect( state ).to.have.keys( 'history' );
		} );

		it( 'should key by replaced blocks uid', () => {
			const original = blocks( undefined, {} );
			const state = blocks( original, {
				type: 'REPLACE_BLOCKS',
				blockNodes: [ { uid: 'bananas' } ]
			} );

			expect( Object.keys( state.byUid ) ).to.have.lengthOf( 1 );
			expect( values( state.byUid )[ 0 ].uid ).to.equal( 'bananas' );
			expect( state.order ).to.eql( [ 'bananas' ] );
		} );

		it( 'should return with block updates', () => {
			const original = blocks( undefined, {
				type: 'REPLACE_BLOCKS',
				blockNodes: [ {
					uid: 'kumquat',
					attributes: {}
				} ]
			} );
			const state = blocks( original, {
				type: 'UPDATE_BLOCK',
				uid: 'kumquat',
				updates: {
					attributes: {
						updated: true
					}
				}
			} );

			expect( state.byUid.kumquat.attributes.updated ).to.be.true();
		} );

		it( 'should insert block', () => {
			const original = blocks( undefined, {
				type: 'REPLACE_BLOCKS',
				blockNodes: [ {
					uid: 'chicken',
					blockType: 'core/test-block',
					attributes: {}
				} ]
			} );
			const state = blocks( original, {
				type: 'INSERT_BLOCK',
				block: {
					uid: 'ribs',
					blockType: 'core/freeform'
				}
			} );

			expect( Object.keys( state.byUid ) ).to.have.lengthOf( 2 );
			expect( values( state.byUid )[ 1 ].uid ).to.equal( 'ribs' );
			expect( state.order ).to.eql( [ 'chicken', 'ribs' ] );
		} );

		it( 'should move the block up', () => {
			const original = blocks( undefined, {
				type: 'REPLACE_BLOCKS',
				blockNodes: [ {
					uid: 'chicken',
					blockType: 'core/test-block',
					attributes: {}
				}, {
					uid: 'ribs',
					blockType: 'core/test-block',
					attributes: {}
				} ]
			} );
			const state = blocks( original, {
				type: 'MOVE_BLOCK_UP',
				uid: 'ribs'
			} );

			expect( state.order ).to.eql( [ 'ribs', 'chicken' ] );
		} );

		it( 'should not move the first block up', () => {
			const original = blocks( undefined, {
				type: 'REPLACE_BLOCKS',
				blockNodes: [ {
					uid: 'chicken',
					blockType: 'core/test-block',
					attributes: {}
				}, {
					uid: 'ribs',
					blockType: 'core/test-block',
					attributes: {}
				} ]
			} );
			const state = blocks( original, {
				type: 'MOVE_BLOCK_UP',
				uid: 'chicken'
			} );

			expect( state.order ).to.equal( original.order );
		} );

		it( 'should move the block down', () => {
			const original = blocks( undefined, {
				type: 'REPLACE_BLOCKS',
				blockNodes: [ {
					uid: 'chicken',
					blockType: 'core/test-block',
					attributes: {}
				}, {
					uid: 'ribs',
					blockType: 'core/test-block',
					attributes: {}
				} ]
			} );
			const state = blocks( original, {
				type: 'MOVE_BLOCK_DOWN',
				uid: 'chicken'
			} );

			expect( state.order ).to.eql( [ 'ribs', 'chicken' ] );
		} );

		it( 'should not move the last block down', () => {
			const original = blocks( undefined, {
				type: 'REPLACE_BLOCKS',
				blockNodes: [ {
					uid: 'chicken',
					blockType: 'core/test-block',
					attributes: {}
				}, {
					uid: 'ribs',
					blockType: 'core/test-block',
					attributes: {}
				} ]
			} );
			const state = blocks( original, {
				type: 'MOVE_BLOCK_DOWN',
				uid: 'ribs'
			} );

			expect( state.order ).to.equal( original.order );
		} );
	} );

	describe( 'hoveredBlock()', () => {
		it( 'should return with block uid as hovered', () => {
			const state = hoveredBlock( null, {
				type: 'TOGGLE_BLOCK_HOVERED',
				uid: 'kumquat',
				hovered: true
			} );

			expect( state ).to.equal( 'kumquat' );
		} );

		it( 'should return null when a block is selected', () => {
			const state = hoveredBlock( 'kumquat', {
				type: 'TOGGLE_BLOCK_SELECTED',
				uid: 'kumquat',
				selected: true
			} );

			expect( state ).to.be.null();
		} );
	} );

	describe( 'selectedBlock()', () => {
		it( 'should return with block uid as selected', () => {
			const state = selectedBlock( undefined, {
				type: 'TOGGLE_BLOCK_SELECTED',
				uid: 'kumquat',
				selected: true
			} );

			expect( state ).to.equal( 'kumquat' );
		} );

		it( 'should return with inserted block', () => {
			const state = selectedBlock( undefined, {
				type: 'INSERT_BLOCK',
				block: {
					uid: 'ribs',
					blockType: 'core/freeform'
				}
			} );

			expect( state ).to.equal( 'ribs' );
		} );

		it( 'should return with block moved up', () => {
			const state = selectedBlock( undefined, {
				type: 'MOVE_BLOCK_UP',
				uid: 'ribs'
			} );

			expect( state ).to.equal( 'ribs' );
		} );

		it( 'should return with block moved down', () => {
			const state = selectedBlock( undefined, {
				type: 'MOVE_BLOCK_DOWN',
				uid: 'chicken'
			} );

			expect( state ).to.equal( 'chicken' );
		} );
	} );

	describe( 'mode()', () => {
		it( 'should return "visual" by default', () => {
			const state = mode( undefined, {} );

			expect( state ).to.equal( 'visual' );
		} );

		it( 'should return switched mode', () => {
			const state = mode( null, {
				type: 'SWITCH_MODE',
				mode: 'text'
			} );

			expect( state ).to.equal( 'text' );
		} );
	} );

	describe( 'createReduxStore()', () => {
		it( 'should return a redux store', () => {
			const store = createReduxStore();

			expect( store.dispatch ).to.be.a( 'function' );
			expect( store.getState ).to.be.a( 'function' );
		} );

		it( 'should have expected reducer keys', () => {
			const store = createReduxStore();
			const state = store.getState();

			expect( Object.keys( state ) ).to.have.members( [
				'blocks',
				'selectedBlock',
				'hoveredBlock',
				'mode'
			] );
		} );
	} );
} );
