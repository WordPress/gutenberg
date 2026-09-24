import { useRegistry } from '@wordpress/data';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { useCallback } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';
import { store as coreStore } from '@wordpress/core-data';
import { store as editorStore } from '@wordpress/editor';
import { unlock } from '../../lock-unlock';
import { isValidViewport } from './viewport';

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

			const urlUpdates = { ...query };

			// Store the selected block in the URL for restoration when navigating back.
			if ( externalClientId ) {
				urlUpdates.selectedBlock = externalClientId;
				history.navigate( addQueryArgs( path, urlUpdates ), {
					replace: true,
				} );
			}

			// The width an entity is asked to be edited at is where it opens,
			// not something the entity being left carries away: a width set from
			// the device preview is view state, and an entity that asks for none
			// opens at the default.
			const requestedViewport =
				typeof params.viewport === 'string'
					? params.viewport.toLowerCase()
					: undefined;
			const isValidRequestedViewport =
				isValidViewport( requestedViewport );

			// Navigate to the new entity record
			const queryArgs = {
				canvas: 'edit',
				focusMode: true,
			};
			if ( isValidRequestedViewport ) {
				queryArgs.viewport = requestedViewport;
			}
			const url = addQueryArgs(
				`/${ params.postType }/${ params.postId }`,
				queryArgs
			);

			history.navigate( url );
		},
		[ history, path, query, registry ]
	);

	return onNavigateToEntityRecord;
}
