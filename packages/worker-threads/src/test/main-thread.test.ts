/**
 * Internal dependencies
 */
import { wrap, terminate } from '../main-thread';
import { WORKER_SYMBOL } from '../types';

/**
 * Mock Worker class for testing.
 * Uses onmessage property pattern matching the worker-rpc integration.
 */
class MockWorker {
	postMessage = jest.fn();
	terminate = jest.fn();
	onmessage: ( ( event: MessageEvent ) => void ) | null = null;

	/**
	 * Simulate receiving a message from the worker.
	 * @param data
	 */
	simulateMessage( data: unknown ) {
		if ( this.onmessage ) {
			this.onmessage( { data } as MessageEvent );
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

		it( 'should set up onmessage handler on worker', () => {
			const worker = new MockWorker();
			wrap( worker as unknown as Worker );

			expect( worker.onmessage ).toBeDefined();
			expect( typeof worker.onmessage ).toBe( 'function' );
		} );

		it( 'should only set up handler once for same worker', () => {
			const worker = new MockWorker();
			wrap( worker as unknown as Worker );
			const firstHandler = worker.onmessage;

			wrap( worker as unknown as Worker );
			const secondHandler = worker.onmessage;

			expect( firstHandler ).toBe( secondHandler );
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

		it( 'should return undefined for symbol properties', () => {
			const worker = new MockWorker();
			const remote = wrap( worker as unknown as Worker );
			const customSymbol = Symbol( 'custom' );

			expect(
				( remote as unknown as Record< symbol, unknown > )[
					customSymbol
				]
			).toBeUndefined();
		} );

		it( 'should return async functions for property access', () => {
			const worker = new MockWorker();
			const remote = wrap< { testMethod: () => void } >(
				worker as unknown as Worker
			);

			expect( typeof remote.testMethod ).toBe( 'function' );
		} );

		it( 'should send message when method is invoked', () => {
			const worker = new MockWorker();
			const remote = wrap< { testMethod: ( a: number ) => number } >(
				worker as unknown as Worker
			);

			remote.testMethod( 42 );

			expect( worker.postMessage ).toHaveBeenCalled();
			// worker-rpc handles message format internally
		} );

		it( 'should return a Promise from method calls', () => {
			const worker = new MockWorker();
			const remote = wrap< { testMethod: () => string } >(
				worker as unknown as Worker
			);

			const result = remote.testMethod();

			expect( result ).toBeInstanceOf( Promise );
		} );

		it( 'should handle multiple concurrent calls', async () => {
			const worker = new MockWorker();
			const remote = wrap< { method: ( n: number ) => number } >(
				worker as unknown as Worker
			);

			// Make concurrent calls
			const promise1 = remote.method( 1 );
			const promise2 = remote.method( 2 );

			// Verify multiple messages were sent
			expect( worker.postMessage ).toHaveBeenCalledTimes( 2 );

			// Both should be pending promises
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

			// Should not throw - worker.terminate() is idempotent
			expect( worker.terminate ).toHaveBeenCalled();
		} );

		it( 'should handle terminate on non-wrapped object', () => {
			const notWrapped = {} as ReturnType< typeof wrap >;

			// Should not throw
			expect( () => terminate( notWrapped ) ).not.toThrow();
		} );
	} );
} );
