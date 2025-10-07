/**
 * Internal dependencies
 */
import { CRDT_RECORD_MAP_KEY, LOCAL_EDITOR_ORIGIN } from './config';
import { createSyncManager } from './manager';
import { lock } from './lock-unlock';

/**
 * Private @wordpress/sync APIs
 */
export const privateApis = {};

lock( privateApis, {
	CRDT_RECORD_MAP_KEY,
	LOCAL_EDITOR_ORIGIN,
	createSyncManager,
} );
