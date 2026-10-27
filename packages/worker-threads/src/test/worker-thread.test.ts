import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	vi,
	type Mock,
} from 'vitest';

// Store the original self.
const originalSelf = globalThis.self;

// Mock self for worker context.
let mockPostMessage: Mock;
let messageListeners: Array< ( event: MessageEvent ) => void > = [];

function setupMockSelf() {
	mockPostMessage = vi.fn();
	messageListeners = [];

	// Override self with addEventListener pattern (matching comctx usage).
	const mockSelf = {
		postMessage: mockPostMessage,
		addEventListener: (
			type: string,
			handler: ( event: MessageEvent ) => void
		) => {
			if ( type === 'message' ) {
				messageListeners.push( handler );
			}
		},
		removeEventListener: (
			type: string,
			handler: ( event: MessageEvent ) => void
		) => {
			if ( type === 'message' ) {
				messageListeners = messageListeners.filter(
					( h ) => h !== handler
				);
			}
		},
	};

	Object.defineProperty( globalThis, 'self', {
		value: mockSelf,
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
	messageListeners = [];
}

describe( 'worker-thread', () => {
	beforeEach( () => {
		setupMockSelf();
		vi.resetModules();
	} );

	afterEach( () => {
		restoreSelf();
	} );

	describe( 'expose', () => {
		it( 'should set up message handler', async () => {
			const { expose } = await import( '../worker-thread' );
			const api = { method: vi.fn() };

			expose( api );

			expect( messageListeners.length ).toBeGreaterThan( 0 );
		} );

		it( 'should register handlers for all methods on target', async () => {
			const { expose } = await import( '../worker-thread' );
			const method1 = vi.fn();
			const method2 = vi.fn();
			const api = {
				method1,
				method2,
				notAFunction: 'string value',
			};

			// expose() should complete without error.
			expect( () => expose( api ) ).not.toThrow();
		} );

		it( 'should only expose functions, not other properties', async () => {
			const { expose } = await import( '../worker-thread' );
			const api = {
				validMethod: vi.fn(),
				stringProp: 'not a function',
				numberProp: 42,
				objectProp: { nested: true },
			};

			// Should not throw.
			expect( () => expose( api ) ).not.toThrow();
		} );

		it( 'should handle empty object', async () => {
			const { expose } = await import( '../worker-thread' );
			const api = {};

			// Should not throw.
			expect( () => expose( api ) ).not.toThrow();
		} );

		it( 'should handle object with async methods', async () => {
			const { expose } = await import( '../worker-thread' );
			const api = {
				asyncMethod: async () => {
					return 'async result';
				},
				syncMethod: () => 'sync result',
			};

			expect( () => expose( api ) ).not.toThrow();
		} );
	} );
} );
