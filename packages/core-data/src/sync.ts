/**
 * WordPress dependencies
 */
import {
	CRDT_DOC_META_PERSISTENCE_KEY,
	CRDT_RECORD_MAP_KEY,
	LOCAL_EDITOR_ORIGIN,
	privateApis as syncPrivateApis,
	WORDPRESS_META_KEY_FOR_CRDT_DOC_PERSISTENCE,
	type SyncManager,
	type SyncPrivateApis,
	type Y as YType,
} from '@wordpress/sync';

/**
 * Internal dependencies
 */
import { unlock } from './lock-unlock';

const { AwarenessState, Delta, Y, createSyncManager } =
	unlock< SyncPrivateApis >( syncPrivateApis );

let syncManager: SyncManager;

export function getSyncManager(): SyncManager | undefined {
	if ( syncManager ) {
		return syncManager;
	}

	syncManager = createSyncManager();

	return syncManager;
}

export type * from '@wordpress/sync';

export {
	AwarenessState,
	CRDT_DOC_META_PERSISTENCE_KEY,
	CRDT_RECORD_MAP_KEY,
	Delta,
	LOCAL_EDITOR_ORIGIN,
	WORDPRESS_META_KEY_FOR_CRDT_DOC_PERSISTENCE,
	Y,
	type YType,
};
