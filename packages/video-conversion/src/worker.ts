/**
 * Worker entry point for video conversion.
 *
 * This file exposes the video conversion functions in the Web Worker
 * context. The @wordpress/worker-threads library handles the RPC
 * communication with the main thread.
 */
import { expose } from '@wordpress/worker-threads';
import { cancelOperations, convertGifToVideo } from './index.ts';

/**
 * The API object that exposes the video conversion functions to the main thread.
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
