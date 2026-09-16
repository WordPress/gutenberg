import { useEntityRecordsWithPermissions } from './hooks/use-entity-records';
import { RECEIVE_INTERMEDIATE_RESULTS } from './utils';
import { getTemplateInfo } from './utils/get-template-info';
import { getTemplatePartIcon } from './utils/get-template-part-icon';
import {
	EntitiesSavedStatesExtensible,
	default as EntitiesSavedStates,
} from './components/entities-saved-states';
import { useIsDirty as useEntitiesSavedStatesIsDirty } from './components/entities-saved-states/hooks/use-is-dirty';
import { lock } from './lock-unlock';
import { getEntitySyncManager, registerEntitySyncManager } from './entity-sync';

const lockedApis = {
	EntitiesSavedStates,
	EntitiesSavedStatesExtensible,
	getTemplateInfo,
	getTemplatePartIcon,
	useEntitiesSavedStatesIsDirty,
	useEntityRecordsWithPermissions,
	RECEIVE_INTERMEDIATE_RESULTS,
	getEntitySyncManager,
	registerEntitySyncManager,
};

export type CoreDataPrivateApis = typeof lockedApis;

export const privateApis = {};
lock( privateApis, lockedApis );
