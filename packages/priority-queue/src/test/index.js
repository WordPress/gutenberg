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
