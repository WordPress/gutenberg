import { useEntityRecordsWithPermissions } from './hooks/use-entity-records';
import { RECEIVE_INTERMEDIATE_RESULTS } from './utils';
import {
	useActiveCollaborators,
	useResolvedSelection,
	useOnCollaboratorJoin,
	useOnCollaboratorLeave,
	useOnPostSave,
} from './hooks/use-post-editor-awareness-state';
import { getTemplateInfo } from './utils/get-template-info';
import { getTemplatePartIcon } from './utils/get-template-part-icon';
import {
	EntitiesSavedStatesExtensible,
	default as EntitiesSavedStates,
} from './components/entities-saved-states';
import { useIsDirty as useEntitiesSavedStatesIsDirty } from './components/entities-saved-states/hooks/use-is-dirty';
import { lock } from './lock-unlock';
import {
	CRDT_AUTOSAVE_SNAPSHOT_KEY,
	entityContainsSnapshot,
	getEntitySnapshot,
	retrySyncConnection,
} from './sync';
import {
	SelectionType,
	SelectionDirection,
} from './utils/crdt-user-selections';

const lockedApis = {
	EntitiesSavedStates,
	EntitiesSavedStatesExtensible,
	getTemplateInfo,
	getTemplatePartIcon,
	useEntitiesSavedStatesIsDirty,
	useEntityRecordsWithPermissions,
	RECEIVE_INTERMEDIATE_RESULTS,
	CRDT_AUTOSAVE_SNAPSHOT_KEY,
	entityContainsSnapshot,
	getEntitySnapshot,
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
