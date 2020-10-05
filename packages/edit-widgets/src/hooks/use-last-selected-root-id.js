/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import {
	buildWidgetAreasEditorRecordId,
	KIND,
	EDITOR_TYPE,
} from '../store/utils';

const useLastSelectedRootId = () => {
	const firstRootId = useSelect( ( select ) => {
		// Default to the first widget area
		const { getEntityRecord } = select( 'core' );
		const widgetAreasEditor = getEntityRecord(
			KIND,
			EDITOR_TYPE,
			buildWidgetAreasEditorRecordId()
		);
		return widgetAreasEditor?.blocks[ 0 ]?.clientId;
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
