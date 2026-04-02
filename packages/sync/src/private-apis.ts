/**
 * Internal dependencies
 */
import {
	CRDT_DOC_META_PERSISTENCE_KEY,
	CRDT_RECORD_MAP_KEY,
	LOCAL_EDITOR_ORIGIN,
	LOCAL_EDITOR_PASSTHROUGH_ORIGIN,
	LOCAL_UNDO_IGNORED_ORIGIN,
} from './config';
import { ConnectionErrorCode } from './errors';
import { lock } from './lock-unlock';
import { createSyncManager } from './manager';
import { pollingManager } from './providers/http-polling/polling-manager';
import { diffStringsToLib0Delta } from './cursor-diff';
import { yTextToSuggestionHTML, hasSuggestions } from './suggestion-html';

export const privateApis = {};

lock( privateApis, {
	ConnectionErrorCode,
	createSyncManager,
	diffStringsToLib0Delta,
	hasSuggestions,
	yTextToSuggestionHTML,
	CRDT_DOC_META_PERSISTENCE_KEY,
	CRDT_RECORD_MAP_KEY,
	LOCAL_EDITOR_ORIGIN,
	LOCAL_EDITOR_PASSTHROUGH_ORIGIN,
	LOCAL_UNDO_IGNORED_ORIGIN,
	retrySyncConnection: () => pollingManager.retryNow(),
} );
