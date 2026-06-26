/**
 * WordPress dependencies
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';

/**
 * Keep the tab-list block's `tabs` attribute in sync with the tab-panel blocks.
 *
 * Whenever the list of core/tab-panel blocks changes (add, remove, reorder, or
 * label edit), this hook updates the `tabs` attribute on the core/tab-list
 * block so that save.js can render the correct buttons.
 *
 * @param {Object}      props
 * @param {Array}       props.tabPanels       Raw core/tab-panel block objects.
 * @param {string|null} props.tabListClientId Client ID of the core/tab-list block.
 */
export default function useTabListItemsSync( { tabPanels, tabListClientId } ) {
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
