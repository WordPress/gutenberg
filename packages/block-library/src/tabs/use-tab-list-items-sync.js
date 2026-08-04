/**
 * WordPress dependencies
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';

const EMPTY_ARRAY = [];

/**
 * Keep the tab-list block's `tabs` attribute in sync with the tab-panel blocks.
 *
 * Whenever the list of core/tab-panel blocks changes (add, remove, reorder, or
 * label edit), this hook updates the `tabs` attribute on the core/tab-list
 * block so that save.js can render the correct buttons.
 *
 * @param {string} tabsClientId Client ID of the core/tabs block.
 */
export default function useTabListItemsSync( tabsClientId ) {
	const { tabPanels, tabListClientId } = useSelect(
		( select ) => {
			const { getBlocks } = select( blockEditorStore );
			const innerBlocks = getBlocks( tabsClientId );

			const tabPanelsBlock = innerBlocks.find(
				( block ) => block.name === 'core/tab-panels'
			);
			const tabList = innerBlocks.find(
				( block ) => block.name === 'core/tab-list'
			);

			return {
				tabPanels: tabPanelsBlock?.innerBlocks ?? EMPTY_ARRAY,
				tabListClientId: tabList?.clientId ?? null,
			};
		},
		[ tabsClientId ]
	);

	const { updateBlockAttributes, __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( blockEditorStore );
	const { getBlockAttributes } = useSelect( blockEditorStore );

	useEffect( () => {
		if ( ! tabListClientId ) {
			return;
		}

		const newTabs = tabPanels.map( ( tab ) => ( {
			label: tab.attributes.label || '',
		} ) );

		// Skip the update when the stored tabs already match the derived ones.
		const currentTabs = getBlockAttributes( tabListClientId )?.tabs ?? [];
		if ( JSON.stringify( newTabs ) === JSON.stringify( currentTabs ) ) {
			return;
		}

		__unstableMarkNextChangeAsNotPersistent();
		updateBlockAttributes( tabListClientId, { tabs: newTabs } );
	}, [
		tabPanels,
		tabListClientId,
		getBlockAttributes,
		updateBlockAttributes,
		__unstableMarkNextChangeAsNotPersistent,
	] );
}
