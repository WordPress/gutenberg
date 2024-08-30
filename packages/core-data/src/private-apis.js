/**
 * Internal dependencies
 */
import { useEntityRecordsWithPermissions } from './hooks/use-entity-records';
import { lock } from './lock-unlock';

export const privateApis = {};
lock( privateApis, {
	useEntityRecordsWithPermissions,
} );
