/**
 * WordPress dependencies
 */
import { useQuerySelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { IDLE, SUCCESS, RESOLVING } from './constants';
import { store as coreStore } from '../';

export default function usePermissions( resource, id ) {
	return useQuerySelect(
		( resolve ) => {
			const { canUser } = resolve( coreStore );
			const create = canUser( 'create', resource );
			let update, _delete;
			if ( id ) {
				update = canUser( 'update', resource, id );
				_delete = canUser( 'delete', resource, id );
			}
			const isResolving =
				create.isResolving ||
				update?.isResolving ||
				_delete?.isResolving;

			const hasResolved =
				create.hasResolved &&
				( id ? update.hasResolved : true ) &&
				( id ? _delete.hasResolved : true );

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
		[ resource, id ]
	);
}
