/**
 * WordPress dependencies
 */
import { useQuerySelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { IDLE, SUCCESS, RESOLVING } from './constants';
import { store as coreStore } from '../';

export default function useEntityRecordPermissions( permissionKey, recordId ) {
	return useQuerySelect(
		( resolve ) => {
			const { canUser } = resolve( coreStore );
			const create = canUser( 'create', permissionKey );
			let update, _delete;
			if ( recordId ) {
				update = canUser( 'update', permissionKey, recordId );
				_delete = canUser( 'delete', permissionKey, recordId );
			}
			const isResolving =
				create.isResolving ||
				update?.isResolving ||
				_delete?.isResolving;

			const hasResolved =
				create.hasResolved &&
				( recordId ? update.hasResolved : true ) &&
				( recordId ? _delete.hasResolved : true );

			let status = '';
			if ( isResolving ) {
				status = RESOLVING;
			} else if ( hasResolved ) {
				status = SUCCESS;
			} else {
				status = IDLE;
			}
			return {
				status,
				isResolving,
				hasResolved,
				canCreate: create.data,
				canUpdate: update?.data,
				canDelete: _delete?.data,
			};
		},
		[ permissionKey, recordId ]
	);
}
