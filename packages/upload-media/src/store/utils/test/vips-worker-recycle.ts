import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockTerminateVipsWorker = vi.fn();
let finishConvert: ( buffer: ArrayBuffer ) => void = () => {};
const mockConvertImageFormat = vi.fn(
	() =>
		new Promise< ArrayBuffer >( ( resolve ) => {
			finishConvert = resolve;
		} )
);

vi.mock(
	import( '@wordpress/vips/worker' ),
	() =>
		( {
			terminateVipsWorker: mockTerminateVipsWorker,
			vipsEnsureJxlSupport: vi.fn( () => Promise.resolve() ),
			vipsConvertImageFormat: mockConvertImageFormat,
		} ) as unknown as typeof import( '@wordpress/vips/worker' )
);

/**
 * Loads a fresh copy of the module with the vips worker module already loaded.
 *
 * The recycle budget and the held-operation count are module-level state, and
 * terminating is a no-op until the worker module has been loaded.
 *
 * @return The module's exports.
 */
async function loadUtils() {
	vi.resetModules();
	const utils = await import( '..' );
	await utils.vipsEnsureJxlSupport();
	return utils;
}

/**
 * Records as many completed operations as it takes to reach the recycle budget.
 *
 * @param utils The module under test.
 */
function exhaustRecycleBudget(
	utils: Awaited< ReturnType< typeof loadUtils > >
) {
	for ( let i = 0; i < 50; i++ ) {
		utils.maybeRecycleVipsWorker( 0 );
	}
}

describe( 'maybeRecycleVipsWorker', () => {
	beforeEach( () => {
		vi.clearAllMocks();
	} );

	it( 'recycles the worker once the budget is spent and nothing is in flight', async () => {
		const utils = await loadUtils();

		exhaustRecycleBudget( utils );

		expect( mockTerminateVipsWorker ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'defers recycling while a held vips operation is in flight', async () => {
		const utils = await loadUtils();

		let finishDecode: () => void = () => {};
		const held = utils.withVipsWorkerHeld(
			() =>
				new Promise< void >( ( resolve ) => {
					finishDecode = resolve;
				} )
		);

		exhaustRecycleBudget( utils );
		expect( mockTerminateVipsWorker ).not.toHaveBeenCalled();

		finishDecode();
		await held;

		// The spent budget carries over to the next completed operation.
		utils.maybeRecycleVipsWorker( 0 );
		expect( mockTerminateVipsWorker ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'stops holding the worker when the held operation fails', async () => {
		const utils = await loadUtils();

		await expect(
			utils.withVipsWorkerHeld( () =>
				Promise.reject( new Error( 'decode failed' ) )
			)
		).rejects.toThrow( 'decode failed' );

		exhaustRecycleBudget( utils );
		expect( mockTerminateVipsWorker ).toHaveBeenCalledTimes( 1 );
	} );
	it( 'defers recycling while a transcode is in flight', async () => {
		const utils = await loadUtils();

		const png = new File( [ 'x' ], 'photo.png', { type: 'image/png' } );
		const transcode = utils.vipsConvertImageFormat(
			'id',
			png,
			'image/webp'
		);
		await vi.waitFor( () =>
			expect( mockConvertImageFormat ).toHaveBeenCalled()
		);

		exhaustRecycleBudget( utils );
		expect( mockTerminateVipsWorker ).not.toHaveBeenCalled();

		finishConvert( new ArrayBuffer( 1 ) );
		await transcode;

		utils.maybeRecycleVipsWorker( 0 );
		expect( mockTerminateVipsWorker ).toHaveBeenCalledTimes( 1 );
	} );
} );
