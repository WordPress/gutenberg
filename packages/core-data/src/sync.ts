/**
 * WordPress dependencies
 */
import { privateApis as syncPrivateApis } from '@wordpress/sync';

/**
 * Internal dependencies
 */
import { unlock } from './lock-unlock';

const { CRDT_RECORD_MAP_KEY, LOCAL_EDITOR_ORIGIN, createSyncManager } =
	unlock( syncPrivateApis );

export { CRDT_RECORD_MAP_KEY, LOCAL_EDITOR_ORIGIN };
export const syncManager = createSyncManager();
