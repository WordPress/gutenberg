/**
 * WordPress dependencies
 */
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { useCallback } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { addQueryArgs } from '@wordpress/url';
import { store as blockEditorStore } from '@wordpress/block-editor';

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
 *   - initialBlockSelection: The block path or clientId to restore selection, or null if none stored
 */
export default function useNavigateToEntityRecord() {
	const history = useHistory();
	const { query, path } = useLocation();
	const getExternalClientId = useSelect(
		( select ) => select( blockEditorStore ).getExternalClientId,
		[]
	);

	// Get the selected block from URL parameters.
	// The selectedBlock query param now stores the external clientId directly.
	const initialBlockSelection = query.selectedBlock
		? { clientId: query.selectedBlock }
		: null;

	const onNavigateToEntityRecord = useCallback(
		( params ) => {
			// First, update the current URL to include the selected block for when we navigate back
			if ( params.selection?.clientId ) {
				// Convert internal clientId to external for storage
				const externalClientId = getExternalClientId(
					params.selection.clientId
				);
				const currentUrl = addQueryArgs( path, {
					...query,
					selectedBlock: externalClientId,
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
		[ history, path, query, getExternalClientId ]
	);

	return [ onNavigateToEntityRecord, initialBlockSelection ];
}
