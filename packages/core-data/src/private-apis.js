/**
 * Internal dependencies
 */
import { useEntityRecordsWithPermissions } from './hooks/use-entity-records';
import { RECEIVE_INTERMEDIATE_RESULTS } from './utils';
import {
	useActiveCollaborators,
	useResolvedSelection,
	useBroadcastSaveEvent,
} from './hooks/use-post-editor-awareness-state';
import { lock } from './lock-unlock';

export const privateApis = {};
lock( privateApis, {
	useEntityRecordsWithPermissions,
	RECEIVE_INTERMEDIATE_RESULTS,
	useActiveCollaborators,
	useResolvedSelection,
	useBroadcastSaveEvent,
} );
