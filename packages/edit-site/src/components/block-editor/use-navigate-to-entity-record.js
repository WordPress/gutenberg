/**
 * WordPress dependencies
 */
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { useCallback } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { useHistory, useLocation } = unlock( routerPrivateApis );

/**
 * Hook to handle navigation to entity records and retrieve initial block selection.
 *
 * @return {Array} A tuple containing:
 *   - onNavigateToEntityRecord: Function to navigate to an entity record
 *   - initialBlockSelection: The clientId of the block to select, or null if none stored
 */
export default function useNavigateToEntityRecord() {
	const history = useHistory();
	const { query, path } = useLocation();

	// Get the selected block from URL parameters
	const initialBlockSelection = query.selectedBlock || null;

	const onNavigateToEntityRecord = useCallback(
		( params ) => {
			// First, update the current URL to include the selected block for when we navigate back
			if ( params.selectedBlockClientId ) {
				const currentUrl = addQueryArgs( path, {
					...query,
					selectedBlock: params.selectedBlockClientId,
				} );
				history.navigate( currentUrl, { replace: true } );
			}

			// Then navigate to the new entity record
			const url = addQueryArgs(
				`/${ params.postType }/${ params.postId }`,
				{
					canvas: 'edit',
					focusMode: true,
				}
			);

			history.navigate( url );
		},
		[ history, path, query ]
	);

	return [ onNavigateToEntityRecord, initialBlockSelection ];
}
