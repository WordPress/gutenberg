/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { buildWidgetAreasPostId, KIND, POST_TYPE } from '../store/utils';

/**
 * A react hook that returns the client id of the last widget area to have
 * been selected, or to have a selected block within it.
 *
 * @return {string} clientId of the widget area last selected.
 */
const useLastSelectedWidgetArea = () =>
	useSelect( ( select ) => {
		const { getBlockSelectionEnd, getBlockParents, getBlockName } = select(
			blockEditorStore
		);
		const blockSelectionEndClientId = getBlockSelectionEnd();

		// If the selected block is a widget area, return its clientId.
		if (
			getBlockName( blockSelectionEndClientId ) === 'core/widget-area'
		) {
			return blockSelectionEndClientId;
		}

		// Otherwise, find the clientId of the top-level widget area by looking
		// through the selected block's parents.
		const blockParents = getBlockParents( blockSelectionEndClientId );
		const rootWidgetAreaClientId = blockParents.find(
			( clientId ) => getBlockName( clientId ) === 'core/widget-area'
		);

		if ( rootWidgetAreaClientId ) {
			return rootWidgetAreaClientId;
		}

		// If no widget area has been selected, return the clientId of the first
		// area.
		const { getEntityRecord } = select( coreStore );
		const widgetAreasPost = getEntityRecord(
			KIND,
			POST_TYPE,
			buildWidgetAreasPostId()
		);
		return widgetAreasPost?.blocks[ 0 ]?.clientId;
	}, [] );

export default useLastSelectedWidgetArea;
