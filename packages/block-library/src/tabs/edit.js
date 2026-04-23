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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Controls from './controls';
import useTabListSync from './use-tab-list-sync';

const EMPTY_ARRAY = [];

const TABS_TEMPLATE = [
	[
		'core/tab-list',
		{},
		[
			[ 'core/tab', {} ],
			[ 'core/tab', {} ],
		],
	],
	[
		'core/tab-panels',
		{},
		[
			[
				'core/tab-panel',
				{
					label: __( 'Tab' ),
				},
				[ [ 'core/paragraph' ] ],
			],
			[
				'core/tab-panel',
				{
					label: __( 'Tab' ),
				},
				[ [ 'core/paragraph' ] ],
			],
		],
	],
];

function Edit( { clientId, attributes, setAttributes } ) {
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

	const { tabPanels, tabPanelsClientId, tabs, tabListClientId } = useSelect(
		( select ) => {
			const { getBlocks } = select( blockEditorStore );
			const innerBlocks = getBlocks( clientId );

			const tabPanelBlocks = innerBlocks.find(
				( block ) => block.name === 'core/tab-panels'
			);
			const tabList = innerBlocks.find(
				( block ) => block.name === 'core/tab-list'
			);

			return {
				tabPanels: tabPanelBlocks?.innerBlocks ?? EMPTY_ARRAY,
				tabPanelsClientId: tabPanelBlocks?.clientId ?? null,
				tabs: tabList?.innerBlocks ?? EMPTY_ARRAY,
				tabListClientId: tabList?.clientId ?? null,
			};
		},
		[ clientId ]
	);

	useTabListSync( {
		tabPanels,
		tabs,
		tabPanelsClientId,
		tabListClientId,
	} );

	/**
	 * Memoize context value to prevent unnecessary re-renders.
	 */
	const contextValue = useMemo( () => {
		/**
		 * Compute tabs list from innerblocks to provide via context.
		 * This traverses the tab-panel block to find all tab blocks
		 * and extracts their label and anchor for the tab-list to consume.
		 */
		const tabList = tabPanels.map( ( tab, index ) => ( {
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
	}, [ tabPanels, anchor, activeTabIndex, editorActiveTabIndex ] );

	const blockProps = useBlockProps();

	const innerBlockProps = useInnerBlocksProps( blockProps, {
		__experimentalCaptureToolbars: true,
		template: TABS_TEMPLATE,
		templateLock: 'all',
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
