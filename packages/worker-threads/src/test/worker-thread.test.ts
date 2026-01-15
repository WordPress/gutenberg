/**
 * Internal dependencies
 */
import { MessageType } from '../types';

// Store the original self
const originalSelf = globalThis.self;

// Mock self for worker context
let mockAddEventListener: jest.Mock;
let mockPostMessage: jest.Mock;
let messageHandler: ( ( event: MessageEvent ) => void ) | null = null;

function setupMockSelf() {
	mockAddEventListener = jest.fn(
		( type: string, handler: ( event: MessageEvent ) => void ) => {
			if ( type === 'message' ) {
				messageHandler = handler;
			}
		}
	);
	mockPostMessage = jest.fn();

	// Override self
	Object.defineProperty( globalThis, 'self', {
		value: {
			addEventListener: mockAddEventListener,
			postMessage: mockPostMessage,
		},
		writable: true,
		configurable: true,
	} );
}

function restoreSelf() {
	Object.defineProperty( globalThis, 'self', {
		value: originalSelf,
		writable: true,
		configurable: true,
	} );
	messageHandler = null;
}

function simulateMessage( data: unknown ) {
	if ( messageHandler ) {
		messageHandler( { data } as MessageEvent );
	}
}

describe( 'worker-thread', () => {
	beforeEach( () => {
		setupMockSelf();
		jest.resetModules();
	} );

	afterEach( () => {
		restoreSelf();
	} );

	describe( 'expose', () => {
		it( 'should set up message event listener', async () => {
			const { expose } = await import( '../worker-thread' );
			const api = { method: jest.fn() };

			expose( api );

			expect( mockAddEventListener ).toHaveBeenCalledWith(
				'message',
				expect.any( Function )
			);
		} );

		it( 'should call method when CALL message is received', async () => {
			const { expose } = await import( '../worker-thread' );
			const mockMethod = jest.fn().mockReturnValue( 'result' );
			const api = { testMethod: mockMethod };

			expose( api );

			simulateMessage( {
				type: MessageType.CALL,
				id: 1,
				method: 'testMethod',
				args: [ 'arg1', 42 ],
			} );

			// Wait for async handling
			await new Promise( ( resolve ) => setTimeout( resolve, 0 ) );

			expect( mockMethod ).toHaveBeenCalledWith( 'arg1', 42 );
		} );

		it( 'should send RESULT message with return value', async () => {
			const { expose } = await import( '../worker-thread' );
			const api = { calculate: () => 42 };

			expose( api );

			simulateMessage( {
				type: MessageType.CALL,
				id: 5,
				method: 'calculate',
				args: [],
			} );

			await new Promise( ( resolve ) => setTimeout( resolve, 0 ) );

			expect( mockPostMessage ).toHaveBeenCalledWith(
				expect.objectContaining( {
					type: MessageType.RESULT,
					id: 5,
					result: 42,
				} ),
				[]
			);
		} );

		it( 'should handle async methods', async () => {
			const { expose } = await import( '../worker-thread' );
			const api = {
				asyncMethod: async () => {
					return 'async result';
				},
			};

			expose( api );

			simulateMessage( {
				type: MessageType.CALL,
				id: 1,
				method: 'asyncMethod',
				args: [],
			} );

			await new Promise( ( resolve ) => setTimeout( resolve, 10 ) );

			expect( mockPostMessage ).toHaveBeenCalledWith(
				expect.objectContaining( {
					type: MessageType.RESULT,
					id: 1,
					result: 'async result',
				} ),
				[]
			);
		} );

		it( 'should send ERROR message when method throws', async () => {
			const { expose } = await import( '../worker-thread' );
			const api = {
				throwingMethod: () => {
					throw new Error( 'Test error' );
				},
			};

			expose( api );

			simulateMessage( {
				type: MessageType.CALL,
				id: 1,
				method: 'throwingMethod',
				args: [],
			} );

			await new Promise( ( resolve ) => setTimeout( resolve, 0 ) );

			expect( mockPostMessage ).toHaveBeenCalledWith(
				expect.objectContaining( {
					type: MessageType.ERROR,
					id: 1,
					error: expect.objectContaining( {
						message: 'Test error',
					} ),
				} ),
				[]
			);
		} );

		it( 'should send ERROR for non-existent method', async () => {
			const { expose } = await import( '../worker-thread' );
			const api = { existingMethod: () => {} };

			expose( api );

			simulateMessage( {
				type: MessageType.CALL,
				id: 1,
				method: 'nonExistentMethod',
				args: [],
			} );

			await new Promise( ( resolve ) => setTimeout( resolve, 0 ) );

			expect( mockPostMessage ).toHaveBeenCalledWith(
				expect.objectContaining( {
					type: MessageType.ERROR,
					id: 1,
					error: expect.objectContaining( {
						message: expect.stringContaining( 'nonExistentMethod' ),
					} ),
				} ),
				[]
			);
		} );

		it( 'should send ERROR for non-function property', async () => {
			const { expose } = await import( '../worker-thread' );
			const api = { notAFunction: 'string value' };

			expose( api );

			simulateMessage( {
				type: MessageType.CALL,
				id: 1,
				method: 'notAFunction',
				args: [],
			} );

			await new Promise( ( resolve ) => setTimeout( resolve, 0 ) );

			expect( mockPostMessage ).toHaveBeenCalledWith(
				expect.objectContaining( {
					type: MessageType.ERROR,
					id: 1,
				} ),
				[]
			);
		} );

		it( 'should ignore non-RPC messages', async () => {
			const { expose } = await import( '../worker-thread' );
			const api = { method: jest.fn() };

			expose( api );

			simulateMessage( { someOther: 'data' } );

			await new Promise( ( resolve ) => setTimeout( resolve, 0 ) );

			expect( api.method ).not.toHaveBeenCalled();
			expect( mockPostMessage ).not.toHaveBeenCalled();
		} );

		it( 'should ignore RESULT messages', async () => {
			const { expose } = await import( '../worker-thread' );
			const api = { method: jest.fn() };

			expose( api );

			simulateMessage( {
				type: MessageType.RESULT,
				id: 1,
				result: 'should be ignored',
			} );

			await new Promise( ( resolve ) => setTimeout( resolve, 0 ) );

			expect( mockPostMessage ).not.toHaveBeenCalled();
		} );

		it( 'should handle rejected promises', async () => {
			const { expose } = await import( '../worker-thread' );
			const api = {
				asyncThrow: async () => {
					throw new Error( 'Async error' );
				},
			};

			expose( api );

			simulateMessage( {
				type: MessageType.CALL,
				id: 1,
				method: 'asyncThrow',
				args: [],
			} );

			await new Promise( ( resolve ) => setTimeout( resolve, 10 ) );

			expect( mockPostMessage ).toHaveBeenCalledWith(
				expect.objectContaining( {
					type: MessageType.ERROR,
					id: 1,
					error: expect.objectContaining( {
						message: 'Async error',
					} ),
				} ),
				[]
			);
		} );
	} );
} );
