/**
 * WordPress dependencies
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useDispatch } from '@wordpress/data';
import { useEffect, useRef } from '@wordpress/element';

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

	const prevTabsRef = useRef( null );

	useEffect( () => {
		if ( ! tabListClientId ) {
			return;
		}

		const newTabs = tabPanels.map( ( tab ) => ( {
			label: tab.attributes.label || '',
		} ) );

		// Only update if tabs actually changed to avoid unnecessary re-renders.
		const serialized = JSON.stringify( newTabs );
		if ( serialized === prevTabsRef.current ) {
			return;
		}
		prevTabsRef.current = serialized;

		__unstableMarkNextChangeAsNotPersistent();
		updateBlockAttributes( tabListClientId, { tabs: newTabs } );
	}, [
		tabPanels,
		tabListClientId,
		updateBlockAttributes,
		__unstableMarkNextChangeAsNotPersistent,
	] );
}
