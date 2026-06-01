/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useDispatch } from '@wordpress/data';
import { useEffect, useRef } from '@wordpress/element';

/**
 * Keep tabs and tab panels in sync when the lists change due to direct
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
 * @param {Array}       props.tabs              Raw core/tab block objects.
 * @param {Array}       props.tabPanels         Raw core/tab-panel block objects.
 * @param {string|null} props.tabPanelsClientId Client ID of the core/tab-panels block.
 * @param {string|null} props.tabsListClientId  Client ID of the core/tab-list block.
 */
export default function useTabListSync( {
	tabPanels,
	tabs,
	tabPanelsClientId,
	tabsListClientId,
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
				tabPanels: [ ...tabPanels ],
				tabs: [ ...tabs ],
			};
			return;
		}

		const { tabPanels: prevTabPanels, tabs: prevTabs } =
			prevSyncStateRef.current;

		const tabPanelCountChange = tabPanels.length - prevTabPanels.length;
		const tabCountChange = tabs.length - prevTabs.length;

		const tabPanelsInserted = tabPanelCountChange > 0;
		const tabsInserted = tabCountChange > 0;

		// Both sides changed by the same amount.
		// Covers: no-op re-renders, "Add Tab" toolbar, and toolbar-remove.
		// Also handles drag-and-drop reordering of tabs.
		if ( tabPanelCountChange === tabCountChange ) {
			// When lengths are equal but order changed, the user reordered tabs
			// via drag-and-drop. Reorder the tab panel blocks to match.
			if (
				tabPanelCountChange === 0 &&
				tabPanelsClientId &&
				tabs.some( ( m, i ) => m.clientId !== prevTabs[ i ]?.clientId )
			) {
				const reorderedTabPanels = tabs
					.map( ( tab ) => {
						const oldIndex = prevTabs.findIndex(
							( pm ) => pm.clientId === tab.clientId
						);
						return oldIndex !== -1 ? tabPanels[ oldIndex ] : null;
					} )
					.filter( Boolean );
				if ( reorderedTabPanels.length === tabPanels.length ) {
					__unstableMarkNextChangeAsNotPersistent();
					replaceInnerBlocks(
						tabPanelsClientId,
						reorderedTabPanels,
						false
					);
				}
			}
			prevSyncStateRef.current = {
				tabPanels: [ ...tabPanels ],
				tabs: [ ...tabs ],
			};
			return;
		}

		// Both sides changed in the same direction but by different amounts.
		// Bail without making a partial fix.
		if (
			( tabPanelCountChange > 0 && tabCountChange > 0 ) ||
			( tabPanelCountChange < 0 && tabCountChange < 0 )
		) {
			prevSyncStateRef.current = {
				tabPanels: [ ...tabPanels ],
				tabs: [ ...tabs ],
			};
			return;
		}

		// If the required container block isn't available yet, bail without
		// updating the snapshot so the next render re-evaluates the same count change.
		if ( tabPanelsInserted && ! tabsListClientId ) {
			return;
		}
		if ( tabsInserted && ! tabPanelsClientId ) {
			return;
		}

		// Update snapshot to the current state.
		prevSyncStateRef.current = {
			tabPanels: [ ...tabPanels ],
			tabs: [ ...tabs ],
		};

		const currentTabPanelIds = new Set(
			tabPanels.map( ( t ) => t.clientId )
		);
		const currentTabIds = new Set( tabs.map( ( m ) => m.clientId ) );

		if ( tabPanelCountChange < 0 ) {
			// Remove the tab at the same position as each deleted tab panel.
			const removedIndices = prevTabPanels
				.map( ( t, i ) =>
					! currentTabPanelIds.has( t.clientId ) ? i : -1
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
		} else if ( tabCountChange < 0 ) {
			// Remove the tab panel at the same position as each deleted tab.
			const removedIndices = prevTabs
				.map( ( m, i ) =>
					! currentTabIds.has( m.clientId ) ? i : -1
				)
				.filter( ( i ) => i !== -1 );
			const removedSet = new Set( removedIndices );
			removedIndices.forEach( ( removedIndex ) => {
				if ( tabPanels[ removedIndex ] ) {
					__unstableMarkNextChangeAsNotPersistent();
					removeBlock( tabPanels[ removedIndex ].clientId, false );
				}
			} );
			prevSyncStateRef.current.tabPanels =
				prevSyncStateRef.current.tabPanels.filter(
					( _, i ) => ! removedSet.has( i )
				);
		} else if ( tabPanelsInserted ) {
			// A tab panel was pasted or duplicated — insert a matching tab.
			const prevTabPanelIds = new Set(
				prevTabPanels.map( ( t ) => t.clientId )
			);
			const newTabs = tabPanels
				.map( ( tabPanel, tabPanelIndex ) =>
					! prevTabPanelIds.has( tabPanel.clientId )
						? {
								tabPanelIndex,
								block: createBlock( 'core/tab', {} ),
						  }
						: null
				)
				.filter( Boolean );

			if ( newTabs.length > 0 ) {
				__unstableMarkNextChangeAsNotPersistent();
				insertBlocks(
					newTabs.map( ( { block } ) => block ),
					newTabs[ 0 ].tabPanelIndex,
					tabsListClientId,
					false
				);
				newTabs.forEach( ( { tabPanelIndex, block } ) => {
					prevSyncStateRef.current.tabs.splice( tabPanelIndex, 0, {
						clientId: block.clientId,
					} );
				} );
			}
		} else if ( tabsInserted ) {
			// A tab was pasted or duplicated — insert a matching tab panels,
			// copying the label from the adjacent tab panel.
			const prevTabIds = new Set( prevTabs.map( ( m ) => m.clientId ) );
			const newTabPanels = tabs
				.map( ( tab, tabIndex ) => {
					if ( prevTabIds.has( tab.clientId ) ) {
						return null;
					}
					const label =
						tabPanels[ tabIndex - 1 ]?.attributes?.label ??
						tabPanels[ tabIndex ]?.attributes?.label ??
						'';
					return {
						tabIndex,
						block: createBlock( 'core/tab-panel', { label } ),
					};
				} )
				.filter( Boolean );

			if ( newTabPanels.length > 0 ) {
				__unstableMarkNextChangeAsNotPersistent();
				insertBlocks(
					newTabPanels.map( ( { block } ) => block ),
					newTabPanels[ 0 ].tabIndex,
					tabPanelsClientId,
					false
				);
				newTabPanels.forEach( ( { tabIndex, block } ) => {
					prevSyncStateRef.current.tabPanels.splice( tabIndex, 0, {
						clientId: block.clientId,
					} );
				} );
			}
		}
	}, [
		tabPanels,
		tabs,
		removeBlock,
		insertBlocks,
		replaceInnerBlocks,
		__unstableMarkNextChangeAsNotPersistent,
		tabsListClientId,
		tabPanelsClientId,
	] );
}
