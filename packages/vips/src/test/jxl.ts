/**
 * Tests for on-demand JPEG XL support.
 *
 * JXL is the only format whose libvips dynamic library is not bundled with the
 * worker: the ~3 MB `vips-jxl.wasm` arrives later, over RPC, and forces vips to
 * be re-initialized. These tests cover that re-initialization, which is the
 * only place in the package where a live vips instance is thrown away.
 */

const mockWriteToBuffer = jest.fn( () => ( { buffer: '' } ) );
const mockShutdown = jest.fn();

class MockImage {
	width = 100;
	height = 100;
	pageHeight = 100;
	writeToBuffer = mockWriteToBuffer;
	getInt = jest.fn( () => 0 );
	onProgress: ( () => void ) | undefined;
	kill = false;
}

const mockNewFromBuffer = jest.fn( () => new MockImage() );
const mockVipsFactory = jest.fn( () => ( {
	Image: { newFromBuffer: mockNewFromBuffer },
	Cache: { max: jest.fn() },
	shutdown: mockShutdown,
} ) );

jest.mock(
	'wasm-vips',
	() =>
		( ...args: unknown[] ) =>
			mockVipsFactory( ...( args as [] ) )
);

/**
 * Loads a fresh copy of the module.
 *
 * `vipsPromise`, `jxlWasmBytes` and `vipsInitializedWithJxl` are module-level
 * state, and every assertion here is about how one call leaves that state for
 * the next, so each test needs its own module instance.
 *
 * @return The module's exports.
 */
async function loadVips() {
	let vips: typeof import('../');
	await jest.isolateModulesAsync( async () => {
		vips = await import( '../' );
	} );
	// @ts-expect-error - assigned inside the isolated module callback.
	return vips;
}

/**
 * Returns the `dynamicLibraries` passed to each vips initialization so far.
 *
 * @return One entry per initialization, in call order.
 */
function initCalls(): string[][] {
	return mockVipsFactory.mock.calls.map(
		( call ) =>
			( call as unknown as [ { dynamicLibraries: string[] } ] )[ 0 ]
				.dynamicLibraries
	);
}

/**
 * Runs any operation that needs a vips instance.
 *
 * @param vips The module under test.
 */
async function runOperation( vips: typeof import('../') ) {
	const buffer = await new File( [ 'x' ], 'x.jpg', {
		type: 'image/jpeg',
	} ).arrayBuffer();
	await vips.convertImageFormat(
		'itemId',
		buffer,
		'image/jpeg',
		'image/webp'
	);
}

describe( 'JPEG XL support', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'omits the JXL library until the bytes arrive', async () => {
		const vips = await loadVips();

		await runOperation( vips );

		expect( initCalls() ).toEqual( [ [ 'vips-heif.wasm' ] ] );
	} );

	it( 're-initializes with the JXL library and reclaims the stale instance', async () => {
		const vips = await loadVips();

		// An instance already exists, built without JXL.
		await runOperation( vips );
		expect( initCalls() ).toHaveLength( 1 );

		vips.setJxlWasm( new ArrayBuffer( 8 ) );
		await runOperation( vips );

		expect( initCalls() ).toEqual( [
			[ 'vips-heif.wasm' ],
			[ 'vips-heif.wasm', 'vips-jxl.wasm' ],
		] );
		// The discarded instance holds a large WASM heap; dropping the promise
		// without shutting it down would strand it for the worker's lifetime.
		expect( mockShutdown ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'reuses the JXL-enabled instance instead of rebuilding it', async () => {
		const vips = await loadVips();

		vips.setJxlWasm( new ArrayBuffer( 8 ) );
		await runOperation( vips );
		await runOperation( vips );

		expect( initCalls() ).toEqual( [
			[ 'vips-heif.wasm', 'vips-jxl.wasm' ],
		] );
		expect( mockShutdown ).not.toHaveBeenCalled();
	} );

	it( 'recovers when the JXL-enabled initialization fails', async () => {
		/*
		 * Regression test: the "initialized with JXL" flag used to be set while
		 * building the options, before the init resolved. A rejected init then
		 * left `vipsPromise` holding a permanently rejected promise that the
		 * reset guard - which requires the flag to be off - could no longer
		 * clear, so every later operation in the worker failed, including plain
		 * JPEG work for unrelated queue items.
		 */
		const vips = await loadVips();

		// wasm-vips reports a failed init by rejecting, not by throwing.
		mockVipsFactory.mockImplementationOnce(
			() =>
				Promise.reject(
					new Error( 'failed to load vips-jxl.wasm' )
				) as never
		);

		vips.setJxlWasm( new ArrayBuffer( 8 ) );
		await expect( runOperation( vips ) ).rejects.toThrow(
			'failed to load vips-jxl.wasm'
		);

		// The next call must retry rather than replay the failure.
		await expect( runOperation( vips ) ).resolves.not.toThrow();
		expect( initCalls() ).toEqual( [
			[ 'vips-heif.wasm', 'vips-jxl.wasm' ],
			[ 'vips-heif.wasm', 'vips-jxl.wasm' ],
		] );
	} );
} );
