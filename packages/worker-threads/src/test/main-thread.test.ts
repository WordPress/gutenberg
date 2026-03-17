/**
 * Internal dependencies
 */
import { wrap, terminate } from '../main-thread';
import { WORKER_SYMBOL } from '../types';

/**
 * Mock Worker class for testing.
 * Implements addEventListener pattern used by comctx.
 */
class MockWorker {
	postMessage = jest.fn();
	terminate = jest.fn();

	private messageListeners: Array< ( event: MessageEvent ) => void > = [];

	addEventListener( type: string, handler: ( event: MessageEvent ) => void ) {
		if ( type === 'message' ) {
			this.messageListeners.push( handler );
		}
	}

	removeEventListener(
		type: string,
		handler: ( event: MessageEvent ) => void
	) {
		if ( type === 'message' ) {
			this.messageListeners = this.messageListeners.filter(
				( h ) => h !== handler
			);
		}
	}

	/**
	 * Simulate receiving a message from the worker.
	 *
	 * @param data
	 */
	simulateMessage( data: unknown ) {
		for ( const handler of this.messageListeners ) {
			handler( { data } as MessageEvent );
		}
	}
}

describe( 'main-thread', () => {
	describe( 'wrap', () => {
		it( 'should return a proxy object', () => {
			const worker = new MockWorker();
			const remote = wrap( worker as unknown as Worker );

			expect( remote ).toBeDefined();
			expect( typeof remote ).toBe( 'object' );
		} );

		it( 'should return WORKER_SYMBOL reference', () => {
			const worker = new MockWorker();
			const remote = wrap( worker as unknown as Worker );

			expect(
				( remote as unknown as Record< symbol, unknown > )[
					WORKER_SYMBOL
				]
			).toBe( worker );
		} );

		it( 'should return functions for property access', () => {
			const worker = new MockWorker();
			const remote = wrap< { testMethod: () => void } >(
				worker as unknown as Worker
			);

			expect( typeof remote.testMethod ).toBe( 'function' );
		} );

		it( 'should return a Promise from method calls', () => {
			const worker = new MockWorker();
			const remote = wrap< { testMethod: () => string } >(
				worker as unknown as Worker
			);

			const result = remote.testMethod();

			expect( result ).toBeInstanceOf( Promise );
		} );

		it( 'should handle multiple concurrent calls returning promises', async () => {
			const worker = new MockWorker();
			const remote = wrap< { method: ( n: number ) => number } >(
				worker as unknown as Worker
			);

			// Make concurrent calls.
			const promise1 = remote.method( 1 );
			const promise2 = remote.method( 2 );

			// Both should be pending promises.
			expect( promise1 ).toBeInstanceOf( Promise );
			expect( promise2 ).toBeInstanceOf( Promise );
		} );
	} );

	describe( 'terminate', () => {
		it( 'should call worker.terminate()', () => {
			const worker = new MockWorker();
			const remote = wrap( worker as unknown as Worker );

			terminate( remote );

			expect( worker.terminate ).toHaveBeenCalled();
		} );

		it( 'should handle terminate called multiple times', () => {
			const worker = new MockWorker();
			const remote = wrap( worker as unknown as Worker );

			terminate( remote );
			terminate( remote );

			// Should not throw - worker.terminate() is idempotent.
			expect( worker.terminate ).toHaveBeenCalled();
		} );

		it( 'should handle terminate on non-wrapped object', () => {
			const notWrapped = {} as ReturnType< typeof wrap >;

			// Should not throw.
			expect( () => terminate( notWrapped ) ).not.toThrow();
		} );
	} );
} );
