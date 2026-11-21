/**
 * Worker entry point for vips image processing.
 *
 * This file exposes all vips functions to be available in the Web Worker
 * context. The `@wordpress/worker-threads` library handles the RPC
 * communication with the main thread.
 */
import { expose } from '@wordpress/worker-threads';
import {
	cancelOperations,
	convertImageFormat,
	compressImage,
	resizeImage,
	rotateImage,
	hasTransparency,
	getUltraHdrInfo,
	encodePixelsAsJpeg,
} from './index.ts';

/**
 * Set once wasm-vips aborts or traps, for example when its memory runs out.
 * Its runtime is then unusable, so every later call here would fail too.
 */
let crashed = false;

/**
 * Wraps a vips function so that a crash inside it is recorded.
 *
 * @param fn Vips function.
 * @return The wrapped function.
 */
function recordCrash< T extends ( ...args: never[] ) => Promise< unknown > >(
	fn: T
): T {
	return ( async ( ...args ) => {
		try {
			return await fn( ...args );
		} catch ( error ) {
			if ( error instanceof WebAssembly.RuntimeError ) {
				crashed = true;
			}
			throw error;
		}
	} ) as T;
}

/**
 * The API object that exposes all vips functions to the main thread.
 */
const api = {
	cancelOperations,
	convertImageFormat: recordCrash( convertImageFormat ),
	compressImage: recordCrash( compressImage ),
	resizeImage: recordCrash( resizeImage ),
	rotateImage: recordCrash( rotateImage ),
	hasTransparency: recordCrash( hasTransparency ),
	getUltraHdrInfo: recordCrash( getUltraHdrInfo ),
	encodePixelsAsJpeg: recordCrash( encodePixelsAsJpeg ),
	hasCrashed: async () => crashed,
};

expose( api );

/**
 * Type export for use with wrap() on the main thread.
 */
export type WorkerAPI = typeof api;
