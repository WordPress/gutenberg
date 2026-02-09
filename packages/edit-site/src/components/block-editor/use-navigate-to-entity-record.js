/**
 * WordPress dependencies
 */
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { useCallback } from '@wordpress/element';
import { useRegistry } from '@wordpress/data';
import { addQueryArgs } from '@wordpress/url';
import { store as coreStore } from '@wordpress/core-data';
import { store as editorStore } from '@wordpress/editor';

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
	const registry = useRegistry();

	const onNavigateToEntityRecord = useCallback(
		( params ) => {
			// Read entity selection (already has external IDs from onChangeSelection)
			const currentPostType = registry
				.select( editorStore )
				.getCurrentPostType();
			const currentPostId = registry
				.select( editorStore )
				.getCurrentPostId();
			const entityEdits = registry
				.select( coreStore )
				.getEntityRecordEdits(
					'postType',
					currentPostType,
					currentPostId
				);
			const externalClientId =
				entityEdits?.selection?.selectionStart?.clientId;

			// Store the selected block in the URL for restoration when navigating back.
			if ( externalClientId ) {
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
		[ history, path, query, registry ]
	);

	return onNavigateToEntityRecord;
}
