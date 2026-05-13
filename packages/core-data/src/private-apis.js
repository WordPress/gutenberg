/**
 * Internal dependencies
 */
import { useEntityRecordsWithPermissions } from './hooks/use-entity-records';
import { RECEIVE_INTERMEDIATE_RESULTS } from './utils';
import { lock } from './lock-unlock';

export const privateApis = {};
lock( privateApis, {
	useEntityRecordsWithPermissions,
	RECEIVE_INTERMEDIATE_RESULTS,
} );
