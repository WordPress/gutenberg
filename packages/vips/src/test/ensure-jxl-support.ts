/**
 * Tests for `vipsEnsureJxlSupport`, the main-thread half of on-demand JXL.
 *
 * JXL support is worker-side state installed by an RPC, which makes it unlike
 * every other vips call in this module: it has to survive a worker recycle, and
 * it must not be permanently disabled by one failed download.
 */

const mockSetJxlWasm = jest.fn( () => Promise.resolve() );
const mockTerminate = jest.fn();

// One wrapped API object per worker, so a test can tell a recycled worker from
// a reused one by identity - exactly what the implementation keys off.
const mockWrap = jest.fn( () => ( {
	setJxlWasm: mockSetJxlWasm,
} ) );

jest.mock( '@wordpress/worker-threads', () => ( {
	wrap: ( ...args: unknown[] ) => mockWrap( ...( args as [] ) ),
	terminate: ( ...args: unknown[] ) => mockTerminate( ...( args as [] ) ),
} ) );

// worker-code.ts is generated during a full build and is gitignored, so it
// cannot be resolved from a unit test run.
// The specifier has to match the one vips-worker.ts imports, extension and
// all, or the virtual mock is not consulted and the resolve fails.
jest.mock( '../worker-code.ts', () => ( { workerCode: '' } ), {
	virtual: true,
} );

// Stands in for fetching the ~3 MB JXL chunk. Throwing from the factory is how
// a failed chunk load surfaces: the dynamic import rejects.
const mockJxlImport = jest.fn( () => ( {
	__esModule: true,
	default: new Uint8Array( [ 1, 2, 3, 4 ] ),
} ) );

beforeAll( () => {
	Object.assign( globalThis, {
		Worker: class {
			terminate() {}
		},
	} );
	URL.createObjectURL = jest.fn( () => 'blob:worker' );
	URL.revokeObjectURL = jest.fn();
} );

/**
 * Loads a fresh copy of the module with the JXL chunk import stubbed.
 *
 * The cached download promise and the record of which worker already has the
 * bytes are module-level state, so each test needs its own module instance.
 *
 * @return The module's exports.
 */
async function loadWorkerModule() {
	// A plain registry reset rather than isolateModules: the JXL chunk is
	// imported lazily from inside vipsEnsureJxlSupport, long after this
	// function returns, so it has to resolve against the same registry.
	jest.resetModules();
	jest.doMock( '@wordpress/vips/jxl-wasm', () => mockJxlImport() );
	return await import( '../vips-worker' );
}

describe( 'vipsEnsureJxlSupport', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockJxlImport.mockImplementation( () => ( {
			__esModule: true,
			default: new Uint8Array( [ 1, 2, 3, 4 ] ),
		} ) );
	} );

	it( 'downloads the chunk once and sends it to the worker', async () => {
		const { vipsEnsureJxlSupport } = await loadWorkerModule();

		await vipsEnsureJxlSupport();

		expect( mockJxlImport ).toHaveBeenCalledTimes( 1 );
		expect( mockSetJxlWasm ).toHaveBeenCalledTimes( 1 );

		// The RPC layer only treats a bare ArrayBuffer as transferable; a typed
		// array is walked key by key, which for ~3 MB means millions of
		// main-thread allocations per call.
		const [ sent ] = mockSetJxlWasm.mock.calls[ 0 ] as unknown as [
			unknown,
		];
		expect( sent ).toBeInstanceOf( ArrayBuffer );
		expect( ( sent as ArrayBuffer ).byteLength ).toBe( 4 );
	} );

	it( 'skips the RPC when the same worker already has the bytes', async () => {
		const { vipsEnsureJxlSupport } = await loadWorkerModule();

		await vipsEnsureJxlSupport();
		await vipsEnsureJxlSupport();

		expect( mockJxlImport ).toHaveBeenCalledTimes( 1 );
		expect( mockSetJxlWasm ).toHaveBeenCalledTimes( 1 );
	} );

	it( 're-sends the bytes after the worker is recycled', async () => {
		/*
		 * Regression test: the cached download used to be cleared on terminate
		 * and the RPC treated as a one-time cost. The upload queue recycles the
		 * vips worker every 50 operations, and an item can sit in prepareItem
		 * while that happens - so a JXL could reach a worker that had never
		 * been told about the JXL library, and fail to decode.
		 */
		const { vipsEnsureJxlSupport, terminateVipsWorker } =
			await loadWorkerModule();

		await vipsEnsureJxlSupport();
		terminateVipsWorker();
		await vipsEnsureJxlSupport();

		expect( mockSetJxlWasm ).toHaveBeenCalledTimes( 2 );
		// The bytes are already in memory; only the RPC needs repeating.
		expect( mockJxlImport ).toHaveBeenCalledTimes( 1 );

		// Each worker gets its own buffer, since the RPC transfers it away.
		const [ first ] = mockSetJxlWasm.mock.calls[ 0 ] as unknown as [
			ArrayBuffer,
		];
		const [ second ] = mockSetJxlWasm.mock.calls[ 1 ] as unknown as [
			ArrayBuffer,
		];
		expect( second ).not.toBe( first );
		expect( second.byteLength ).toBe( 4 );
	} );

	it( 'retries after a failed download instead of caching the failure', async () => {
		/*
		 * Regression test: the download promise was assigned unconditionally
		 * and never cleared, so a single transient network error fetching the
		 * ~3 MB chunk disabled JXL for the rest of the session.
		 */
		const { vipsEnsureJxlSupport } = await loadWorkerModule();

		mockJxlImport.mockImplementationOnce( () => {
			throw new Error( 'network error' );
		} );

		await expect( vipsEnsureJxlSupport() ).rejects.toThrow(
			'network error'
		);
		await expect( vipsEnsureJxlSupport() ).resolves.toBeUndefined();

		expect( mockJxlImport ).toHaveBeenCalledTimes( 2 );
		expect( mockSetJxlWasm ).toHaveBeenCalledTimes( 1 );
	} );
} );
