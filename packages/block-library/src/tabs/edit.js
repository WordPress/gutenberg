/**
 * WordPress dependencies
 */
import {
	useBlockProps,
	useInnerBlocksProps,
	BlockContextProvider,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { useMemo, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Controls from './controls';
import useTabMenuSync from './use-tab-menu-sync';

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
					label: 'Tab 1',
				},
				[ [ 'core/paragraph' ] ],
			],
			[
				'core/tab',
				{
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

	const { removeBlock, replaceInnerBlocks } = useDispatch( blockEditorStore );

	/**
	 * Construct a list of core/tab blocks, used to create tabs-list context.
	 * Also select menu items with their anchors for anchor-based deletion sync.
	 */
	const { tabs, tabPanelClientId, menuItems, tabsMenuClientId } = useSelect(
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
				tabs: tabPanel
					? tabPanel.innerBlocks.filter(
							( block ) => block.name === 'core/tab'
					  )
					: EMPTY_ARRAY,
				tabPanelClientId: tabPanel?.clientId ?? null,
				menuItems: tabsMenu
					? getBlocks( tabsMenu.clientId )
							.filter( ( b ) => b.name === 'core/tabs-menu-item' )
							.map( ( b ) => ( {
								clientId: b.clientId,
								anchor: b.attributes.anchor ?? '',
							} ) )
					: EMPTY_ARRAY,
			};
		},
		[ clientId ]
	);

	useTabMenuSync( { tabs, menuItems, tabPanelClientId, tabsMenuClientId } );

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
