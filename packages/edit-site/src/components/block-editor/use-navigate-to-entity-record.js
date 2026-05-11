/**
 * WordPress dependencies
 */
import { useSelect, useRegistry } from '@wordpress/data';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { useCallback } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';
import { store as coreStore } from '@wordpress/core-data';
import { store as editorStore } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { DEFAULT_DEVICE_TYPE } from './use-viewport-sync';

const { useHistory, useLocation } = unlock( routerPrivateApis );

const VALID_VIEWPORTS = [ 'desktop', 'tablet', 'mobile' ];
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
	const currentDeviceType = useSelect(
		( select ) => select( editorStore ).getDeviceType(),
		[]
	);

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
			}

			// Save the current viewport for when we navigate back (e.g. from overlay editor).
			// Omit viewport from URL when it's the default to keep URLs clean.
			const requestedViewport =
				typeof params.viewport === 'string'
					? params.viewport.toLowerCase()
					: undefined;
			const isValidRequestedViewport =
				VALID_VIEWPORTS.includes( requestedViewport );

			if ( isValidRequestedViewport ) {
				const currentViewportLower = (
					currentDeviceType || DEFAULT_DEVICE_TYPE
				).toLowerCase();
				if (
					currentViewportLower === DEFAULT_DEVICE_TYPE.toLowerCase()
				) {
					delete urlUpdates.viewport;
				} else {
					urlUpdates.viewport = currentViewportLower;
				}
			}

			const hasUpdatesToSave =
				externalClientId || isValidRequestedViewport;
			if ( hasUpdatesToSave ) {
				history.navigate( addQueryArgs( path, urlUpdates ), {
					replace: true,
				} );
			}

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
		[ history, path, query, registry, currentDeviceType ]
	);

	return onNavigateToEntityRecord;
}
