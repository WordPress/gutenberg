/**
 * External dependencies
 */
import * as Y from 'yjs';

/**
 * Internal dependencies
 */
import { AwarenessState } from './awareness/awareness-state';
import { lock } from './lock-unlock';
import { createSyncManager } from './manager';
import { default as Delta } from './quill-delta/Delta';

/**
 * Private APIs for the sync package.
 *
 * This contains an export of our instance of Yjs in order to address:
 * https://github.com/yjs/yjs/issues/438
 */
export const privateApis = {};

const privateApiValues = {
	AwarenessState,
	createSyncManager,
	Delta,
	Y,
};

export type SyncPrivateApis = typeof privateApiValues;

/**
 * Lock the private APIs so only authorized modules can access them
 */
lock( privateApis, privateApiValues );
