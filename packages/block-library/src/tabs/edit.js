/**
 * WordPress dependencies
 */
import {
	useBlockProps,
	useInnerBlocksProps,
	BlockContextProvider,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { useSelect, useDispatch } from '@wordpress/data';
import { useMemo, useEffect, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Controls from './controls';

const TABS_TEMPLATE = [
	[
		'core/tabs-menu',
		{
			lock: {
				remove: true,
			},
		},
		[
			[ 'core/tabs-menu-item', { anchor: 'tab-1-button' } ],
			[ 'core/tabs-menu-item', { anchor: 'tab-2-button' } ],
		],
	],
	[
		'core/tab-panel',
		{
			lock: {
				remove: true,
			},
		},
		[
			[
				'core/tab',
				{
					anchor: 'tab-1',
					label: 'Tab 1',
				},
				[ [ 'core/paragraph' ] ],
			],
			[
				'core/tab',
				{
					anchor: 'tab-2',
					label: 'Tab 2',
				},
				[ [ 'core/paragraph' ] ],
			],
		],
	],
];

function Edit( {
	clientId,
	attributes,
	setAttributes,
	__unstableLayoutClassNames: layoutClassNames,
} ) {
	const { anchor, activeTabIndex, editorActiveTabIndex } = attributes;

	/**
	 * Initialize editorActiveTabIndex to activeTabIndex on mount.
	 * This ensures the ephemeral editor state starts at the persisted default.
	 */
	useEffect( () => {
		if ( editorActiveTabIndex === undefined ) {
			setAttributes( { editorActiveTabIndex: activeTabIndex } );
		}
	}, [] ); // eslint-disable-line react-hooks/exhaustive-deps

	const { removeBlock, insertBlock, updateBlockAttributes } =
		useDispatch( blockEditorStore );

	/**
	 * Construct a list of core/tab blocks, used to create tabs-list context.
	 * Also select menu items with their anchors for anchor-based deletion sync.
	 */
	const { tabs, menuItems, tabPanelClientId, tabsMenuClientId } = useSelect(
		( select ) => {
			const { getBlocks } = select( blockEditorStore );
			const innerBlocks = getBlocks( clientId );

			// Find tab-panel block and extract tab data.
			const tabPanel = innerBlocks.find(
				( block ) => block.name === 'core/tab-panel'
			);

			// Find tabs-menu block and get its children with their anchors.
			const tabsMenu = innerBlocks.find(
				( block ) => block.name === 'core/tabs-menu'
			);

			return {
				tabs: tabPanel
					? tabPanel.innerBlocks.filter(
							( block ) => block.name === 'core/tab'
					  )
					: [],
				menuItems: tabsMenu
					? getBlocks( tabsMenu.clientId )
							.filter( ( b ) => b.name === 'core/tabs-menu-item' )
							.map( ( b ) => ( {
								clientId: b.clientId,
								anchor: b.attributes.anchor ?? '',
							} ) )
					: [],
				tabPanelClientId: tabPanel?.clientId ?? null,
				tabsMenuClientId: tabsMenu?.clientId ?? null,
			};
		},
		[ clientId ]
	);

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
	 */
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

		const tabsRemoved = currentTabs.length < prevTabs.length;
		const menuItemsRemoved = menuItems.length < prevMenuItems.length;
		const tabsInserted = currentTabs.length > prevTabs.length;
		const menuItemsInserted = menuItems.length > prevMenuItems.length;

		// Update snapshot to the current state.
		prevSyncStateRef.current = {
			tabs: currentTabs,
			menuItems: [ ...menuItems ],
		};

		// Lists are already in sync.
		if (
			( tabsRemoved && menuItemsRemoved ) ||
			( tabsInserted && menuItemsInserted )
		) {
			return;
		}

		// Nothing changed.
		if (
			! tabsRemoved &&
			! menuItemsRemoved &&
			! tabsInserted &&
			! menuItemsInserted
		) {
			return;
		}

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
			if ( ! tabsMenuClientId ) {
				return;
			}
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
			// A menu item was pasted or duplicated: insert a matching tab.
			// If the menu item's anchor conflicts with an existing tab, generate
			// a fresh unique anchor.
			if ( ! tabPanelClientId ) {
				return;
			}
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

	/**
	 * Memoize context value to prevent unnecessary re-renders.
	 */
	const contextValue = useMemo( () => {
		/**
		 * Compute tabs list from innerblocks to provide via context.
		 * This traverses the tab-panel block to find all tab blocks
		 * and extracts their label and anchor for the tabs-menu to consume.
		 */
		const tabList = tabs.map( ( tab, index ) => ( {
			id: tab.attributes.anchor || `tab-${ index }`,
			label: tab.attributes.label || '',
			clientId: tab.clientId,
			index,
		} ) );

		return {
			'core/tabs-list': tabList,
			'core/tabs-id': anchor,
			'core/tabs-activeTabIndex': activeTabIndex,
			'core/tabs-editorActiveTabIndex': editorActiveTabIndex,
		};
	}, [ tabs, anchor, activeTabIndex, editorActiveTabIndex ] );

	/**
	 * Block props for the tabs container.
	 */
	const blockProps = useBlockProps( {
		className: layoutClassNames,
	} );

	/**
	 * Innerblocks props for the tabs container.
	 */
	const innerBlockProps = useInnerBlocksProps( blockProps, {
		__experimentalCaptureToolbars: true,
		template: TABS_TEMPLATE,
		templateLock: false,
		renderAppender: false,
	} );

	return (
		<BlockContextProvider value={ contextValue }>
			<div { ...innerBlockProps }>
				<Controls
					clientId={ clientId }
					attributes={ attributes }
					setAttributes={ setAttributes }
				/>
				{ innerBlockProps.children }
			</div>
		</BlockContextProvider>
	);
}

export default Edit;
