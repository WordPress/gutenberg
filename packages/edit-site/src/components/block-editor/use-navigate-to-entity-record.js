/**
 * WordPress dependencies
 */
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { useCallback } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';
import { privateApis as editorPrivateApis } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { useHistory, useLocation } = unlock( routerPrivateApis );
const { useGenerateBlockPath } = unlock( editorPrivateApis );

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
	const generateBlockPath = useGenerateBlockPath();

	// Get the selected block from URL parameters and decode the block path
	let initialBlockSelection = null;
	if ( query.selectedBlock ) {
		try {
			initialBlockSelection = JSON.parse(
				decodeURIComponent( query.selectedBlock )
			);
		} catch ( e ) {
			// Invalid JSON, ignore
			initialBlockSelection = null;
		}
	}

	const onNavigateToEntityRecord = useCallback(
		( params ) => {
			// First, update the current URL to include the selected block path for when we navigate back
			if ( params.selectedBlockClientId ) {
				const blockPath = generateBlockPath(
					params.selectedBlockClientId
				);
				if ( blockPath ) {
					// Encode the block path as JSON in the URL
					const currentUrl = addQueryArgs( path, {
						...query,
						selectedBlock: encodeURIComponent(
							JSON.stringify( blockPath )
						),
					} );
					history.navigate( currentUrl, { replace: true } );
				}
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
		[ history, path, query, generateBlockPath ]
	);

	return [ onNavigateToEntityRecord, initialBlockSelection ];
}
