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
				selected: {},
				hovered: {}
			} );
		} );

		it( 'should key by replaced blocks uid', () => {
			const original = deepFreeze( {
				byUid: {},
				order: [],
				selected: {},
				hovered: {}
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
				selected: {},
				hovered: {}
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
				selected: {},
				hovered: {}
			} );
			const state = blocks( original, {
				type: 'TOGGLE_BLOCK_HOVERED',
				uid: 'kumquat',
				hovered: true
			} );

			expect( state.hovered.kumquat ).to.be.true();
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
				selected: {},
				hovered: {
					kumquat: true
				}
			} );
			const state = blocks( original, {
				type: 'TOGGLE_BLOCK_SELECTED',
				uid: 'kumquat',
				selected: true
			} );

			expect( state.hovered.kumquat ).to.be.false();
			expect( state.selected.kumquat ).to.be.true();
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
