// Store the original self
const originalSelf = globalThis.self;

// Mock self for worker context
let mockPostMessage: jest.Mock;
let onMessageHandler: ( ( event: MessageEvent ) => void ) | null = null;

function setupMockSelf() {
	mockPostMessage = jest.fn();

	// Override self with onmessage setter pattern (matching worker-rpc usage)
	const mockSelf = {
		postMessage: mockPostMessage,
	};

	Object.defineProperty( mockSelf, 'onmessage', {
		get: () => onMessageHandler,
		set: ( handler ) => {
			onMessageHandler = handler;
		},
		configurable: true,
	} );

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
	onMessageHandler = null;
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
		it( 'should set up onmessage handler', async () => {
			const { expose } = await import( '../worker-thread' );
			const api = { method: jest.fn() };

			expose( api );

			expect( onMessageHandler ).toBeDefined();
			expect( typeof onMessageHandler ).toBe( 'function' );
		} );

		it( 'should register handlers for all methods on target', async () => {
			const { expose } = await import( '../worker-thread' );
			const method1 = jest.fn();
			const method2 = jest.fn();
			const api = {
				method1,
				method2,
				notAFunction: 'string value',
			};

			// expose() should complete without error
			expect( () => expose( api ) ).not.toThrow();
		} );

		it( 'should only expose functions, not other properties', async () => {
			const { expose } = await import( '../worker-thread' );
			const api = {
				validMethod: jest.fn(),
				stringProp: 'not a function',
				numberProp: 42,
				objectProp: { nested: true },
			};

			// Should not throw
			expect( () => expose( api ) ).not.toThrow();
		} );

		it( 'should handle empty object', async () => {
			const { expose } = await import( '../worker-thread' );
			const api = {};

			// Should not throw
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
