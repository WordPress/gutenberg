/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */
import reducer from '../reducer';
import { createNotice, removeNotice } from '../actions';
import { getNotices } from '../selectors';
import { DEFAULT_CONTEXT } from '../constants';

describe( 'reducer', () => {
	it( 'should default to an empty object', () => {
		const state = reducer( undefined, {} );

		expect( state ).toEqual( {} );
	} );

	it( 'should track a notice', () => {
		const action = createNotice( 'error', 'save error' );
		const state = reducer( undefined, action );

		expect( state ).toEqual( {
			[ DEFAULT_CONTEXT ]: [
				{
					id: expect.any( String ),
					content: 'save error',
					spokenMessage: 'save error',
					__unstableHTML: undefined,
					status: 'error',
					isDismissible: true,
					actions: [],
					type: 'default',
					icon: null,
					explicitDismiss: false,
					onDismiss: undefined,
				},
			],
		} );
	} );

	it( 'should track a notice by context', () => {
		const action = createNotice( 'error', 'save error', {
			context: 'foo',
		} );
		const state = reducer( undefined, action );

		expect( state ).toEqual( {
			foo: [
				{
					id: expect.any( String ),
					content: 'save error',
					spokenMessage: 'save error',
					__unstableHTML: undefined,
					status: 'error',
					isDismissible: true,
					actions: [],
					type: 'default',
					icon: null,
					explicitDismiss: false,
					onDismiss: undefined,
				},
			],
		} );
	} );

	it( 'should track notices, respecting order by which they were created', () => {
		let action = createNotice( 'error', 'save error' );
		const original = deepFreeze( reducer( undefined, action ) );

		action = createNotice( 'success', 'successfully saved' );
		const state = reducer( original, action );

		expect( state ).toEqual( {
			[ DEFAULT_CONTEXT ]: [
				{
					id: expect.any( String ),
					content: 'save error',
					spokenMessage: 'save error',
					__unstableHTML: undefined,
					status: 'error',
					isDismissible: true,
					actions: [],
					type: 'default',
					icon: null,
					explicitDismiss: false,
					onDismiss: undefined,
				},
				{
					id: expect.any( String ),
					content: 'successfully saved',
					spokenMessage: 'successfully saved',
					__unstableHTML: undefined,
					status: 'success',
					isDismissible: true,
					actions: [],
					type: 'default',
					icon: null,
					explicitDismiss: false,
					onDismiss: undefined,
				},
			],
		} );
	} );

	it( 'should omit a removed notice', () => {
		const action = createNotice( 'error', 'save error' );
		const original = deepFreeze( reducer( undefined, action ) );
		const id = getNotices( original )[ 0 ].id;

		const state = reducer( original, removeNotice( id ) );

		expect( state ).toEqual( {
			[ DEFAULT_CONTEXT ]: [],
		} );
	} );

	it( 'should omit a removed notice by context', () => {
		const action = createNotice( 'error', 'save error', {
			context: 'foo',
		} );
		const original = deepFreeze( reducer( undefined, action ) );
		const id = getNotices( original, 'foo' )[ 0 ].id;

		const state = reducer( original, removeNotice( id, 'foo' ) );

		expect( state ).toEqual( {
			foo: [],
		} );
	} );

	it( 'should omit a removed notice across contexts', () => {
		const action = createNotice( 'error', 'save error' );
		const original = deepFreeze( reducer( undefined, action ) );
		const id = getNotices( original )[ 0 ].id;

		const state = reducer( original, removeNotice( id, 'foo' ) );

		expect( state[ DEFAULT_CONTEXT ] ).toHaveLength( 1 );
	} );

	it( 'should dedupe distinct ids, preferring new', () => {
		let action = createNotice( 'error', 'save error (1)', {
			id: 'error-message',
		} );
		const original = deepFreeze( reducer( undefined, action ) );

		action = createNotice( 'error', 'save error (2)', {
			id: 'error-message',
		} );
		const state = reducer( original, action );

		expect( state ).toEqual( {
			[ DEFAULT_CONTEXT ]: [
				{
					id: 'error-message',
					content: 'save error (2)',
					spokenMessage: 'save error (2)',
					__unstableHTML: undefined,
					status: 'error',
					isDismissible: true,
					actions: [],
					type: 'default',
					icon: null,
					explicitDismiss: false,
					onDismiss: undefined,
				},
			],
		} );
	} );
} );
