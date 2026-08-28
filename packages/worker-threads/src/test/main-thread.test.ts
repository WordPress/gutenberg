import { wrap, terminate } from '../main-thread';
import { WORKER_SYMBOL } from '../types';

/**
 * Mock Worker class for testing.
 * Implements the addEventListener pattern used by comctx and the
 * error/messageerror events used for worker failure detection.
 */
class MockWorker {
	postMessage = jest.fn();
	terminate = jest.fn();

	private listeners: Map< string, Array< ( event: Event ) => void > > =
		new Map();

	addEventListener( type: string, handler: ( event: Event ) => void ) {
		const handlers = this.listeners.get( type ) || [];
		handlers.push( handler );
		this.listeners.set( type, handlers );
	}

	removeEventListener( type: string, handler: ( event: Event ) => void ) {
		const handlers = this.listeners.get( type ) || [];
		this.listeners.set(
			type,
			handlers.filter( ( h ) => h !== handler )
		);
	}

	/**
	 * Simulate receiving a message from the worker.
	 *
	 * @param data Message data.
	 */
	simulateMessage( data: unknown ) {
		for ( const handler of this.listeners.get( 'message' ) || [] ) {
			handler( { data } as MessageEvent );
		}
	}

	/**
	 * Simulate an event on the worker (e.g. error, messageerror).
	 *
	 * @param type  Event type.
	 * @param event Event object.
	 */
	simulateEvent( type: string, event: Partial< ErrorEvent > = {} ) {
		for ( const handler of this.listeners.get( type ) || [] ) {
			handler( event as Event );
		}
	}

	/**
	 * Returns the last message sent to the worker via postMessage.
	 */
	get lastSentMessage(): Record< string, unknown > {
		const { calls } = this.postMessage.mock;
		return calls[ calls.length - 1 ][ 0 ];
	}
}

/**
 * Flushes pending microtasks so comctx's async message dispatch settles.
 */
async function flushMicrotasks() {
	for ( let i = 0; i < 10; i++ ) {
		await Promise.resolve();
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

		it( 'should resolve calls when the worker responds', async () => {
			const worker = new MockWorker();
			const remote = wrap< { method: ( n: number ) => number } >(
				worker as unknown as Worker
			);

			const promise = remote.method( 1 );
			await flushMicrotasks();

			// Echo the request back as a provider response with a result.
			worker.simulateMessage( {
				...worker.lastSentMessage,
				sender: 'provider',
				data: 42,
			} );

			await expect( promise ).resolves.toBe( 42 );
		} );

		it( 'should reject calls when the worker responds with an error', async () => {
			const worker = new MockWorker();
			const remote = wrap< { method: ( n: number ) => number } >(
				worker as unknown as Worker
			);

			const promise = remote.method( 1 );
			await flushMicrotasks();

			worker.simulateMessage( {
				...worker.lastSentMessage,
				sender: 'provider',
				error: 'processing failed',
			} );

			await expect( promise ).rejects.toThrow( 'processing failed' );
		} );

		it( 'should reject pending calls when the worker emits an error event', async () => {
			const worker = new MockWorker();
			const remote = wrap< { method: ( n: number ) => number } >(
				worker as unknown as Worker
			);

			const promise1 = remote.method( 1 );
			const promise2 = remote.method( 2 );
			await flushMicrotasks();

			worker.simulateEvent( 'error', { message: 'worker crashed' } );

			await expect( promise1 ).rejects.toThrow( 'worker crashed' );
			await expect( promise2 ).rejects.toThrow( 'worker crashed' );
		} );

		it( 'should reject pending calls when the worker emits a messageerror event', async () => {
			const worker = new MockWorker();
			const remote = wrap< { method: ( n: number ) => number } >(
				worker as unknown as Worker
			);

			const promise = remote.method( 1 );
			await flushMicrotasks();

			worker.simulateEvent( 'messageerror' );

			await expect( promise ).rejects.toThrow(
				'could not be deserialized'
			);
		} );

		it( 'should reject calls made after the worker has errored', async () => {
			const worker = new MockWorker();
			const remote = wrap< { method: ( n: number ) => number } >(
				worker as unknown as Worker
			);

			worker.simulateEvent( 'error', { message: 'worker crashed' } );

			await expect( remote.method( 1 ) ).rejects.toThrow(
				'worker crashed'
			);
		} );

		it( 'should not reject calls that already settled when the worker errors', async () => {
			const worker = new MockWorker();
			const remote = wrap< { method: ( n: number ) => number } >(
				worker as unknown as Worker
			);

			const promise = remote.method( 1 );
			await flushMicrotasks();

			worker.simulateMessage( {
				...worker.lastSentMessage,
				sender: 'provider',
				data: 42,
			} );

			await expect( promise ).resolves.toBe( 42 );

			// A later worker failure must not affect the settled call.
			worker.simulateEvent( 'error', { message: 'worker crashed' } );

			await expect( promise ).resolves.toBe( 42 );
		} );
	} );

	describe( 'terminate', () => {
		it( 'should call worker.terminate()', () => {
			const worker = new MockWorker();
			const remote = wrap( worker as unknown as Worker );

			terminate( remote );

			expect( worker.terminate ).toHaveBeenCalled();
		} );

		it( 'should reject pending calls', async () => {
			const worker = new MockWorker();
			const remote = wrap< { method: ( n: number ) => number } >(
				worker as unknown as Worker
			);

			const promise1 = remote.method( 1 );
			const promise2 = remote.method( 2 );
			await flushMicrotasks();

			terminate( remote );

			await expect( promise1 ).rejects.toThrow( 'terminated' );
			await expect( promise2 ).rejects.toThrow( 'terminated' );
		} );

		it( 'should reject calls made after termination', async () => {
			const worker = new MockWorker();
			const remote = wrap< { method: ( n: number ) => number } >(
				worker as unknown as Worker
			);

			terminate( remote );

			await expect( remote.method( 1 ) ).rejects.toThrow( 'terminated' );
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
