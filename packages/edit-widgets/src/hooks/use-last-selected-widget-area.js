/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { buildWidgetAreasPostId, KIND, POST_TYPE } from '../store/utils';

const useLastSelectedWidgetArea = () => {
	const firstRootId = useSelect( ( select ) => {
		// Default to the first widget area
		const { getEntityRecord } = select( 'core' );
		const widgetAreasPost = getEntityRecord(
			KIND,
			POST_TYPE,
			buildWidgetAreasPostId()
		);
		return widgetAreasPost?.blocks[ 0 ]?.clientId;
	}, [] );

	const selectedRootId = useSelect( ( select ) => {
		const { getBlockSelectionEnd, getBlockParents, getBlockName } = select(
			'core/block-editor'
		);
		const blockSelectionEndClientId = getBlockSelectionEnd();

		if (
			getBlockName( blockSelectionEndClientId ) === 'core/widget-area'
		) {
			return blockSelectionEndClientId;
		}

		const blockParents = getBlockParents( blockSelectionEndClientId );
		const rootWidgetAreaClientId = blockParents.find(
			( clientId ) => getBlockName( clientId ) === 'core/widget-area'
		);

		if ( rootWidgetAreaClientId ) {
			return rootWidgetAreaClientId;
		}
	}, [] );

	// Fallbacks to the first widget area.
	return selectedRootId || firstRootId;
};

export default useLastSelectedWidgetArea;
