/**
 * @jest-environment jsdom
 */

/**
 * External dependencies
 */
import {
	describe,
	expect,
	it,
	jest,
	beforeEach,
	afterEach,
} from '@jest/globals';

/**
 * Internal dependencies
 */
import { createPresenceDetector } from '../presence-detector';

// Minimal Awareness mock
function createMockAwareness( clientID: number ) {
	return {
		clientID,
		getLocalState: () => ( { name: 'Test User' } ),
	} as any;
}

function createMockCheckPresence( {
	otherClientIds = [] as number[],
	shouldReject = false,
} = {} ) {
	const fn = jest.fn<
		(
			options: Record< string, unknown >
		) => Promise< { otherClientIds: number[] } >
	>( () => {
		if ( shouldReject ) {
			return Promise.reject( new Error( 'Network error' ) );
		}
		return Promise.resolve( { otherClientIds } );
	} );
	return fn;
}

// Use a manual approach: let the async poll run on real microtask queue,
// but control setTimeout scheduling with fake timers.
describe( 'presence-detector', () => {
	beforeEach( () => {
		jest.useFakeTimers( { advanceTimers: true } );
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	it( 'should not call onCollaboratorDetected when solo', async () => {
		const onCollaboratorDetected = jest.fn();
		const checkPresence = createMockCheckPresence();

		createPresenceDetector( {
			room: 'post:123',
			clientId: 42,
			awareness: createMockAwareness( 42 ),
			checkPresence,
			onCollaboratorDetected,
		} );

		// Let the initial async poll complete
		await jest.advanceTimersByTimeAsync( 100 );

		expect( checkPresence ).toHaveBeenCalledTimes( 1 );
		expect( onCollaboratorDetected ).not.toHaveBeenCalled();
	} );

	it( 'should call onCollaboratorDetected when another client found', async () => {
		const onCollaboratorDetected = jest.fn();
		const checkPresence = createMockCheckPresence( {
			otherClientIds: [ 99 ],
		} );

		createPresenceDetector( {
			room: 'post:123',
			clientId: 42,
			awareness: createMockAwareness( 42 ),
			checkPresence,
			onCollaboratorDetected,
		} );

		await jest.advanceTimersByTimeAsync( 100 );

		expect( onCollaboratorDetected ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should stop polling after detecting a collaborator', async () => {
		const onCollaboratorDetected = jest.fn();
		const checkPresence = createMockCheckPresence( {
			otherClientIds: [ 99 ],
		} );

		createPresenceDetector( {
			room: 'post:123',
			clientId: 42,
			awareness: createMockAwareness( 42 ),
			checkPresence,
			onCollaboratorDetected,
		} );

		await jest.advanceTimersByTimeAsync( 100 );

		expect( checkPresence ).toHaveBeenCalledTimes( 1 );

		// Advance past several poll intervals — no more requests
		await jest.advanceTimersByTimeAsync( 60_000 );

		expect( checkPresence ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should stop polling when destroyed', async () => {
		const onCollaboratorDetected = jest.fn();
		const checkPresence = createMockCheckPresence();

		const detector = createPresenceDetector( {
			room: 'post:123',
			clientId: 42,
			awareness: createMockAwareness( 42 ),
			checkPresence,
			onCollaboratorDetected,
		} );

		await jest.advanceTimersByTimeAsync( 100 );
		expect( checkPresence ).toHaveBeenCalledTimes( 1 );

		detector.destroy();

		await jest.advanceTimersByTimeAsync( 60_000 );
		expect( checkPresence ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should pass correct arguments to checkPresence', async () => {
		const checkPresence = createMockCheckPresence();

		createPresenceDetector( {
			room: 'post:456',
			clientId: 7,
			awareness: createMockAwareness( 7 ),
			checkPresence,
			onCollaboratorDetected: jest.fn(),
		} );

		await jest.advanceTimersByTimeAsync( 100 );

		expect( checkPresence ).toHaveBeenCalledWith( {
			room: 'post:456',
			clientId: 7,
			localAwarenessState: { name: 'Test User' },
		} );
	} );

	it( 'should retry after a poll error', async () => {
		const onCollaboratorDetected = jest.fn();

		// First call rejects, second resolves with a collaborator.
		let callCount = 0;
		const checkPresence = jest.fn( () => {
			callCount++;
			if ( callCount === 1 ) {
				return Promise.reject( new Error( 'Network error' ) );
			}
			return Promise.resolve( { otherClientIds: [ 99 ] } );
		} );

		createPresenceDetector( {
			room: 'post:123',
			clientId: 42,
			awareness: createMockAwareness( 42 ),
			checkPresence,
			onCollaboratorDetected,
		} );

		// First poll (error)
		await jest.advanceTimersByTimeAsync( 100 );
		expect( checkPresence ).toHaveBeenCalledTimes( 1 );
		expect( onCollaboratorDetected ).not.toHaveBeenCalled();

		// Next poll (after 10s interval)
		await jest.advanceTimersByTimeAsync( 10_000 );
		expect( checkPresence ).toHaveBeenCalledTimes( 2 );
		expect( onCollaboratorDetected ).toHaveBeenCalledTimes( 1 );
	} );
} );
