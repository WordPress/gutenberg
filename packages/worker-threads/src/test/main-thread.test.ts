/**
 * Internal dependencies
 */
import { wrap, terminate } from '../main-thread';
import { MessageType, WORKER_SYMBOL } from '../types';

/**
 * Mock Worker class for testing.
 */
class MockWorker {
	postMessage = jest.fn();
	terminate = jest.fn();
	addEventListener = jest.fn();
	removeEventListener = jest.fn();

	private messageHandler: ( ( event: MessageEvent ) => void ) | null = null;

	constructor() {
		this.addEventListener.mockImplementation(
			( type: string, handler: ( event: MessageEvent ) => void ) => {
				if ( type === 'message' ) {
					this.messageHandler = handler;
				}
			}
		);
	}

	/**
	 * Simulate receiving a message from the worker.
	 * @param data
	 */
	simulateMessage( data: unknown ) {
		if ( this.messageHandler ) {
			this.messageHandler( { data } as MessageEvent );
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

		it( 'should set up message handler on worker', () => {
			const worker = new MockWorker();
			wrap( worker as unknown as Worker );

			expect( worker.addEventListener ).toHaveBeenCalledWith(
				'message',
				expect.any( Function )
			);
		} );

		it( 'should only set up handler once for same worker', () => {
			const worker = new MockWorker();
			wrap( worker as unknown as Worker );
			wrap( worker as unknown as Worker );

			expect( worker.addEventListener ).toHaveBeenCalledTimes( 1 );
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

		it( 'should send CALL message when method is invoked', () => {
			const worker = new MockWorker();
			const remote = wrap< { testMethod: ( a: number ) => number } >(
				worker as unknown as Worker
			);

			remote.testMethod( 42 );

			expect( worker.postMessage ).toHaveBeenCalledWith(
				expect.objectContaining( {
					type: MessageType.CALL,
					method: 'testMethod',
					args: [ 42 ],
				} ),
				[]
			);
		} );

		it( 'should return a Promise from method calls', () => {
			const worker = new MockWorker();
			const remote = wrap< { testMethod: () => string } >(
				worker as unknown as Worker
			);

			const result = remote.testMethod();

			expect( result ).toBeInstanceOf( Promise );
		} );

		it( 'should resolve Promise when RESULT message is received', async () => {
			const worker = new MockWorker();
			const remote = wrap< { testMethod: () => string } >(
				worker as unknown as Worker
			);

			const promise = remote.testMethod();

			// Get the call ID from the posted message
			const callMessage = worker.postMessage.mock.calls[ 0 ][ 0 ];

			// Simulate worker response
			worker.simulateMessage( {
				type: MessageType.RESULT,
				id: callMessage.id,
				result: 'success',
			} );

			await expect( promise ).resolves.toBe( 'success' );
		} );

		it( 'should reject Promise when ERROR message is received', async () => {
			const worker = new MockWorker();
			const remote = wrap< { testMethod: () => string } >(
				worker as unknown as Worker
			);

			const promise = remote.testMethod();

			const callMessage = worker.postMessage.mock.calls[ 0 ][ 0 ];

			worker.simulateMessage( {
				type: MessageType.ERROR,
				id: callMessage.id,
				error: { message: 'Something went wrong', name: 'TestError' },
			} );

			await expect( promise ).rejects.toThrow( 'Something went wrong' );
		} );

		it( 'should handle multiple concurrent calls', async () => {
			const worker = new MockWorker();
			const remote = wrap< { method: ( n: number ) => number } >(
				worker as unknown as Worker
			);

			const promise1 = remote.method( 1 );
			const promise2 = remote.method( 2 );

			const call1 = worker.postMessage.mock.calls[ 0 ][ 0 ];
			const call2 = worker.postMessage.mock.calls[ 1 ][ 0 ];

			// Respond out of order
			worker.simulateMessage( {
				type: MessageType.RESULT,
				id: call2.id,
				result: 20,
			} );

			worker.simulateMessage( {
				type: MessageType.RESULT,
				id: call1.id,
				result: 10,
			} );

			await expect( promise1 ).resolves.toBe( 10 );
			await expect( promise2 ).resolves.toBe( 20 );
		} );

		it( 'should ignore non-RPC messages', async () => {
			const worker = new MockWorker();
			const remote = wrap< { testMethod: () => string } >(
				worker as unknown as Worker
			);

			const promise = remote.testMethod();
			const callMessage = worker.postMessage.mock.calls[ 0 ][ 0 ];

			// Send non-RPC message (should be ignored)
			worker.simulateMessage( { someOther: 'data' } );

			// Send actual response
			worker.simulateMessage( {
				type: MessageType.RESULT,
				id: callMessage.id,
				result: 'done',
			} );

			await expect( promise ).resolves.toBe( 'done' );
		} );
	} );

	describe( 'terminate', () => {
		it( 'should call worker.terminate()', () => {
			const worker = new MockWorker();
			const remote = wrap( worker as unknown as Worker );

			terminate( remote );

			expect( worker.terminate ).toHaveBeenCalled();
		} );

		it( 'should remove message event listener', () => {
			const worker = new MockWorker();
			const remote = wrap( worker as unknown as Worker );

			terminate( remote );

			expect( worker.removeEventListener ).toHaveBeenCalledWith(
				'message',
				expect.any( Function )
			);
		} );

		it( 'should reject pending calls with error', async () => {
			const worker = new MockWorker();
			const remote = wrap< { testMethod: () => string } >(
				worker as unknown as Worker
			);

			const promise = remote.testMethod();

			terminate( remote );

			await expect( promise ).rejects.toThrow( 'Worker terminated' );
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

		it( 'should reject new calls after termination', async () => {
			const worker = new MockWorker();
			const remote = wrap< { testMethod: () => string } >(
				worker as unknown as Worker
			);

			terminate( remote );

			const promise = remote.testMethod();

			await expect( promise ).rejects.toThrow(
				'Worker has been terminated'
			);
		} );
	} );
} );
