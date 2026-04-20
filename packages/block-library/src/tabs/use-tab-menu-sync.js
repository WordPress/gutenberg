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
	const {
		removeBlock,
		insertBlocks,
		replaceInnerBlocks,
		__unstableMarkNextChangeAsNotPersistent,
	} = useDispatch( blockEditorStore );

	const prevSyncStateRef = useRef( null );
	useEffect( () => {
		if ( prevSyncStateRef.current === null ) {
			prevSyncStateRef.current = {
				tabs: [ ...tabs ],
				menuItems: [ ...menuItems ],
			};
			return;
		}

		const { tabs: prevTabs, menuItems: prevMenuItems } =
			prevSyncStateRef.current;

		const tabCountChange = tabs.length - prevTabs.length;
		const menuItemCountChange = menuItems.length - prevMenuItems.length;

		const tabsInserted = tabCountChange > 0;
		const menuItemsInserted = menuItemCountChange > 0;

		// Both sides changed by the same amount.
		// Covers: no-op re-renders, "Add Tab" toolbar, and toolbar-remove.
		// Also handles drag-and-drop reordering of menu items.
		if ( tabCountChange === menuItemCountChange ) {
			// When lengths are equal but order changed, the user reordered menu
			// items via drag-and-drop. Reorder the tab content blocks to match.
			if (
				tabCountChange === 0 &&
				tabPanelClientId &&
				menuItems.some(
					( m, i ) => m.clientId !== prevMenuItems[ i ]?.clientId
				)
			) {
				const reorderedTabs = menuItems
					.map( ( menuItem ) => {
						const oldIndex = prevMenuItems.findIndex(
							( pm ) => pm.clientId === menuItem.clientId
						);
						return oldIndex !== -1 ? tabs[ oldIndex ] : null;
					} )
					.filter( Boolean );
				if ( reorderedTabs.length === tabs.length ) {
					__unstableMarkNextChangeAsNotPersistent();
					replaceInnerBlocks(
						tabPanelClientId,
						reorderedTabs,
						false
					);
				}
			}
			prevSyncStateRef.current = {
				tabs: [ ...tabs ],
				menuItems: [ ...menuItems ],
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
				tabs: [ ...tabs ],
				menuItems: [ ...menuItems ],
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
			tabs: [ ...tabs ],
			menuItems: [ ...menuItems ],
		};

		const currentTabIds = new Set( tabs.map( ( t ) => t.clientId ) );
		const currentMenuItemIds = new Set(
			menuItems.map( ( m ) => m.clientId )
		);

		if ( tabCountChange < 0 ) {
			// Remove the menu item at the same position as each deleted tab.
			const removedIndices = prevTabs
				.map( ( t, i ) =>
					! currentTabIds.has( t.clientId ) ? i : -1
				)
				.filter( ( i ) => i !== -1 );
			const removedSet = new Set( removedIndices );
			removedIndices.forEach( ( removedIndex ) => {
				if ( menuItems[ removedIndex ] ) {
					__unstableMarkNextChangeAsNotPersistent();
					removeBlock( menuItems[ removedIndex ].clientId, false );
				}
			} );
			prevSyncStateRef.current.menuItems =
				prevSyncStateRef.current.menuItems.filter(
					( _, i ) => ! removedSet.has( i )
				);
		} else if ( menuItemCountChange < 0 ) {
			// Remove the tab at the same position as each deleted menu item.
			const removedIndices = prevMenuItems
				.map( ( m, i ) =>
					! currentMenuItemIds.has( m.clientId ) ? i : -1
				)
				.filter( ( i ) => i !== -1 );
			const removedSet = new Set( removedIndices );
			removedIndices.forEach( ( removedIndex ) => {
				if ( tabs[ removedIndex ] ) {
					__unstableMarkNextChangeAsNotPersistent();
					removeBlock( tabs[ removedIndex ].clientId, false );
				}
			} );
			prevSyncStateRef.current.tabs =
				prevSyncStateRef.current.tabs.filter(
					( _, i ) => ! removedSet.has( i )
				);
		} else if ( tabsInserted ) {
			// A tab was pasted or duplicated — insert matching menu items.
			const prevTabIds = new Set( prevTabs.map( ( t ) => t.clientId ) );
			const newMenuItems = tabs
				.map( ( tab, tabIndex ) =>
					! prevTabIds.has( tab.clientId )
						? {
								tabIndex,
								block: createBlock( 'core/tabs-menu-item', {} ),
						  }
						: null
				)
				.filter( Boolean );

			if ( newMenuItems.length > 0 ) {
				__unstableMarkNextChangeAsNotPersistent();
				insertBlocks(
					newMenuItems.map( ( { block } ) => block ),
					newMenuItems[ 0 ].tabIndex,
					tabsMenuClientId,
					false
				);
				newMenuItems.forEach( ( { tabIndex, block } ) => {
					prevSyncStateRef.current.menuItems.splice( tabIndex, 0, {
						clientId: block.clientId,
					} );
				} );
			}
		} else if ( menuItemsInserted ) {
			// A menu item was pasted or duplicated — insert matching tabs,
			// copying the label from the adjacent tab.
			const prevMenuItemIds = new Set(
				prevMenuItems.map( ( m ) => m.clientId )
			);
			const newTabs = menuItems
				.map( ( menuItem, menuItemIndex ) => {
					if ( prevMenuItemIds.has( menuItem.clientId ) ) {
						return null;
					}
					const label =
						tabs[ menuItemIndex - 1 ]?.attributes?.label ??
						tabs[ menuItemIndex ]?.attributes?.label ??
						'';
					return {
						menuItemIndex,
						block: createBlock( 'core/tab', { label } ),
					};
				} )
				.filter( Boolean );

			if ( newTabs.length > 0 ) {
				__unstableMarkNextChangeAsNotPersistent();
				insertBlocks(
					newTabs.map( ( { block } ) => block ),
					newTabs[ 0 ].menuItemIndex,
					tabPanelClientId,
					false
				);
				newTabs.forEach( ( { menuItemIndex, block } ) => {
					prevSyncStateRef.current.tabs.splice( menuItemIndex, 0, {
						clientId: block.clientId,
					} );
				} );
			}
		}
	}, [
		tabs,
		menuItems,
		removeBlock,
		insertBlocks,
		replaceInnerBlocks,
		__unstableMarkNextChangeAsNotPersistent,
		tabsMenuClientId,
		tabPanelClientId,
	] );
}
