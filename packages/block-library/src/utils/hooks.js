/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Returns whether the current user can edit the given entity.
 *
 * @param {string} kind     Entity kind.
 * @param {string} name     Entity name.
 * @param {number} key      Record's key.
 * @param {string} recordId Record's id.
 */
export function useCanEditEntity( kind, name, key, recordId ) {
	return useSelect(
		( select ) =>
			select( coreStore ).canUserEditEntityRecord(
				kind,
				name,
				key,
				recordId
			),
		[ kind, name, key, recordId ]
	);
}

export default {
	useCanEditEntity,
};
