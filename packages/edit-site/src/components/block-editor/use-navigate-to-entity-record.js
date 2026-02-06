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
 * Hook to handle navigation to entity records.
 *
 * @return {Function} Function to navigate to an entity record.
 */
export default function useNavigateToEntityRecord() {
	const history = useHistory();
	const location = useLocation();
	const { query, path } = location;
	const getExternalClientId = useSelect(
		( select ) => unlock( select( blockEditorStore ) ).getExternalClientId,
		[]
	);

	const onNavigateToEntityRecord = useCallback(
		( params ) => {
			// Store the selected block in the URL for restoration when navigating back.
			// The selectedBlock is converted to external clientId for stable storage.
			if ( params.selection?.clientId ) {
				const externalClientId = getExternalClientId(
					params.selection.clientId
				);
				const currentUrl = addQueryArgs( path, {
					...query,
					selectedBlock: externalClientId,
				} );
				history.navigate( currentUrl, { replace: true } );
			}

			// Navigate to the new entity record
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

	return onNavigateToEntityRecord;
}
