/**
 * Tests for error propagation across the worker RPC boundary.
 *
 * The RPC reply only carries an error *message* string. A worker method that
 * throws a non-`Error` value (e.g. a `WebAssembly.Exception` from a wasm
 * module) or an `Error` with an empty message would otherwise produce a reply
 * that the main thread treats as a successful `undefined` result instead of
 * a rejection. See https://github.com/WordPress/gutenberg/issues/80259.
 */

// Store the original self.
const originalSelf = globalThis.self;

// Mock self for worker context.
let mockPostMessage: jest.Mock;
let messageListeners: Array< ( event: MessageEvent ) => void > = [];

function setupMockSelf() {
	mockPostMessage = jest.fn();
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

/**
 * Sends an RPC "apply" message for the given method to the exposed worker
 * API and returns the reply message posted back by the worker.
 *
 * @param method Method name to call.
 * @return The reply message.
 */
async function callExposedMethod(
	method: string
): Promise< { id: string; data?: unknown; error?: string } > {
	const messageId = `test-${ method }`;
	const applyMessage = {
		type: 'apply',
		sender: 'injector',
		id: messageId,
		path: [ method ],
		args: [],
		callbackIds: [],
		meta: {},
		namespace: '__wordpress_worker__',
		timeStamp: 1234567891,
	};

	for ( const listener of [ ...messageListeners ] ) {
		listener( { data: applyMessage } as MessageEvent );
	}

	// Wait for the async handler to post the reply.
	for ( let i = 0; i < 10; i++ ) {
		await new Promise( ( resolve ) => {
			setTimeout( resolve, 0 );
		} );
		const reply = mockPostMessage.mock.calls
			.map( ( call ) => call[ 0 ] )
			.find( ( message ) => message?.id === messageId );
		if ( reply ) {
			return reply;
		}
	}

	throw new Error( `No reply received for method "${ method }"` );
}

describe( 'worker-thread error propagation', () => {
	beforeEach( () => {
		setupMockSelf();
		jest.resetModules();
	} );

	afterEach( () => {
		restoreSelf();
	} );

	it( 'propagates the message of a thrown Error', async () => {
		const { expose } = await import( '../worker-thread' );
		expose( {
			fails: async () => {
				throw new Error( 'boom' );
			},
		} );

		const reply = await callExposedMethod( 'fails' );

		expect( reply.error ).toBe( 'boom' );
	} );

	it( 'rejects with a non-empty message when a non-Error value is thrown', async () => {
		const { expose } = await import( '../worker-thread' );

		// Mimics a WebAssembly.Exception: an object that is not an Error
		// and has no message property.
		class FakeWasmException {}

		expose( {
			fails: async () => {
				throw new FakeWasmException();
			},
		} );

		const reply = await callExposedMethod( 'fails' );

		expect( typeof reply.error ).toBe( 'string' );
		expect( reply.error ).not.toHaveLength( 0 );
	} );

	it( 'rejects with a non-empty message when an Error with an empty message is thrown', async () => {
		const { expose } = await import( '../worker-thread' );
		expose( {
			fails: async () => {
				throw new Error();
			},
		} );

		const reply = await callExposedMethod( 'fails' );

		expect( typeof reply.error ).toBe( 'string' );
		expect( reply.error ).not.toHaveLength( 0 );
	} );

	it( 'rejects when a string is thrown', async () => {
		const { expose } = await import( '../worker-thread' );
		expose( {
			fails: async () => {
				throw 'string failure';
			},
		} );

		const reply = await callExposedMethod( 'fails' );

		expect( reply.error ).toContain( 'string failure' );
	} );

	it( 'does not affect successful results', async () => {
		const { expose } = await import( '../worker-thread' );
		expose( {
			succeeds: async () => 'result',
		} );

		const reply = await callExposedMethod( 'succeeds' );

		expect( reply.error ).toBeUndefined();
		expect( reply.data ).toBe( 'result' );
	} );
} );
