/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { createBlock } from '@wordpress/blocks';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useDispatch, useRegistry } from '@wordpress/data';

/**
 * Provides callbacks to insert and remove tabs for a tabs block.
 *
 * The hook intentionally avoids subscribing to the store: all data is derived
 * lazily inside the callbacks via `registry.select`, so consumers don't
 * re-render when the tab structure changes.
 *
 * @param {string|null} tabsClientId The client ID of the parent tabs block.
 * @return {{ insertTab: Function, removeTab: Function }} Tab action callbacks.
 */
export default function useTabActions( tabsClientId ) {
	const registry = useRegistry();
	const {
		insertBlock,
		removeBlock,
		updateBlockAttributes,
		__unstableMarkNextChangeAsNotPersistent,
	} = useDispatch( blockEditorStore );

	// Derive the current tabs state at call time without subscribing.
	const getTabsState = () => {
		const { getBlocks, getBlockAttributes } =
			registry.select( blockEditorStore );

		const tabsAttributes = tabsClientId
			? getBlockAttributes( tabsClientId )
			: undefined;
		const tabPanels = tabsClientId
			? getBlocks( tabsClientId ).find(
					( block ) => block.name === 'core/tab-panels'
			  )
			: undefined;

		return {
			tabPanelsClientId: tabPanels?.clientId ?? null,
			tabPanelBlocks: tabPanels?.innerBlocks ?? [],
			activeIndex:
				tabsAttributes?.editorActiveTabIndex ??
				tabsAttributes?.activeTabIndex ??
				0,
		};
	};

	// Insert a new tab and make it active. Defaults to appending at the end.
	const insertTab = ( atIndex ) => {
		const { tabPanelsClientId, tabPanelBlocks } = getTabsState();
		if ( ! tabPanelsClientId ) {
			return;
		}

		const newIndex = atIndex ?? tabPanelBlocks.length;
		insertBlock(
			createBlock( 'core/tab-panel', { label: __( 'Tab' ) } ),
			newIndex,
			tabPanelsClientId,
			false
		);

		// Switch editor active tab to the new tab.
		__unstableMarkNextChangeAsNotPersistent();
		updateBlockAttributes( tabsClientId, {
			editorActiveTabIndex: newIndex,
		} );
	};

	// Remove a tab and move the active tab to an adjacent one. Defaults to the
	// currently active tab.
	const removeTab = ( atIndex ) => {
		const { tabPanelBlocks, activeIndex } = getTabsState();
		const tabCount = tabPanelBlocks.length;
		if ( tabCount <= 1 ) {
			return;
		}

		const removeIndex = atIndex ?? activeIndex;
		const target = tabPanelBlocks[ removeIndex ];
		if ( ! target ) {
			return;
		}

		// Calculate new active index after removal.
		const newActiveIndex =
			removeIndex >= tabCount - 1 ? tabCount - 2 : removeIndex;

		// Switch editor to the adjacent tab and remove the current one.
		__unstableMarkNextChangeAsNotPersistent();
		updateBlockAttributes( tabsClientId, {
			editorActiveTabIndex: newActiveIndex,
		} );
		removeBlock( target.clientId, false );
	};

	return { insertTab, removeTab };
}
