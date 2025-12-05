/**
 * WordPress dependencies
 */
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { useHistory } = unlock( routerPrivateApis );

// Store selected blocks per path in memory (not persisted across page reloads)
const selectedBlocksByPath = new Map();

/**
 * Hook to handle navigation to entity records and retrieve initial block selection.
 *
 * @return {Array} A tuple containing:
 *   - onNavigateToEntityRecord: Function to navigate to an entity record
 *   - initialBlockSelection: The clientId of the block to select, or null if none stored
 */
export default function useNavigateToEntityRecord() {
	const history = useHistory();
	const currentPath = window.location.pathname + window.location.search;
	const initialBlockSelection =
		selectedBlocksByPath.get( currentPath ) || null;

	const onNavigateToEntityRecord = useCallback(
		( params ) => {
			// Store selected block for current location if provided
			const path = window.location.pathname + window.location.search;
			if ( params.selectedBlockClientId ) {
				selectedBlocksByPath.set( path, params.selectedBlockClientId );
			}

			history.navigate(
				`/${ params.postType }/${ params.postId }?canvas=edit&focusMode=true`
			);
		},
		[ history ]
	);

	return [ onNavigateToEntityRecord, initialBlockSelection ];
}
