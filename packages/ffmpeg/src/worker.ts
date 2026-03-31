/**
 * Worker entry point for FFmpeg video processing.
 *
 * This file exposes all FFmpeg functions to be available in the Web Worker
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
import { cancelOperations, convertGifToVideo } from './index';

/**
 * The API object that exposes all FFmpeg functions to the main thread.
 */
const api = {
	cancelOperations,
	convertGifToVideo,
};

expose( api );

/**
 * Type export for use with wrap() on the main thread.
 */
export type WorkerAPI = typeof api;
