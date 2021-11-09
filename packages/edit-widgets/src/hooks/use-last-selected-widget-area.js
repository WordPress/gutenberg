/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store as widgetsEditorStore } from '../store';
import { buildWidgetAreasPostId, KIND, POST_TYPE } from '../store/utils';

/**
 * A react hook that returns the client id of the last widget area to have
 * been selected, or to have a selected block within it.
 *
 * @return {string} clientId of the widget area last selected.
 */
const useLastSelectedWidgetArea = () =>
	useSelect( ( select ) => {
		const { getBlockSelectionEnd, getBlockName } = select(
			blockEditorStore
		);
		const selectionEndClientId = getBlockSelectionEnd();

		// If the selected block is a widget area, return its clientId.
		if ( getBlockName( selectionEndClientId ) === 'core/widget-area' ) {
			return selectionEndClientId;
		}

		const { getParentWidgetAreaBlock } = select( widgetsEditorStore );
		const widgetAreaBlock = getParentWidgetAreaBlock(
			selectionEndClientId
		);
		const widgetAreaBlockClientId = widgetAreaBlock?.clientId;

		if ( widgetAreaBlockClientId ) {
			return widgetAreaBlockClientId;
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
