/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

/**
 * Returns props for the selected block tools and empty block inserter.
 *
 * @param {string} clientId Selected block client ID.
 */
export default function useSelectedBlockToolProps( clientId ) {
	const selectedBlockProps = useSelect(
		( select ) => {
			const {
				getBlockRootClientId,
				getBlockParents,
				__experimentalGetBlockListSettingsForBlocks,
				isBlockInsertionPointVisible,
				getBlockInsertionPoint,
				getBlockOrder,
				hasMultiSelection,
				getLastMultiSelectedBlockClientId,
			} = select( blockEditorStore );

			const blockParentsClientIds = getBlockParents( clientId );

			// Get Block List Settings for all ancestors of the current Block clientId.
			const parentBlockListSettings =
				__experimentalGetBlockListSettingsForBlocks(
					blockParentsClientIds
				);

			// Get the clientId of the topmost parent with the capture toolbars setting.
			const capturingClientId = blockParentsClientIds.find(
				( parentClientId ) =>
					parentBlockListSettings[ parentClientId ]
						?.__experimentalCaptureToolbars
			);

			let isInsertionPointVisible = false;
			if ( isBlockInsertionPointVisible() ) {
				const insertionPoint = getBlockInsertionPoint();
				const order = getBlockOrder( insertionPoint.rootClientId );
				isInsertionPointVisible =
					order[ insertionPoint.index ] === clientId;
			}

			return {
				capturingClientId,
				isInsertionPointVisible,
				lastClientId: hasMultiSelection()
					? getLastMultiSelectedBlockClientId()
					: null,
				rootClientId: getBlockRootClientId( clientId ),
			};
		},
		[ clientId ]
	);

	return selectedBlockProps;
}
