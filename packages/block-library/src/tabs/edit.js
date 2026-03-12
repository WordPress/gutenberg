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

	const { removeBlock } = useDispatch( blockEditorStore );

	/**
	 * Construct a list of core/tab blocks, used to create tabs-list context.
	 * Also select menu items with their anchors for anchor-based deletion sync.
	 */
	const { tabs, menuItems } = useSelect(
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

		// Update snapshot to the current state.
		// Snapshot is updated eagerly; post-removal mutations keep it consistent
		// so the next effect invocation sees a stable baseline.
		prevSyncStateRef.current = {
			tabs: currentTabs,
			menuItems: [ ...menuItems ],
		};

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
		} else {
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
		}
	}, [ tabs, menuItems, removeBlock ] );

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
