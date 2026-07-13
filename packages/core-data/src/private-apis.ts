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
import {
	SelectionType,
	SelectionDirection,
} from './utils/crdt-user-selections';

const lockedApis = {
	useEntityRecordsWithPermissions,
	RECEIVE_INTERMEDIATE_RESULTS,
	retrySyncConnection,
	useActiveCollaborators,
	useResolvedSelection,
	useOnCollaboratorJoin,
	useOnCollaboratorLeave,
	useOnPostSave,
	SelectionType,
	SelectionDirection,
};

export type CoreDataPrivateApis = typeof lockedApis;

export const privateApis = {};
lock( privateApis, lockedApis );
