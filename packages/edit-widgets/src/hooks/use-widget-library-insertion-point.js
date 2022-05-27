/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store as editWidgetsStore } from '../store';
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

			const insertionPoint = select(
				editWidgetsStore
			).__experimentalGetInsertionPoint();

			// "Browse all" in the quick inserter will set the rootClientId to the current block.
			// Otherwise, it will just be undefined, and we'll have to handle it differently below.
			if ( insertionPoint.rootClientId ) {
				return insertionPoint;
			}

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
				insertionIndex: getBlockIndex( clientId ) + 1,
			};
		},
		[ firstRootId ]
	);
};

export default useWidgetLibraryInsertionPoint;
