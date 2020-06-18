/**
 * Internal dependencies
 */
import { mapping, processingQueue } from '../reducer';

describe( 'mapping', () => {
	it( 'should initialize empty mapping when there is no original state', () => {
		expect( mapping( null, {} ) ).toEqual( {} );
	} );

	it( 'should add the mapping to state', () => {
		const originalState = {};
		const newState = mapping( originalState, {
			type: 'SET_MENU_ITEM_TO_CLIENT_ID_MAPPING',
			postId: 1,
			mapping: { a: 'b' },
		} );
		expect( newState ).not.toBe( originalState );
		expect( newState ).toEqual( {
			1: {
				a: 'b',
			},
		} );
	} );

	it( 'should replace the mapping in state', () => {
		const originalState = {
			1: {
				c: 'd',
			},
			2: {
				e: 'f',
			},
		};
		const newState = mapping( originalState, {
			type: 'SET_MENU_ITEM_TO_CLIENT_ID_MAPPING',
			postId: 1,
			mapping: { g: 'h' },
		} );
		expect( newState ).toEqual( {
			1: {
				g: 'h',
			},
			2: {
				e: 'f',
			},
		} );
	} );
} );

describe( 'processingQueue', () => {
	it( 'should initialize empty mapping when there is no original state', () => {
		expect( processingQueue( null, {} ) ).toEqual( {} );
	} );

	it( 'ENQUEUE_AFTER_PROCESSING should add an action to pendingActions', () => {
		const originalState = {};
		const newState = processingQueue( originalState, {
			type: 'ENQUEUE_AFTER_PROCESSING',
			postId: 1,
			action: 'some action',
		} );
		expect( newState ).toEqual( {
			1: {
				pendingActions: [ 'some action' ],
			},
		} );
	} );
	it( 'ENQUEUE_AFTER_PROCESSING should not add the same action to pendingActions twice', () => {
		const state1 = {};
		const state2 = processingQueue( state1, {
			type: 'ENQUEUE_AFTER_PROCESSING',
			postId: 1,
			action: 'some action',
		} );
		const state3 = processingQueue( state2, {
			type: 'ENQUEUE_AFTER_PROCESSING',
			postId: 1,
			action: 'some action',
		} );
		expect( state3 ).toEqual( {
			1: {
				pendingActions: [ 'some action' ],
			},
		} );
		const state4 = processingQueue( state3, {
			type: 'ENQUEUE_AFTER_PROCESSING',
			postId: 1,
			action: 'another action',
		} );
		expect( state4 ).toEqual( {
			1: {
				pendingActions: [ 'some action', 'another action' ],
			},
		} );
	} );

	it( 'START_PROCESSING_POST should mark post as in progress', () => {
		const originalState = {};
		const newState = processingQueue( originalState, {
			type: 'START_PROCESSING_POST',
			postId: 1,
		} );
		expect( newState ).not.toBe( originalState );
		expect( newState ).toEqual( {
			1: {
				inProgress: true,
			},
		} );
	} );

	it( 'FINISH_PROCESSING_POST should mark post as not in progress', () => {
		const originalState = {
			1: {
				inProgress: true,
			},
		};
		const newState = processingQueue( originalState, {
			type: 'FINISH_PROCESSING_POST',
			postId: 1,
		} );
		expect( newState ).not.toBe( originalState );
		expect( newState ).toEqual( {
			1: {
				inProgress: false,
			},
		} );
	} );

	it( 'FINISH_PROCESSING_POST should preserve other state data', () => {
		const originalState = {
			1: {
				inProgress: true,
				a: 1,
			},
			2: {
				b: 2,
			},
		};
		const newState = processingQueue( originalState, {
			type: 'FINISH_PROCESSING_POST',
			postId: 1,
		} );
		expect( newState ).not.toBe( originalState );
		expect( newState ).toEqual( {
			1: {
				inProgress: false,
				a: 1,
			},
			2: {
				b: 2,
			},
		} );
	} );

	it( 'POP_PENDING_ACTION should remove the action from pendingActions', () => {
		const originalState = {
			1: {
				pendingActions: [
					'first action',
					'some action',
					'another action',
				],
			},
		};
		const newState = processingQueue( originalState, {
			type: 'POP_PENDING_ACTION',
			postId: 1,
			action: 'some action',
		} );
		expect( newState ).toEqual( {
			1: {
				pendingActions: [ 'first action', 'another action' ],
			},
		} );
	} );
} );
