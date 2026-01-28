/**
 * Internal dependencies
 */
import { useEntityRecordsWithPermissions } from './hooks/use-entity-records';
import {
	useActiveUsers,
	useGetAbsolutePositionIndex,
	useIsDisconnected,
	useGetDebugData,
} from './hooks/use-post-editor-awareness-state';
import { RECEIVE_INTERMEDIATE_RESULTS } from './utils';
import { lock } from './lock-unlock';

export const privateApis = {};
lock( privateApis, {
	useEntityRecordsWithPermissions,
	useActiveUsers,
	useGetAbsolutePositionIndex,
	useIsDisconnected,
	useGetDebugData,
	RECEIVE_INTERMEDIATE_RESULTS,
} );
