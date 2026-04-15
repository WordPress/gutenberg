/**
 * WordPress dependencies
 */
import {
	useBlockProps,
	useInnerBlocksProps,
	BlockContextProvider,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useSelect, useDispatch } from '@wordpress/data';
import { useMemo, useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Controls from './controls';

const EMPTY_ARRAY = [];

const TABS_TEMPLATE = [
	[
		'core/tabs-menu',
		{
			lock: {
				remove: true,
			},
		},
		[
			[ 'core/tabs-menu-item', {} ],
			[ 'core/tabs-menu-item', {} ],
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
					label: __( 'Tab' ),
				},
				[ [ 'core/paragraph' ] ],
			],
			[
				'core/tab',
				{
					label: __( 'Tab' ),
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

	const { removeBlock, replaceInnerBlocks } = useDispatch( blockEditorStore );

	const { tabs, tabPanelClientId, menuItems } = useSelect(
		( select ) => {
			const { getBlocks } = select( blockEditorStore );
			const innerBlocks = getBlocks( clientId );

			const tabPanel = innerBlocks.find(
				( block ) => block.name === 'core/tab-panel'
			);
			const tabsMenu = innerBlocks.find(
				( block ) => block.name === 'core/tabs-menu'
			);

			return {
				tabs: tabPanel?.innerBlocks ?? EMPTY_ARRAY,
				tabPanelClientId: tabPanel?.clientId ?? null,
				menuItems: tabsMenu?.innerBlocks ?? EMPTY_ARRAY,
			};
		},
		[ clientId ]
	);

	/**
	 * Keep tabs and menu items in sync when either is deleted directly (e.g.
	 * via the Backspace key or List View).
	 *
	 * TODO: This effect only handles deletions. The two lists can get out of
	 * sync in other cases: if a user pastes a core/tab block into the tab-panel
	 * (or duplicates one), no corresponding tabs-menu-item is created; if a
	 * user drags and drops a tabs-menu-item, the tab panel is not copied with
	 * it. We should extend this effect to handle insertions, detecting when
	 * tabs.length > menuItems.length and inserting the missing menu
	 * item(s) at the correct index.
	 */
	const prevSyncStateRef = useRef( null );
	useEffect( () => {
		const currentTabs = tabs.map( ( tab ) => ( {
			clientId: tab.clientId,
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
		const menuItemsReordered =
			! tabsRemoved &&
			! menuItemsRemoved &&
			menuItems.length === prevMenuItems.length &&
			menuItems.some(
				( m, i ) => m.clientId !== prevMenuItems[ i ]?.clientId
			);

		// Update snapshot to the current state.
		// Snapshot is updated eagerly; post-removal mutations keep it consistent
		// so the next effect invocation sees a stable baseline.
		prevSyncStateRef.current = {
			tabs: currentTabs,
			menuItems: [ ...menuItems ],
		};

		// When menu items are reordered, move the corresponding tab content
		// blocks to match the new order.
		if ( menuItemsReordered && tabPanelClientId ) {
			const reorderedTabs = menuItems
				.map( ( menuItem ) => {
					const oldIndex = prevMenuItems.findIndex(
						( pm ) => pm.clientId === menuItem.clientId
					);
					return oldIndex !== -1 ? tabs[ oldIndex ] : null;
				} )
				.filter( Boolean );
			if ( reorderedTabs.length === tabs.length ) {
				replaceInnerBlocks( tabPanelClientId, reorderedTabs, false );
			}
			return;
		}

		// Lists are in sync, nothing changed, or toolbar already removed both.
		if (
			( ! tabsRemoved && ! menuItemsRemoved ) ||
			( tabsRemoved && menuItemsRemoved )
		) {
			return;
		}

		const currentTabIds = new Set( currentTabs.map( ( t ) => t.clientId ) );
		const currentMenuItemIds = new Set(
			menuItems.map( ( m ) => m.clientId )
		);

		if ( tabsRemoved ) {
			// Remove the menu item at the same position.
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
		} else {
			// Remove the tab at the same position.
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
		}
	}, [ tabs, tabPanelClientId, menuItems, removeBlock, replaceInnerBlocks ] );

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
