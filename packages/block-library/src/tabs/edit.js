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
	 * Also select the menu item clientIds for deletion sync.
	 */
	const { tabs, menuItemClientIds } = useSelect(
		( select ) => {
			const { getBlocks, getBlockOrder } = select( blockEditorStore );
			const innerBlocks = getBlocks( clientId );

			// Find tab-panel block and extract tab data.
			const tabPanel = innerBlocks.find(
				( block ) => block.name === 'core/tab-panel'
			);

			// Find tabs-menu block to get its children's clientIds.
			const tabsMenu = innerBlocks.find(
				( block ) => block.name === 'core/tabs-menu'
			);

			return {
				tabs: tabPanel
					? tabPanel.innerBlocks.filter(
							( block ) => block.name === 'core/tab'
					  )
					: [],
				menuItemClientIds: tabsMenu
					? getBlockOrder( tabsMenu.clientId )
					: [],
			};
		},
		[ clientId ]
	);

	/**
	 * Keep tabs and menu items in sync when either is deleted directly (e.g.
	 * via the Backspace key or List View).
	 */
	const prevSyncStateRef = useRef( null );
	useEffect( () => {
		const currentTabIds = tabs.map( ( tab ) => tab.clientId );

		if ( prevSyncStateRef.current === null ) {
			prevSyncStateRef.current = {
				tabIds: currentTabIds,
				menuItemIds: [ ...menuItemClientIds ],
			};
			return;
		}

		const { tabIds: prevTabIds, menuItemIds: prevMenuIds } =
			prevSyncStateRef.current;

		const tabsRemoved = currentTabIds.length < prevTabIds.length;
		const menuItemsRemoved = menuItemClientIds.length < prevMenuIds.length;

		// Update snapshot to the current state.
		prevSyncStateRef.current = {
			tabIds: currentTabIds,
			menuItemIds: [ ...menuItemClientIds ],
		};

		// Lists are in sync, nothing changed, or toolbar already removed both.
		if (
			( ! tabsRemoved && ! menuItemsRemoved ) ||
			( tabsRemoved && menuItemsRemoved )
		) {
			return;
		}

		if ( tabsRemoved ) {
			// A tab was removed without its menu item. Find which one and remove it.
			prevTabIds.forEach( ( id, index ) => {
				if (
					! currentTabIds.includes( id ) &&
					menuItemClientIds[ index ]
				) {
					const menuItemId = menuItemClientIds[ index ];
					removeBlock( menuItemId, false );
					prevSyncStateRef.current.menuItemIds =
						prevSyncStateRef.current.menuItemIds.filter(
							( mId ) => mId !== menuItemId
						);
				}
			} );
		} else {
			// A menu item was removed without its tab. Find which one and remove it.
			prevMenuIds.forEach( ( id, index ) => {
				if ( ! menuItemClientIds.includes( id ) && tabs[ index ] ) {
					const tabClientId = tabs[ index ].clientId;
					removeBlock( tabClientId, false );
					prevSyncStateRef.current.tabIds =
						prevSyncStateRef.current.tabIds.filter(
							( tId ) => tId !== tabClientId
						);
				}
			} );
		}
	}, [ tabs, menuItemClientIds, removeBlock ] );

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
