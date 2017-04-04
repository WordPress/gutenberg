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
	html,
	blocks,
	mode,
	createReduxStore
} from '../state';

describe( 'state', () => {
	describe( 'html()', () => {
		it( 'should return null by default', () => {
			const state = html( undefined, {} );

			expect( state ).to.be.null();
		} );

		it( 'should return set html', () => {
			const markup = '<!-- wp:core/test-block -->Bananas<!-- /wp:core/test-block -->';
			const state = html( null, {
				type: 'SET_HTML',
				html: markup
			} );

			expect( state ).to.be.equal( markup );
		} );
	} );

	describe( 'blocks()', () => {
		before( () => {
			wp.blocks.registerBlock( 'core/test-block', {} );
		} );

		after( () => {
			wp.blocks.unregisterBlock( 'core/test-block' );
		} );

		it( 'should return empty byUid, order by default', () => {
			const state = blocks( undefined, {} );

			expect( state ).to.eql( {
				byUid: {},
				order: []
			} );
		} );

		it( 'should key set html blocks', () => {
			const original = deepFreeze( {
				byUid: {},
				order: []
			} );
			const state = blocks( original, {
				type: 'SET_HTML',
				html: '<!-- wp:core/test-block -->Bananas<!-- /wp:core/test-block -->'
			} );

			expect( Object.keys( state.byUid ) ).to.have.lengthOf( 1 );
			expect( values( state.byUid )[ 0 ].blockType ).to.equal( 'core/test-block' );
			expect( state.order ).to.have.lengthOf( 1 );
			expect( state.order[ 0 ] ).to.be.a( 'string' );
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
				order: [ 'kumquat' ]
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
			expect( state.order[ 0 ] ).to.equal( 'kumquat' );
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
				'html',
				'blocks',
				'mode'
			] );
		} );
	} );
} );
