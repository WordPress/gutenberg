/**
 * WordPress dependencies
 */
import { useSuspenseSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Returns whether the current user can edit the given entity.
 *
 * @param {string} kind     Entity kind.
 * @param {string} name     Entity name.
 * @param {string} recordId Record's id.
 */
export function useCanEditEntity( kind, name, recordId ) {
	return useSuspenseSelect(
		( select ) =>
			select( coreStore ).canUserEditEntityRecord( kind, name, recordId ),
		[ kind, name, recordId ]
	);
}

export default {
	useCanEditEntity,
};
