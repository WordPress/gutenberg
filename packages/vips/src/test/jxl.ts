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
 * The current instance and the JXL bytes are module-level state, and every
 * assertion here is about how one call leaves that state for the next, so each
 * test needs its own module instance.
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

describe( 'JPEG XL support', () => {
	beforeEach( () => {
		vi.clearAllMocks();
	} );

	it( 're-initializes with the JXL library once it is needed, and reclaims the stale instance', async () => {
		const vips = await loadVips();

		// An instance already exists, built without JXL.
		await runOperation( vips );
		expect( initCalls() ).toEqual( [ [ 'vips-heif.wasm' ] ] );

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

	it( 'does not replace an instance for work it can already do', async () => {
		const vips = await loadVips();

		// A plain instance keeps serving work that does not need JXL.
		await runOperation( vips );
		vips.setJxlWasm( new ArrayBuffer( 8 ) );
		await runOperation( vips );
		expect( initCalls() ).toHaveLength( 1 );

		// And a JXL-enabled one serves everything.
		await runJxlOperation( vips );
		await runOperation( vips );
		await runJxlOperation( vips );
		expect( initCalls() ).toHaveLength( 2 );
		expect( mockShutdown ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'recovers when the JXL-enabled initialization fails', async () => {
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

	it( 'shares a pending JXL-enabled init between concurrent operations', async () => {
		// A second operation arriving mid-init must not take the pending
		// instance for a stale one and shut it down under the first.
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
