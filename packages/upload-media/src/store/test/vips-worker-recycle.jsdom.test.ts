/**
 * Runs a gallery-sized batch through the real queue and the real recycle
 * budget, with only the vips worker itself stubbed.
 */
import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	vi,
	type MockInstance,
} from 'vitest';
import { createRegistry } from '@wordpress/data';
// Vitest aliases the worker entry point to the repository's worker-code stub.
import * as vipsWorker from '@wordpress/vips/worker';
import { store as uploadStore } from '..';
import { OperationType } from '../types';
import { unlock } from '../../lock-unlock';

vi.mock(
	import( '@wordpress/blob' ),
	() =>
		( {
			createBlobURL: vi.fn( () => 'blob:foo' ),
			isBlobURL: vi.fn( ( str: string ) => str.startsWith( 'blob:' ) ),
			revokeBlobURL: vi.fn(),
		} ) as unknown as typeof import( '@wordpress/blob' )
);

const mockResizeImage = vi.mocked( vipsWorker.vipsResizeImage );
const mockTerminateVipsWorker = vi.mocked( vipsWorker.terminateVipsWorker );

const MB = 1024 * 1024;
const RECYCLE_BUDGET = 64 * MB;
const FILE_SIZE = 14 * MB;
const FILE_COUNT = 12;
const SUB_SIZE_COUNT = 7;

/**
 * Creates a small file that reports the size of a 24 MP camera JPEG.
 *
 * @param name File name.
 * @return File.
 */
function createLargeJpeg( name: string ) {
	const file = new File( [ 'foo' ], name, { type: 'image/jpeg' } );
	Object.defineProperty( file, 'size', { value: FILE_SIZE } );
	return file;
}

describe( 'vips worker recycling across a batch', () => {
	// Resizes started in each worker, and how many are running right now.
	let resizesPerWorker: number[];
	let runningResizes: number;
	let terminatedWhileBusy: boolean;
	let debugSpy: MockInstance;

	beforeEach( () => {
		resizesPerWorker = [ 0 ];
		runningResizes = 0;
		terminatedWhileBusy = false;

		// The queue logs every operation when SCRIPT_DEBUG is on.
		debugSpy = vi.spyOn( console, 'debug' ).mockImplementation( () => {} );

		mockResizeImage.mockImplementation( async () => {
			resizesPerWorker[ resizesPerWorker.length - 1 ]++;
			runningResizes++;
			await new Promise( ( resolve ) => setTimeout( resolve, 0 ) );
			runningResizes--;
			return {
				buffer: new ArrayBuffer( 8 ),
				width: 150,
				height: 100,
				originalWidth: 6000,
				originalHeight: 4000,
			};
		} );
		mockTerminateVipsWorker.mockImplementation( () => {
			terminatedWhileBusy ||= runningResizes > 0;
			resizesPerWorker.push( 0 );
		} );
	} );

	afterEach( () => {
		debugSpy.mockRestore();
	} );

	it( 'resizes every sub-size of twelve large JPEGs without overfilling a worker', async () => {
		const registry = createRegistry();
		registry.register( uploadStore );
		const { addItem } = unlock( registry.dispatch( uploadStore ) );
		const { getSettings } = unlock( registry.select( uploadStore ) );

		const onSuccess = vi.fn();
		const onError = vi.fn();
		for ( let i = 0; i < FILE_COUNT; i++ ) {
			const file = createLargeJpeg( `photo-${ i }.jpg` );
			for ( let j = 0; j < SUB_SIZE_COUNT; j++ ) {
				addItem( {
					file,
					onSuccess,
					onError,
					operations: [
						[
							OperationType.ResizeCrop,
							{ resize: { width: 150, height: 100 } },
						],
					],
				} );
			}
		}

		await vi.waitFor( () => {
			expect( registry.select( uploadStore ).getItems() ).toHaveLength(
				0
			);
		} );

		expect( onError ).not.toHaveBeenCalled();
		expect( mockResizeImage ).toHaveBeenCalledTimes(
			FILE_COUNT * SUB_SIZE_COUNT
		);
		expect( terminatedWhileBusy ).toBe( false );

		// A worker may overshoot the budget only by the resizes that were
		// already running when it was spent.
		const maxBytesPerWorker =
			RECYCLE_BUDGET +
			getSettings().maxConcurrentImageProcessing * FILE_SIZE;
		for ( const resizes of resizesPerWorker ) {
			expect( resizes * FILE_SIZE ).toBeLessThanOrEqual(
				maxBytesPerWorker
			);
		}
	} );
} );
