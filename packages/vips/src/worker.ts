/**
 * Worker entry point for vips image processing.
 *
 * This file exposes all vips functions to be available in the Web Worker
 * context. The @wordpress/worker-threads library handles the RPC
 * communication with the main thread.
 */

/**
 * External dependencies
 */
import { expose } from '@wordpress/worker-threads';

/**
 * Internal dependencies
 */
import {
	cancelOperations,
	convertImageFormat,
	compressImage,
	resizeImage,
	rotateImage,
	hasTransparency,
} from './index';

/**
 * The API object that exposes all vips functions to the main thread.
 */
const api = {
	cancelOperations,
	convertImageFormat,
	compressImage,
	resizeImage,
	rotateImage,
	hasTransparency,
};

expose( api );

/**
 * Type export for use with wrap() on the main thread.
 */
export type WorkerAPI = typeof api;
