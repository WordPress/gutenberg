/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';
import { matchesProperty, find } from 'lodash';

/**
 * Internal dependencies
 */
import reducer from '../reducer';
import { createNotice, removeNotice } from '../actions';
import { getNotices } from '../selectors';
import { DEFAULT_CONTEXT } from '../constants';

const getYieldedOfType = ( generatorAction, type ) => find(
	Array.from( generatorAction ),
	matchesProperty( [ 'type' ], type )
);

describe( 'reducer', () => {
	it( 'should default to an empty object', () => {
		const state = reducer( undefined, {} );

		expect( state ).toEqual( {} );
	} );

	it( 'should track a notice', () => {
		const action = getYieldedOfType( createNotice( 'error', 'save error' ), 'CREATE_NOTICE' );
		const state = reducer( undefined, action );

		expect( state ).toEqual( {
			[ DEFAULT_CONTEXT ]: [
				{
					id: expect.any( String ),
					content: 'save error',
					status: 'error',
					isDismissible: true,
					actions: [],
					type: 'default',
				},
			],
		} );
	} );

	it( 'should track a notice by context', () => {
		const action = getYieldedOfType( createNotice( 'error', 'save error', { context: 'foo' } ), 'CREATE_NOTICE' );
		const state = reducer( undefined, action );

		expect( state ).toEqual( {
			foo: [
				{
					id: expect.any( String ),
					content: 'save error',
					status: 'error',
					isDismissible: true,
					actions: [],
					type: 'default',
				},
			],
		} );
	} );

	it( 'should track notices, respecting order by which they were created', () => {
		let action = getYieldedOfType( createNotice( 'error', 'save error' ), 'CREATE_NOTICE' );
		const original = deepFreeze( reducer( undefined, action ) );

		action = getYieldedOfType( createNotice( 'success', 'successfully saved' ), 'CREATE_NOTICE' );
		const state = reducer( original, action );

		expect( state ).toEqual( {
			[ DEFAULT_CONTEXT ]: [
				{
					id: expect.any( String ),
					content: 'save error',
					status: 'error',
					isDismissible: true,
					actions: [],
					type: 'default',
				},
				{
					id: expect.any( String ),
					content: 'successfully saved',
					status: 'success',
					isDismissible: true,
					actions: [],
					type: 'default',
				},
			],
		} );
	} );

	it( 'should omit a removed notice', () => {
		const action = getYieldedOfType( createNotice( 'error', 'save error' ), 'CREATE_NOTICE' );
		const original = deepFreeze( reducer( undefined, action ) );
		const id = getNotices( original )[ 0 ].id;

		const state = reducer( original, removeNotice( id ) );

		expect( state ).toEqual( {
			[ DEFAULT_CONTEXT ]: [],
		} );
	} );

	it( 'should omit a removed notice by context', () => {
		const action = getYieldedOfType( createNotice( 'error', 'save error', { context: 'foo' } ), 'CREATE_NOTICE' );
		const original = deepFreeze( reducer( undefined, action ) );
		const id = getNotices( original, 'foo' )[ 0 ].id;

		const state = reducer( original, removeNotice( id, 'foo' ) );

		expect( state ).toEqual( {
			foo: [],
		} );
	} );

	it( 'should omit a removed notice across contexts', () => {
		const action = getYieldedOfType( createNotice( 'error', 'save error' ), 'CREATE_NOTICE' );
		const original = deepFreeze( reducer( undefined, action ) );
		const id = getNotices( original )[ 0 ].id;

		const state = reducer( original, removeNotice( id, 'foo' ) );

		expect( state[ DEFAULT_CONTEXT ] ).toHaveLength( 1 );
	} );

	it( 'should dedupe distinct ids, preferring new', () => {
		let action = getYieldedOfType( createNotice( 'error', 'save error (1)', { id: 'error-message' } ), 'CREATE_NOTICE' );
		const original = deepFreeze( reducer( undefined, action ) );

		action = getYieldedOfType( createNotice( 'error', 'save error (2)', { id: 'error-message' } ), 'CREATE_NOTICE' );
		const state = reducer( original, action );

		expect( state ).toEqual( {
			[ DEFAULT_CONTEXT ]: [
				{
					id: 'error-message',
					content: 'save error (2)',
					status: 'error',
					isDismissible: true,
					actions: [],
					type: 'default',
				},
			],
		} );
	} );
} );
