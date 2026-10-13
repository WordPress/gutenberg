import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createQueue } from '../';
import _requestIdleCallback from '../request-idle-callback';
import type { RequestIdleCallbackCallback } from '../types';

const requestIdleCallback =
	_requestIdleCallback as typeof _requestIdleCallback & {
		tick: ( deadline?: Partial< IdleDeadline > | number ) => void;
	};

vi.mock( import( '../request-idle-callback' ), () => {
	const callbacks = new Set< RequestIdleCallbackCallback >();

	return {
		default: Object.assign(
			( callback: RequestIdleCallbackCallback ) =>
				callbacks.add( callback ),
			{
				tick: (
					deadline: Partial< IdleDeadline > | number = Date.now()
				) => {
					const pendingCallbacks = [ ...callbacks ];
					callbacks.clear();
					for ( const callback of pendingCallbacks ) {
						callback( deadline as IdleDeadline | number );
					}
				},
			}
		),
	};
} );

describe( 'createQueue', () => {
	let queue: ReturnType< typeof createQueue >;
	beforeEach( () => {
		queue = createQueue();
	} );

	describe( 'add', () => {
		it( 'runs callback after processing waiting queue', () => {
			const callback = vi.fn();

			queue.add( {}, callback );

			expect( callback ).not.toHaveBeenCalled();
			requestIdleCallback.tick();
			expect( callback ).toHaveBeenCalled();
		} );

		it( 'runs callbacks in order by distinct added element', () => {
			const elementA = {};
			const elementB = {};
			const callbackElementA = vi.fn();
			const callbackElementB = vi.fn();
			queue.add( elementA, callbackElementA );
			queue.add( elementB, callbackElementB );

			expect( callbackElementA ).not.toHaveBeenCalled();
			expect( callbackElementB ).not.toHaveBeenCalled();

			// ElementA was added first, and should be called first after tick.
			requestIdleCallback.tick();
			expect( callbackElementA ).toHaveBeenCalledTimes( 1 );
			expect( callbackElementB ).not.toHaveBeenCalled();

			// ElementB will be processed after second tick.
			requestIdleCallback.tick();
			expect( callbackElementA ).toHaveBeenCalledTimes( 1 );
			expect( callbackElementB ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'calls most recently added callback if added for same element', () => {
			const element = {};
			const callbackOne = vi.fn();
			const callbackTwo = vi.fn();
			queue.add( element, callbackOne );
			queue.add( element, callbackTwo );

			expect( callbackOne ).not.toHaveBeenCalled();
			expect( callbackTwo ).not.toHaveBeenCalled();

			requestIdleCallback.tick();
			expect( callbackOne ).not.toHaveBeenCalled();
			expect( callbackTwo ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'processes queue as long as time allows, with idle deadline implementation', () => {
			const elementA = {};
			const elementB = {};
			const elementC = {};
			const callbackElementA = vi.fn();
			const callbackElementB = vi.fn();
			const callbackElementC = vi.fn();
			queue.add( elementA, callbackElementA );
			queue.add( elementB, callbackElementB );
			queue.add( elementC, callbackElementC );

			expect( callbackElementA ).not.toHaveBeenCalled();
			expect( callbackElementB ).not.toHaveBeenCalled();
			expect( callbackElementC ).not.toHaveBeenCalled();

			// Mock implementation such that with the first call, it reports as
			// having some time remaining, but no time remaining on the second.
			const timeRemaining = vi
				.fn()
				.mockImplementationOnce( () => 100 )
				.mockImplementationOnce( () => 0 );

			requestIdleCallback.tick( { timeRemaining } );

			// Given the above mock, expect that the initial callback would
			// process A, then time remaining would allow for B to be processed,
			// but C would not be processed because no time remains.
			expect( callbackElementA ).toHaveBeenCalledTimes( 1 );
			expect( callbackElementB ).toHaveBeenCalledTimes( 1 );
			expect( callbackElementC ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'flush', () => {
		it( 'invokes all callbacks associated with element', () => {
			const elementA = {};
			const elementB = {};
			const callbackElementA = vi.fn();
			const callbackElementB = vi.fn();
			queue.add( elementA, callbackElementA );
			queue.add( elementB, callbackElementB );

			expect( callbackElementA ).not.toHaveBeenCalled();
			expect( callbackElementB ).not.toHaveBeenCalled();

			queue.flush( elementA );

			// Only ElementA callback should have been called (synchronously).
			expect( callbackElementA ).toHaveBeenCalledTimes( 1 );
			expect( callbackElementB ).not.toHaveBeenCalled();

			// Verify that callback still called only once after tick (verify
			// removal).
			requestIdleCallback.tick();
			expect( callbackElementA ).toHaveBeenCalledTimes( 1 );
			expect( callbackElementB ).toHaveBeenCalledTimes( 1 );
		} );
	} );

	describe( 'cancel', () => {
		it( 'removes all callbacks associated with element without executing', () => {
			const elementA = {};
			const elementB = {};
			const callbackElementA = vi.fn();
			const callbackElementB = vi.fn();
			queue.add( elementA, callbackElementA );
			queue.add( elementB, callbackElementB );

			expect( callbackElementA ).not.toHaveBeenCalled();
			expect( callbackElementB ).not.toHaveBeenCalled();

			expect( queue.cancel( elementA ) ).toBe( true );

			// No callbacks should have been called.
			expect( callbackElementA ).not.toHaveBeenCalled();
			expect( callbackElementB ).not.toHaveBeenCalled();

			// A subsequent `flush` has nothing to remove.
			expect( queue.flush( elementA ) ).toBe( false );

			// The queue for `elementA` remained intact and can be successfully flushed.
			expect( queue.flush( elementB ) ).toBe( true );
			expect( callbackElementB ).toHaveBeenCalledTimes( 1 );
		} );
	} );
} );
