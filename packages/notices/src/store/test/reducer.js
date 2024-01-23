/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */
import reducer from '../reducer';
import {
	createNotice,
	removeNotice,
	removeNotices,
	removeAllNotices,
} from '../actions';
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

	it( 'should omit several removed notices', () => {
		const action = createNotice( 'error', 'save error' );
		const action2 = createNotice( 'error', 'second error' );
		const stateWithOneNotice = reducer( undefined, action );
		const original = deepFreeze( reducer( stateWithOneNotice, action2 ) );
		const ids = [
			getNotices( original )[ 0 ].id,
			getNotices( original )[ 1 ].id,
		];

		const state = reducer( original, removeNotices( ids ) );

		expect( state ).toEqual( {
			[ DEFAULT_CONTEXT ]: [],
		} );
	} );

	it( 'should omit several removed notices across contexts', () => {
		const action = createNotice( 'error', 'save error' );
		const action2 = createNotice( 'error', 'second error', {
			context: 'foo',
		} );
		const action3 = createNotice( 'error', 'third error', {
			context: 'foo',
		} );
		const stateWithOneNotice = reducer( undefined, action );
		const stateWithTwoNotices = reducer( stateWithOneNotice, action2 );
		const original = deepFreeze( reducer( stateWithTwoNotices, action3 ) );
		const ids = [
			getNotices( original, 'foo' )[ 0 ].id,
			getNotices( original, 'foo' )[ 1 ].id,
		];

		const state = reducer( original, removeNotices( ids, 'foo' ) );

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

	it( 'should remove all notices', () => {
		let action = createNotice( 'error', 'save error' );
		const original = deepFreeze( reducer( undefined, action ) );

		action = createNotice( 'success', 'successfully saved' );
		let state = reducer( original, action );
		state = reducer( state, removeAllNotices() );

		expect( state ).toEqual( {
			[ DEFAULT_CONTEXT ]: [],
		} );
	} );

	it( 'should remove all notices in a given context but leave other contexts intact', () => {
		let action = createNotice( 'error', 'save error', {
			context: 'foo',
			id: 'foo-error',
		} );
		const original = deepFreeze( reducer( undefined, action ) );

		action = createNotice( 'success', 'successfully saved', {
			context: 'bar',
		} );

		let state = reducer( original, action );
		state = reducer( state, removeAllNotices( 'default', 'bar' ) );

		expect( state ).toEqual( {
			bar: [],
			foo: [
				{
					id: 'foo-error',
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

	it( 'should remove all notices of a given type', () => {
		let action = createNotice( 'error', 'save error', {
			id: 'global-error',
		} );
		const original = deepFreeze( reducer( undefined, action ) );

		action = createNotice( 'success', 'successfully saved', {
			type: 'snackbar',
			id: 'snackbar-success',
		} );

		let state = reducer( original, action );
		state = reducer( state, removeAllNotices( 'default' ) );

		expect( state ).toEqual( {
			[ DEFAULT_CONTEXT ]: [
				{
					id: 'snackbar-success',
					content: 'successfully saved',
					spokenMessage: 'successfully saved',
					__unstableHTML: undefined,
					status: 'success',
					isDismissible: true,
					actions: [],
					type: 'snackbar',
					icon: null,
					explicitDismiss: false,
					onDismiss: undefined,
				},
			],
		} );
	} );
} );
