import { createBlock } from '@wordpress/blocks';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useDispatch, useRegistry } from '@wordpress/data';

/**
 * Provides callbacks to insert, remove and move tabs for a tabs block.
 *
 * The hook intentionally avoids subscribing to the store: all data is derived
 * lazily inside the callbacks via `registry.select`, so consumers don't
 * re-render when the tab structure changes.
 *
 * @param {string|null} tabsClientId The client ID of the parent tabs block.
 * @return {{ insertTab: Function, removeTab: Function, moveTab: Function }} Tab action callbacks.
 */
export default function useTabActions( tabsClientId ) {
	const registry = useRegistry();
	const {
		insertBlock,
		removeBlock,
		moveBlocksToPosition,
		updateBlockAttributes,
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
			defaultIndex: tabsAttributes?.activeTabIndex ?? 0,
		};
	};

	// Insert a new tab and make it active. Defaults to appending at the end.
	const insertTab = ( atIndex ) => {
		const { tabPanelsClientId, tabPanelBlocks, defaultIndex } =
			getTabsState();
		if ( ! tabPanelsClientId ) {
			return;
		}

		// Leave the active and default tabs alone when a tab panel can't be
		// inserted, as `insertBlock()` would then do nothing.
		const { canInsertBlockType } = registry.select( blockEditorStore );
		if ( ! canInsertBlockType( 'core/tab-panel', tabPanelsClientId ) ) {
			return;
		}

		const newIndex = atIndex ?? tabPanelBlocks.length;

		// Keep the default tab on the same tab panel when the new tab is
		// inserted before it. Fall back to the first tab when the default tab
		// no longer exists, for example after every tab panel was deleted.
		let newDefaultIndex = 0;
		if ( tabPanelBlocks[ defaultIndex ] ) {
			newDefaultIndex =
				newIndex <= defaultIndex ? defaultIndex + 1 : defaultIndex;
		}

		// Batch the changes into a single undo step, so undo restores the
		// default tab along with removing the new tab.
		registry.batch( () => {
			// Switch editor to the new tab and keep the default tab.
			updateBlockAttributes( tabsClientId, {
				editorActiveTabIndex: newIndex,
				activeTabIndex: newDefaultIndex,
			} );
			insertBlock(
				createBlock( 'core/tab-panel' ),
				newIndex,
				tabPanelsClientId,
				false
			);
		} );
	};

	// Remove a tab and move the active tab to an adjacent one. Defaults to the
	// currently active tab.
	const removeTab = ( atIndex ) => {
		const { tabPanelBlocks, activeIndex, defaultIndex } = getTabsState();
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

		// Keep the default tab on the same tab panel, falling back to the
		// first tab when the default tab itself is removed.
		let newDefaultIndex = defaultIndex;
		if ( removeIndex === defaultIndex ) {
			newDefaultIndex = 0;
		} else if ( removeIndex < defaultIndex ) {
			newDefaultIndex = defaultIndex - 1;
		}

		// Batch the changes into a single undo step, so undo restores the
		// default tab along with the removed tab.
		registry.batch( () => {
			removeBlock( target.clientId, false );

			// The tab panel stays when it's locked, or while the editor asks
			// to confirm removing a block inside it, such as a Query Loop in
			// a template. Only update the tabs once the tab panel is gone.
			const { getBlock } = registry.select( blockEditorStore );
			if ( getBlock( target.clientId ) ) {
				return;
			}

			// Switch editor to the adjacent tab and keep the default tab.
			updateBlockAttributes( tabsClientId, {
				editorActiveTabIndex: newActiveIndex,
				activeTabIndex: newDefaultIndex,
			} );
		} );
	};

	// Move the active tab one position left or right by reordering the
	// underlying tab-panel. The tab-list labels follow their panel
	// automatically via useTabListItemsSync.
	const moveTab = ( direction ) => {
		const { tabPanelsClientId, tabPanelBlocks, activeIndex, defaultIndex } =
			getTabsState();
		if ( ! tabPanelsClientId ) {
			return;
		}

		const toIndex = activeIndex + direction;
		const target = tabPanelBlocks[ activeIndex ];
		if ( ! target || toIndex < 0 || toIndex >= tabPanelBlocks.length ) {
			return;
		}

		// Leave the active and default tabs alone when the tab panel can't be
		// moved, for example when it's locked, as `moveBlocksToPosition()`
		// would then do nothing.
		const { canMoveBlock } = registry.select( blockEditorStore );
		if ( ! canMoveBlock( target.clientId ) ) {
			return;
		}

		// Keep the default tab on the same tab panel, whether it is the moved
		// tab or the neighboring tab that swaps places with it.
		let newDefaultIndex = defaultIndex;
		if ( defaultIndex === activeIndex ) {
			newDefaultIndex = toIndex;
		} else if ( defaultIndex === toIndex ) {
			newDefaultIndex = activeIndex;
		}

		// Batch the changes into a single undo step, so undo restores the
		// default tab along with the tab order.
		registry.batch( () => {
			// Switch editor to the moved tab and keep the default tab.
			updateBlockAttributes( tabsClientId, {
				editorActiveTabIndex: toIndex,
				activeTabIndex: newDefaultIndex,
			} );
			moveBlocksToPosition(
				[ target.clientId ],
				tabPanelsClientId,
				tabPanelsClientId,
				toIndex
			);
		} );
	};

	return { insertTab, removeTab, moveTab };
}
