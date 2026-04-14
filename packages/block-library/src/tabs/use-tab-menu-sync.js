/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useDispatch } from '@wordpress/data';
import { useEffect, useRef } from '@wordpress/element';

/**
 * Keep tabs and menu items in sync when the lists change due to direct
 * user actions (deletion, paste, duplicate, drag-and-drop).
 *
 * Deletion: when one side shrinks, remove the counterpart at the same index.
 * Insertion: when one side grows without the other, insert the missing
 * counterpart at the matching index.
 *
 * When both lists change simultaneously (e.g. the "Add Tab" toolbar button,
 * which inserts both at once), no action is needed and the effect exits early.
 *
 * @param {Object}      props
 * @param {Array}       props.tabs             Raw core/tab block objects.
 * @param {Array}       props.menuItems        Raw core/tabs-menu-item block objects.
 * @param {string|null} props.tabPanelClientId Client ID of the core/tab-panel block.
 * @param {string|null} props.tabsMenuClientId Client ID of the core/tabs-menu block.
 */
export default function useTabMenuSync( {
	tabs,
	menuItems,
	tabPanelClientId,
	tabsMenuClientId,
} ) {
	const { removeBlock, insertBlock } = useDispatch( blockEditorStore );

	const prevSyncStateRef = useRef( null );
	useEffect( () => {
		const currentTabs = tabs.map( ( tab ) => ( {
			clientId: tab.clientId,
		} ) );
		const currentMenuItems = menuItems.map( ( m ) => ( {
			clientId: m.clientId,
		} ) );

		if ( prevSyncStateRef.current === null ) {
			prevSyncStateRef.current = {
				tabs: currentTabs,
				menuItems: currentMenuItems,
			};
			return;
		}

		const { tabs: prevTabs, menuItems: prevMenuItems } =
			prevSyncStateRef.current;

		const tabCountChange = currentTabs.length - prevTabs.length;
		const menuItemCountChange =
			currentMenuItems.length - prevMenuItems.length;

		const tabsInserted = tabCountChange > 0;
		const menuItemsInserted = menuItemCountChange > 0;

		// Both sides changed by the same amount.
		// Covers: no-op re-renders, "Add Tab" toolbar, and toolbar-remove.
		if ( tabCountChange === menuItemCountChange ) {
			prevSyncStateRef.current = {
				tabs: currentTabs,
				menuItems: currentMenuItems,
			};
			return;
		}

		// Both sides changed in the same direction but by different amounts.
		// Bail without making a partial fix.
		if (
			( tabCountChange > 0 && menuItemCountChange > 0 ) ||
			( tabCountChange < 0 && menuItemCountChange < 0 )
		) {
			prevSyncStateRef.current = {
				tabs: currentTabs,
				menuItems: currentMenuItems,
			};
			return;
		}

		// If the required container block isn't available yet, bail without
		// updating the snapshot so the next render re-evaluates the same count change.
		if ( tabsInserted && ! tabsMenuClientId ) {
			return;
		}
		if ( menuItemsInserted && ! tabPanelClientId ) {
			return;
		}

		// Update snapshot to the current state.
		prevSyncStateRef.current = {
			tabs: currentTabs,
			menuItems: currentMenuItems,
		};

		const currentTabIds = new Set( currentTabs.map( ( t ) => t.clientId ) );
		const currentMenuItemIds = new Set(
			currentMenuItems.map( ( m ) => m.clientId )
		);

		if ( tabCountChange < 0 ) {
			// Remove the menu item at the same position as the deleted tab.
			const removedIndex = prevTabs.findIndex(
				( t ) => ! currentTabIds.has( t.clientId )
			);
			if ( removedIndex >= 0 && menuItems[ removedIndex ] ) {
				removeBlock( menuItems[ removedIndex ].clientId, false );
				prevSyncStateRef.current.menuItems =
					prevSyncStateRef.current.menuItems.filter(
						( _, i ) => i !== removedIndex
					);
			}
		} else if ( menuItemCountChange < 0 ) {
			// Remove the tab at the same position as the deleted menu item.
			const removedIndex = prevMenuItems.findIndex(
				( m ) => ! currentMenuItemIds.has( m.clientId )
			);
			if ( removedIndex >= 0 && tabs[ removedIndex ] ) {
				removeBlock( tabs[ removedIndex ].clientId, false );
				prevSyncStateRef.current.tabs =
					prevSyncStateRef.current.tabs.filter(
						( _, i ) => i !== removedIndex
					);
			}
		} else if ( tabsInserted ) {
			// A tab was pasted or duplicated — insert a matching menu item at
			// the same position.
			const prevTabIds = new Set( prevTabs.map( ( t ) => t.clientId ) );
			currentTabs.forEach( ( newTab, tabIndex ) => {
				if ( prevTabIds.has( newTab.clientId ) ) {
					return;
				}
				const newMenuItemBlock = createBlock(
					'core/tabs-menu-item',
					{}
				);
				insertBlock(
					newMenuItemBlock,
					tabIndex,
					tabsMenuClientId,
					false
				);
				prevSyncStateRef.current.menuItems.splice( tabIndex, 0, {
					clientId: newMenuItemBlock.clientId,
				} );
			} );
		} else if ( menuItemsInserted ) {
			// A menu item was pasted or duplicated — insert a matching tab at
			// the same position, copying the label from the adjacent tab.
			const prevMenuItemIds = new Set(
				prevMenuItems.map( ( m ) => m.clientId )
			);
			currentMenuItems.forEach( ( newMenuItem, menuItemIndex ) => {
				if ( prevMenuItemIds.has( newMenuItem.clientId ) ) {
					return;
				}
				const label =
					tabs[ menuItemIndex - 1 ]?.attributes?.label ??
					tabs[ menuItemIndex ]?.attributes?.label ??
					'';
				const newTabBlock = createBlock( 'core/tab', { label } );
				insertBlock(
					newTabBlock,
					menuItemIndex,
					tabPanelClientId,
					false
				);
				prevSyncStateRef.current.tabs.splice( menuItemIndex, 0, {
					clientId: newTabBlock.clientId,
				} );
			} );
		}
	}, [
		tabs,
		menuItems,
		removeBlock,
		insertBlock,
		tabsMenuClientId,
		tabPanelClientId,
	] );
}
