/**
 * Internal dependencies
 */
import { createQueue } from '../';
import requestIdleCallback from '../request-idle-callback';

jest.mock( '../request-idle-callback', () => {
	const emitter = new ( require.requireActual( 'events' ).EventEmitter )();

	return Object.assign(
		( callback ) => emitter.once( 'tick', () => callback( Date.now() ) ),
		{ tick: () => emitter.emit( 'tick' ) },
	);
} );

describe( 'createQueue', () => {
	let queue;
	beforeEach( () => {
		queue = createQueue();
	} );

	describe( 'add', () => {
		it( 'runs callback after processing waiting queue', () => {
			const callback = jest.fn();

			queue.add( {}, callback );

			expect( callback ).not.toHaveBeenCalled();
			requestIdleCallback.tick();
			expect( callback ).toHaveBeenCalled();
		} );

		it( 'runs callbacks in order by distinct added element', () => {
			const elementA = {};
			const elementB = {};
			const callbackElementA = jest.fn();
			const callbackElementB = jest.fn();
			queue.add( elementA, callbackElementA );
			queue.add( elementB, callbackElementB );

			expect( callbackElementA ).not.toHaveBeenCalled();
			expect( callbackElementB ).not.toHaveBeenCalled();

			// ElementA was added first, and should be called first after tick.
			requestIdleCallback.tick();
			expect( callbackElementA ).toHaveBeenCalledTimes( 1 );
			expect( callbackElementB ).not.toHaveBeenCalled();

			// ElementB will be be processed after second tick.
			requestIdleCallback.tick();
			expect( callbackElementA ).toHaveBeenCalledTimes( 1 );
			expect( callbackElementB ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'calls most recently added callback if added for same element', () => {
			const element = {};
			const callbackOne = jest.fn();
			const callbackTwo = jest.fn();
			queue.add( element, callbackOne );
			queue.add( element, callbackTwo );

			expect( callbackOne ).not.toHaveBeenCalled();
			expect( callbackTwo ).not.toHaveBeenCalled();

			requestIdleCallback.tick();
			expect( callbackOne ).not.toHaveBeenCalled();
			expect( callbackTwo ).toHaveBeenCalledTimes( 1 );
		} );
	} );

	describe( 'flush', () => {
		it( 'invokes all callbacks associated with element', () => {
			const elementA = {};
			const elementB = {};
			const callbackElementA = jest.fn();
			const callbackElementB = jest.fn();
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
} );
