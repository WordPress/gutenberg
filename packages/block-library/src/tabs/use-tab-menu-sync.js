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
 * Deletion: when one side shrinks, remove the orphaned counterpart.
 * Insertion: when one side grows without the other, insert the missing
 * counterpart at the matching index.
 *
 * When both lists change simultaneously (e.g. the "Add Tab" toolbar button,
 * which inserts both at once), no action is needed and the effect exits early.
 *
 * @param {Object}      props
 * @param {Array}       props.tabs             Raw core/tab block objects.
 * @param {Array}       props.menuItems        Menu item descriptors { clientId, anchor }.
 * @param {string|null} props.tabPanelClientId Client ID of the core/tab-panel block.
 * @param {string|null} props.tabsMenuClientId Client ID of the core/tabs-menu block.
 */
export default function useTabMenuSync( {
	tabs,
	menuItems,
	tabPanelClientId,
	tabsMenuClientId,
} ) {
	const { removeBlock, insertBlock, updateBlockAttributes } =
		useDispatch( blockEditorStore );

	const prevSyncStateRef = useRef( null );
	useEffect( () => {
		const currentTabs = tabs.map( ( tab ) => ( {
			clientId: tab.clientId,
			anchor: tab.attributes.anchor ?? '',
		} ) );

		if ( prevSyncStateRef.current === null ) {
			prevSyncStateRef.current = {
				tabs: currentTabs,
				menuItems: [ ...menuItems ],
			};
			return;
		}

		const { tabs: prevTabs, menuItems: prevMenuItems } =
			prevSyncStateRef.current;

		const tabCountChange = currentTabs.length - prevTabs.length;
		const menuItemCountChange = menuItems.length - prevMenuItems.length;

		const tabsRemoved = tabCountChange < 0;
		const menuItemsRemoved = menuItemCountChange < 0;
		const tabsInserted = tabCountChange > 0;
		const menuItemsInserted = menuItemCountChange > 0;

		// Both sides changed by the same amount.
		// Covers: no-op re-renders, "Add Tab" toolbar, and toolbar-remove.
		if ( tabCountChange === menuItemCountChange ) {
			prevSyncStateRef.current = {
				tabs: currentTabs,
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
				tabs: currentTabs,
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
			tabs: currentTabs,
			menuItems: [ ...menuItems ],
		};

		const currentTabIds = new Set( currentTabs.map( ( t ) => t.clientId ) );
		const currentMenuItemIds = new Set(
			menuItems.map( ( m ) => m.clientId )
		);

		if ( tabsRemoved ) {
			// A tab was deleted — remove its corresponding menu item.
			prevTabs.forEach( ( prevTab ) => {
				if ( currentTabIds.has( prevTab.clientId ) ) {
					return;
				}
				const expectedMenuAnchor = prevTab.anchor
					? `${ prevTab.anchor }-button`
					: null;
				const menuItemToRemove = expectedMenuAnchor
					? menuItems.find( ( m ) => m.anchor === expectedMenuAnchor )
					: null;
				if ( menuItemToRemove ) {
					removeBlock( menuItemToRemove.clientId, false );
					prevSyncStateRef.current.menuItems =
						prevSyncStateRef.current.menuItems.filter(
							( m ) => m.clientId !== menuItemToRemove.clientId
						);
				}
			} );
		} else if ( menuItemsRemoved ) {
			// A menu item was deleted — remove its corresponding tab.
			prevMenuItems.forEach( ( prevItem ) => {
				if ( currentMenuItemIds.has( prevItem.clientId ) ) {
					return;
				}
				const expectedTabAnchor =
					prevItem.anchor?.replace( /-button$/, '' ) ?? '';
				const tabToRemove = tabs.find(
					( tab ) =>
						( tab.attributes.anchor ?? '' ) === expectedTabAnchor
				);
				if ( tabToRemove ) {
					removeBlock( tabToRemove.clientId, false );
					prevSyncStateRef.current.tabs =
						prevSyncStateRef.current.tabs.filter(
							( t ) => t.clientId !== tabToRemove.clientId
						);
				}
			} );
		} else if ( tabsInserted ) {
			// A tab was pasted or duplicated — insert a matching menu item.
			// If the tab's anchor conflicts with an existing menu item, generate
			// a fresh unique anchor.
			const prevTabIds = new Set( prevTabs.map( ( t ) => t.clientId ) );
			// Track anchors in use across both tabs and menu items to generate
			// collision-free anchors when multiple tabs are inserted at once.
			const usedTabAnchors = new Set(
				currentTabs.map( ( t ) => t.anchor ).filter( Boolean )
			);
			const existingMenuAnchors = new Set(
				menuItems.map( ( m ) => m.anchor )
			);
			currentTabs.forEach( ( newTab, tabIndex ) => {
				if ( prevTabIds.has( newTab.clientId ) ) {
					return;
				}
				let tabAnchor = newTab.anchor;
				const menuAnchorConflicts =
					tabAnchor &&
					existingMenuAnchors.has( `${ tabAnchor }-button` );

				if ( ! tabAnchor || menuAnchorConflicts ) {
					// Find the next free tab-N slot.
					let tabNumber = currentTabs.length + 1;
					while ( usedTabAnchors.has( `tab-${ tabNumber }` ) ) {
						tabNumber++;
					}
					tabAnchor = `tab-${ tabNumber }`;
					// Reserve this anchor so subsequent new tabs don't collide.
					usedTabAnchors.add( tabAnchor );
					updateBlockAttributes( newTab.clientId, {
						anchor: tabAnchor,
					} );
					// Keep the snapshot in sync with the new anchor value.
					prevSyncStateRef.current.tabs[ tabIndex ] = {
						...prevSyncStateRef.current.tabs[ tabIndex ],
						anchor: tabAnchor,
					};
				}

				const menuAnchor = `${ tabAnchor }-button`;
				const newMenuItemBlock = createBlock( 'core/tabs-menu-item', {
					anchor: menuAnchor,
				} );
				insertBlock(
					newMenuItemBlock,
					tabIndex,
					tabsMenuClientId,
					false
				);
				// Add a placeholder so the next render does not re-trigger insertion.
				prevSyncStateRef.current.menuItems.splice( tabIndex, 0, {
					clientId: newMenuItemBlock.clientId,
					anchor: menuAnchor,
				} );
				existingMenuAnchors.add( menuAnchor );
			} );
		} else if ( menuItemsInserted ) {
			// A menu item was pasted or duplicated — insert a matching tab.
			// If the menu item's anchor conflicts with an existing tab, generate
			// a fresh unique anchor.
			const prevMenuItemIds = new Set(
				prevMenuItems.map( ( m ) => m.clientId )
			);
			// Track base anchors (the tab-N part) already in use across both
			// tabs and menu items to generate collision-free anchors when
			// multiple menu items are inserted at once.
			const usedBaseAnchors = new Set( [
				...currentTabs.map( ( t ) => t.anchor ).filter( Boolean ),
				...menuItems
					.map( ( m ) => m.anchor.replace( /-button$/, '' ) )
					.filter( Boolean ),
			] );
			const existingTabAnchors = new Set(
				currentTabs.map( ( t ) => t.anchor )
			);
			menuItems.forEach( ( newMenuItem, menuItemIndex ) => {
				if ( prevMenuItemIds.has( newMenuItem.clientId ) ) {
					return;
				}
				let baseAnchor = newMenuItem.anchor
					? newMenuItem.anchor.replace( /-button$/, '' )
					: '';
				const tabAnchorConflicts =
					baseAnchor && existingTabAnchors.has( baseAnchor );

				// Grab the original tab's label before potentially reassigning
				// baseAnchor, so we can copy it to the new tab.
				const originalTab = tabs.find(
					( t ) => ( t.attributes.anchor ?? '' ) === baseAnchor
				);
				const label = originalTab?.attributes?.label ?? '';

				if ( ! baseAnchor || tabAnchorConflicts ) {
					// Find the next free tab-N slot.
					let tabNumber = menuItems.length + 1;
					while ( usedBaseAnchors.has( `tab-${ tabNumber }` ) ) {
						tabNumber++;
					}
					baseAnchor = `tab-${ tabNumber }`;
					// Reserve this anchor so subsequent new items don't collide.
					usedBaseAnchors.add( baseAnchor );
					updateBlockAttributes( newMenuItem.clientId, {
						anchor: `${ baseAnchor }-button`,
					} );
					// Keep the snapshot in sync with the new anchor value.
					prevSyncStateRef.current.menuItems[ menuItemIndex ] = {
						...prevSyncStateRef.current.menuItems[ menuItemIndex ],
						anchor: `${ baseAnchor }-button`,
					};
				}

				const newTabBlock = createBlock( 'core/tab', {
					anchor: baseAnchor,
					label,
				} );
				insertBlock(
					newTabBlock,
					menuItemIndex,
					tabPanelClientId,
					false
				);
				// Add a placeholder so the next render does not re-trigger insertion.
				prevSyncStateRef.current.tabs.splice( menuItemIndex, 0, {
					clientId: newTabBlock.clientId,
					anchor: baseAnchor,
				} );
				existingTabAnchors.add( baseAnchor );
			} );
		}
	}, [
		tabs,
		menuItems,
		removeBlock,
		insertBlock,
		updateBlockAttributes,
		tabsMenuClientId,
		tabPanelClientId,
	] );
}
