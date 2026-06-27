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
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import TabToolbarControls from '../tab-panel/tab-toolbar-controls';
import useTabListItemsSync from './use-tab-list-items-sync';

const EMPTY_ARRAY = [];

/**
 * Only the two structural child blocks are specified here — without inner
 * block entries for core/tab-list or core/tab-panels.
 *
 * If inner blocks were included in this template, `synchronizeBlocksWithTemplate`
 * (called whenever templateLock === 'all') would recurse into the containers and
 * truncate them to the template count, causing data loss when a saved block with
 * more than two tabs is re-opened in the editor.
 *
 * Initial tab/panel creation is delegated to the tab-panels template in
 * tab-panels/edit.js (templateLock: false, applied only when empty).
 */
const TABS_TEMPLATE = [ [ 'core/tab-list' ], [ 'core/tab-panels' ] ];

function Edit( { clientId, attributes } ) {
	const { anchor, activeTabIndex, editorActiveTabIndex } = attributes;

	const { tabPanels, tabListClientId } = useSelect(
		( select ) => {
			const { getBlocks } = select( blockEditorStore );
			const innerBlocks = getBlocks( clientId );

			const tabPanelsBlock = innerBlocks.find(
				( block ) => block.name === 'core/tab-panels'
			);
			const tabList = innerBlocks.find(
				( block ) => block.name === 'core/tab-list'
			);

			return {
				tabPanels: tabPanelsBlock?.innerBlocks ?? EMPTY_ARRAY,
				tabListClientId: tabList?.clientId ?? null,
			};
		},
		[ clientId ]
	);

	useTabListItemsSync( { tabPanels, tabListClientId } );

	/**
	 * Memoize context value to prevent unnecessary re-renders.
	 */
	const contextValue = useMemo( () => {
		/**
		 * Compute tabs list from innerblocks to provide via context.
		 * This traverses the tab-panels block to find all tab-panel blocks
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
				<TabToolbarControls tabsClientId={ clientId } />
				{ innerBlockProps.children }
			</div>
		</BlockContextProvider>
	);
}

export default Edit;
