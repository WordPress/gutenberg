/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { buildWidgetAreasPostId, KIND, POST_TYPE } from '../store/utils';

const useLastSelectedRootId = () => {
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
		const { getBlockRootClientId, getBlockSelectionEnd } = select(
			'core/block-editor'
		);
		const blockSelectionEnd = getBlockSelectionEnd();
		const blockRootClientId = getBlockRootClientId( blockSelectionEnd );
		// getBlockRootClientId returns an empty string for top-level blocks, in which case just return the block id.
		return blockRootClientId === '' ? blockSelectionEnd : blockRootClientId;
	}, [] );

	// Fallbacks to the first widget area.
	return selectedRootId || firstRootId;
};

export default useLastSelectedRootId;
