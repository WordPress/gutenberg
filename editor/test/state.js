/**
 * External dependencies
 */
import { expect } from 'chai';
import deepFreeze from 'deep-freeze';
import { values } from 'lodash';

/**
 * Internal dependencies
 */
import {
	blocks,
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

		it( 'should return empty byUid, order, selected, hovered by default', () => {
			const state = blocks( undefined, {} );

			expect( state ).to.eql( {
				byUid: {},
				order: [],
				selected: null,
				hovered: null
			} );
		} );

		it( 'should key by replaced blocks uid', () => {
			const original = deepFreeze( {
				byUid: {},
				order: [],
				selected: null,
				hovered: null
			} );
			const state = blocks( original, {
				type: 'REPLACE_BLOCKS',
				blockNodes: [ { uid: 'bananas' } ]
			} );

			expect( Object.keys( state.byUid ) ).to.have.lengthOf( 1 );
			expect( values( state.byUid )[ 0 ].uid ).to.equal( 'bananas' );
			expect( state.order ).to.eql( [ 'bananas' ] );
		} );

		it( 'should return with block updates', () => {
			const original = deepFreeze( {
				byUid: {
					kumquat: {
						uid: 'kumquat',
						blockType: 'core/test-block',
						attributes: {}
					}
				},
				order: [ 'kumquat' ],
				selected: null,
				hovered: null
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

		it( 'should return with block uid as hovered', () => {
			const original = deepFreeze( {
				byUid: {
					kumquat: {
						uid: 'kumquat',
						blockType: 'core/test-block',
						attributes: {}
					}
				},
				order: [ 'kumquat' ],
				selected: null,
				hovered: null
			} );
			const state = blocks( original, {
				type: 'TOGGLE_BLOCK_HOVERED',
				uid: 'kumquat',
				hovered: true
			} );

			expect( state.hovered ).to.equal( 'kumquat' );
		} );

		it( 'should return with block uid as selected, clearing hover', () => {
			const original = deepFreeze( {
				byUid: {
					kumquat: {
						uid: 'kumquat',
						blockType: 'core/test-block',
						attributes: {}
					}
				},
				order: [ 'kumquat' ],
				selected: null,
				hovered: 'kumquat'
			} );
			const state = blocks( original, {
				type: 'TOGGLE_BLOCK_SELECTED',
				uid: 'kumquat',
				selected: true
			} );

			expect( state.hovered ).to.be.null();
			expect( state.selected ).to.equal( 'kumquat' );
		} );

		it( 'should insert and select block', () => {
			const original = deepFreeze( {
				byUid: {
					kumquat: {
						uid: 'chicken',
						blockType: 'core/test-block',
						attributes: {}
					}
				},
				order: [ 'chicken' ],
				selected: null,
				hovered: null
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
			expect( state.hovered ).to.be.null();
			expect( state.selected ).to.equal( 'ribs' );
		} );

		it( 'should move the block up', () => {
			const original = deepFreeze( {
				byUid: {
					chicken: {
						uid: 'chicken',
						blockType: 'core/test-block',
						attributes: {}
					},
					ribs: {
						uid: 'ribs',
						blockType: 'core/test-block',
						attributes: {}
					}
				},
				order: [ 'chicken', 'ribs' ],
				selected: {},
				hovered: {}
			} );
			const state = blocks( original, {
				type: 'MOVE_BLOCK_UP',
				uid: 'ribs'
			} );

			expect( state.order ).to.eql( [ 'ribs', 'chicken' ] );
		} );

		it( 'should not move the first block up', () => {
			const original = deepFreeze( {
				byUid: {
					chicken: {
						uid: 'chicken',
						blockType: 'core/test-block',
						attributes: {}
					},
					ribs: {
						uid: 'ribs',
						blockType: 'core/test-block',
						attributes: {}
					}
				},
				order: [ 'chicken', 'ribs' ],
				selected: {},
				hovered: {}
			} );
			const state = blocks( original, {
				type: 'MOVE_BLOCK_UP',
				uid: 'chicken'
			} );

			expect( state.order ).to.equal( original.order );
		} );

		it( 'should move the block down', () => {
			const original = deepFreeze( {
				byUid: {
					chicken: {
						uid: 'chicken',
						blockType: 'core/test-block',
						attributes: {}
					},
					ribs: {
						uid: 'ribs',
						blockType: 'core/test-block',
						attributes: {}
					}
				},
				order: [ 'chicken', 'ribs' ],
				selected: {},
				hovered: {}
			} );
			const state = blocks( original, {
				type: 'MOVE_BLOCK_DOWN',
				uid: 'chicken'
			} );

			expect( state.order ).to.eql( [ 'ribs', 'chicken' ] );
		} );

		it( 'should not move the last block down', () => {
			const original = deepFreeze( {
				byUid: {
					chicken: {
						uid: 'chicken',
						blockType: 'core/test-block',
						attributes: {}
					},
					ribs: {
						uid: 'ribs',
						blockType: 'core/test-block',
						attributes: {}
					}
				},
				order: [ 'chicken', 'ribs' ],
				selected: {},
				hovered: {}
			} );
			const state = blocks( original, {
				type: 'MOVE_BLOCK_DOWN',
				uid: 'ribs'
			} );

			expect( state.order ).to.equal( original.order );
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
				'mode'
			] );
		} );
	} );
} );
