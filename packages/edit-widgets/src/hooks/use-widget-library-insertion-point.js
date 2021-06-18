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

const useWidgetLibraryInsertionPoint = () => {
	const firstRootId = useSelect( ( select ) => {
		// Default to the first widget area
		const { getEntityRecord } = select( coreStore );
		const widgetAreasPost = getEntityRecord(
			KIND,
			POST_TYPE,
			buildWidgetAreasPostId()
		);
		return widgetAreasPost?.blocks[ 0 ]?.clientId;
	}, [] );

	return useSelect(
		( select ) => {
			const {
				getBlockRootClientId,
				getBlockSelectionEnd,
				getBlockOrder,
				getBlockIndex,
			} = select( blockEditorStore );

			const clientId = getBlockSelectionEnd() || firstRootId;
			const rootClientId = getBlockRootClientId( clientId );

			// If the selected block is at the root level, it's a widget area and
			// blocks can't be inserted here. Return this block as the root and the
			// last child clientId indicating insertion at the end.
			if ( clientId && rootClientId === '' ) {
				return {
					rootClientId: clientId,
					insertionIndex: getBlockOrder( clientId ).length,
				};
			}

			return {
				rootClientId,
				insertionIndex: getBlockIndex( clientId, rootClientId ) + 1,
			};
		},
		[ firstRootId ]
	);
};

export default useWidgetLibraryInsertionPoint;
