/**
 * Internal dependencies
 */
import { useEntityRecordsWithPermissions } from './hooks/use-entity-records';
import { RECEIVE_INTERMEDIATE_RESULTS } from './utils';
import {
	useActiveCollaborators,
	useResolvedSelection,
	useOnCollaboratorJoin,
	useOnCollaboratorLeave,
	useOnPostSave,
} from './hooks/use-post-editor-awareness-state';
import { lock } from './lock-unlock';
import { retrySyncConnection } from './sync';

export const privateApis = {};
lock( privateApis, {
	useEntityRecordsWithPermissions,
	RECEIVE_INTERMEDIATE_RESULTS,
	retrySyncConnection,
	useActiveCollaborators,
	useResolvedSelection,
	useOnCollaboratorJoin,
	useOnCollaboratorLeave,
	useOnPostSave,
} );
