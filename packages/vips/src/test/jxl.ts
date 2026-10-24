import { beforeEach, describe, expect, it, vi } from 'vitest';
/**
 * Tests for on-demand JPEG XL support.
 *
 * JXL is the only format whose libvips dynamic library is not bundled with the
 * worker: the ~3 MB `vips-jxl.wasm` arrives later, over RPC, and forces vips to
 * be re-initialized. These tests cover that re-initialization, which is the
 * only place in the package where a live vips instance is thrown away.
 */

const mockWriteToBuffer = vi.fn( () => ( { buffer: '' } ) );
const mockShutdown = vi.fn();

class MockImage {
	width = 100;
	height = 100;
	pageHeight = 100;
	writeToBuffer = mockWriteToBuffer;
	getInt = vi.fn( () => 0 );
	onProgress: ( () => void ) | undefined;
	kill = false;
}

const mockNewFromBuffer = vi.fn( () => new MockImage() );
const mockVipsFactory = vi.fn( () => ( {
	Image: { newFromBuffer: mockNewFromBuffer },
	Cache: { max: vi.fn() },
	shutdown: mockShutdown,
} ) );

vi.mock(
	import( 'wasm-vips' ),
	() =>
		( {
			default: ( ...args: unknown[] ) =>
				mockVipsFactory( ...( args as [] ) ),
		} ) as unknown as typeof import( 'wasm-vips' )
);

/**
 * Loads a fresh copy of the module.
 *
 * `vipsPromise`, `jxlWasmBytes` and `vipsPromiseHasJxl` are module-level
 * state, and every assertion here is about how one call leaves that state for
 * the next, so each test needs its own module instance.
 *
 * @return The module's exports.
 */
async function loadVips() {
	// Vitest has no isolateModules; resetting the registry gives the next
	// import its own module instance, which is what these tests need.
	vi.resetModules();
	return await import( '../' );
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
async function runOperation( vips: typeof import( '../' ) ) {
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

/**
 * Runs an operation that writes JXL.
 *
 * @param vips The module under test.
 */
async function runJxlOperation( vips: typeof import( '../' ) ) {
	const buffer = await new File( [ 'x' ], 'x.jpg', {
		type: 'image/jpeg',
	} ).arrayBuffer();
	await vips.convertImageFormat(
		'itemId',
		buffer,
		'image/jpeg',
		'image/jxl'
	);
}

/**
 * Builds a vips instance whose init the test resolves by hand.
 *
 * @return The instance, and a function resolving its init.
 */
function deferredInstance() {
	let resolveInit: () => void = () => {};
	const instance = {
		Image: {
			newFromBuffer: vi.fn( () => new MockImage() ),
			newFromMemory: vi.fn( () => ( {
				extractBand: () => ( {
					copy: () => ( {
						jpegsaveBuffer: () => ( { buffer: '' } ),
					} ),
				} ),
			} ) ),
		},
		Interpretation: { srgb: 'srgb' },
		BandFormat: { uchar: 'uchar' },
		Cache: { max: vi.fn() },
		shutdown: vi.fn(),
	};
	mockVipsFactory.mockImplementationOnce(
		() =>
			new Promise( ( resolve ) => {
				resolveInit = () => resolve( instance );
			} ) as never
	);
	return { instance, resolveInit: () => resolveInit() };
}

describe( 'JPEG XL support', () => {
	beforeEach( () => {
		vi.clearAllMocks();
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
		await runJxlOperation( vips );

		expect( initCalls() ).toEqual( [
			[ 'vips-heif.wasm' ],
			[ 'vips-heif.wasm', 'vips-jxl.wasm' ],
		] );
		// The discarded instance holds a large WASM heap; dropping the promise
		// without shutting it down would strand it for the worker's lifetime.
		expect( mockShutdown ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'keeps using a plain instance for work that does not need JXL', async () => {
		const vips = await loadVips();

		await runOperation( vips );
		vips.setJxlWasm( new ArrayBuffer( 8 ) );
		await runOperation( vips );

		expect( initCalls() ).toEqual( [ [ 'vips-heif.wasm' ] ] );
		expect( mockShutdown ).not.toHaveBeenCalled();
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
		await expect( runJxlOperation( vips ) ).rejects.toThrow(
			'failed to load vips-jxl.wasm'
		);

		// Work that does not need JXL must not keep hitting the broken
		// library, and JXL work must retry it rather than replay the failure.
		await expect( runOperation( vips ) ).resolves.not.toThrow();
		await expect( runJxlOperation( vips ) ).resolves.not.toThrow();
		expect( initCalls() ).toEqual( [
			[ 'vips-heif.wasm', 'vips-jxl.wasm' ],
			[ 'vips-heif.wasm' ],
			[ 'vips-heif.wasm', 'vips-jxl.wasm' ],
		] );
	} );

	it( 'shuts a retired instance down without waiting for the new one to go idle', async () => {
		const vips = await loadVips();

		await runOperation( vips );
		vips.setJxlWasm( new ArrayBuffer( 8 ) );

		// The JXL instance stays busy while it is still starting.
		const { resolveInit } = deferredInstance();
		const jxlOperation = runJxlOperation( vips );

		await vi.waitFor( () =>
			expect( mockShutdown ).toHaveBeenCalledTimes( 1 )
		);

		resolveInit();
		await jxlOperation;
	} );

	it( 'keeps a retired instance alive while a JPEG encode uses it', async () => {
		const vips = await loadVips();
		const { instance, resolveInit } = deferredInstance();

		const encode = vips.encodePixelsAsJpeg(
			'itemId',
			new ArrayBuffer( 16 ),
			2,
			2
		);
		await vi.waitFor( () => expect( initCalls() ).toHaveLength( 1 ) );

		vips.setJxlWasm( new ArrayBuffer( 8 ) );
		const jxlOperation = runJxlOperation( vips );
		await vi.waitFor( () => expect( initCalls() ).toHaveLength( 2 ) );

		expect( instance.shutdown ).not.toHaveBeenCalled();

		resolveInit();
		await Promise.all( [ encode, jxlOperation ] );

		await vi.waitFor( () =>
			expect( instance.shutdown ).toHaveBeenCalledTimes( 1 )
		);
		expect(
			instance.shutdown.mock.invocationCallOrder[ 0 ]
		).toBeGreaterThan(
			instance.Image.newFromMemory.mock.invocationCallOrder[ 0 ]
		);
	} );
	it( 'shares a pending JXL-enabled init between concurrent operations', async () => {
		/*
		 * Regression test: the JXL flag used to flip only once the init
		 * resolved, so a second JXL operation arriving mid-init took the
		 * pending JXL instance for a stale one and shut it down under the
		 * first operation.
		 */
		const vips = await loadVips();
		vips.setJxlWasm( new ArrayBuffer( 8 ) );

		await Promise.all( [ runOperation( vips ), runOperation( vips ) ] );

		expect( initCalls() ).toEqual( [
			[ 'vips-heif.wasm', 'vips-jxl.wasm' ],
		] );
		expect( mockShutdown ).not.toHaveBeenCalled();
	} );

	it( 'keeps a retired instance alive until the operations using it finish', async () => {
		const vips = await loadVips();

		// Hold the first, JXL-less init open so an operation is still waiting
		// on it when the JXL bytes arrive.
		let resolveFirstInit: () => void = () => {};
		const firstInstance = {
			Image: { newFromBuffer: vi.fn( () => new MockImage() ) },
			Cache: { max: vi.fn() },
			shutdown: vi.fn(),
		};
		mockVipsFactory.mockImplementationOnce(
			() =>
				new Promise( ( resolve ) => {
					resolveFirstInit = () => resolve( firstInstance );
				} ) as never
		);

		const plainOperation = runOperation( vips );
		await vi.waitFor( () => expect( initCalls() ).toHaveLength( 1 ) );

		vips.setJxlWasm( new ArrayBuffer( 8 ) );
		const jxlOperation = runJxlOperation( vips );

		resolveFirstInit();
		await Promise.all( [ plainOperation, jxlOperation ] );

		expect( initCalls() ).toEqual( [
			[ 'vips-heif.wasm' ],
			[ 'vips-heif.wasm', 'vips-jxl.wasm' ],
		] );
		expect( firstInstance.Image.newFromBuffer ).toHaveBeenCalledTimes( 1 );
		await vi.waitFor( () =>
			expect( firstInstance.shutdown ).toHaveBeenCalledTimes( 1 )
		);
		// Shut down only after the plain operation was done with it.
		expect(
			firstInstance.shutdown.mock.invocationCallOrder[ 0 ]
		).toBeGreaterThan(
			firstInstance.Image.newFromBuffer.mock.invocationCallOrder[ 0 ]
		);
		expect( mockShutdown ).not.toHaveBeenCalled();
	} );
} );
