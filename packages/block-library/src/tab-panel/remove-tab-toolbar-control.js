/**
 * WordPress dependencies
 */
import {
	BlockControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { ToolbarGroup, ToolbarButton } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * "Remove Tab" button in the block toolbar for the tabs block.
 * Removes the currently active core/tab-panel and its corresponding
 * core/tab, keeping both in sync.
 *
 * @param {Object} props
 * @param {string} props.tabsClientId The client ID of the parent tabs block.
 * @return {React.JSX.Element} The toolbar control element.
 */
export default function RemoveTabToolbarControl( { tabsClientId } ) {
	const {
		removeBlock,
		updateBlockAttributes,
		selectBlock,
		__unstableMarkNextChangeAsNotPersistent,
	} = useDispatch( blockEditorStore );

	const {
		activeTabPanelClientId,
		activeTabClientId,
		tabCount,
		editorActiveTabIndex,
	} = useSelect(
		( select ) => {
			if ( ! tabsClientId ) {
				return {
					activeTabPanelClientId: null,
					activeTabClientId: null,
					tabCount: 0,
					editorActiveTabIndex: 0,
				};
			}
			const { getBlocks, getBlockAttributes } =
				select( blockEditorStore );
			const tabsAttributes = getBlockAttributes( tabsClientId );
			const activeIndex =
				tabsAttributes?.editorActiveTabIndex ??
				tabsAttributes?.activeTabIndex ??
				0;
			const innerBlocks = getBlocks( tabsClientId );
			const tabPanels = innerBlocks.find(
				( block ) => block.name === 'core/tab-panels'
			);
			const tabList = innerBlocks.find(
				( block ) => block.name === 'core/tab-list'
			);
			const tabPanelBlocks = tabPanels?.innerBlocks || [];
			const tabs = tabList?.innerBlocks || [];
			const activeTabPanel = tabPanelBlocks[ activeIndex ];
			const activeTab = tabs[ activeIndex ];

			return {
				activeTabPanelClientId: activeTabPanel?.clientId || null,
				activeTabClientId: activeTab?.clientId || null,
				tabCount: tabs.length,
				editorActiveTabIndex: activeIndex,
			};
		},
		[ tabsClientId ]
	);

	const removeTab = () => {
		if ( ! activeTabPanelClientId || tabCount <= 1 ) {
			return;
		}

		// Calculate new active index after removal.
		const newActiveIndex =
			editorActiveTabIndex >= tabCount - 1
				? tabCount - 2
				: editorActiveTabIndex;

		__unstableMarkNextChangeAsNotPersistent();
		updateBlockAttributes( tabsClientId, {
			editorActiveTabIndex: newActiveIndex,
		} );

		// Remove the tab panel and corresponding tab
		removeBlock( activeTabPanelClientId, false );
		if ( activeTabClientId ) {
			removeBlock( activeTabClientId, false );
		}

		if ( tabsClientId ) {
			selectBlock( tabsClientId );
		}
	};

	const isDisabled = tabCount <= 1 || ! activeTabPanelClientId;

	return (
		<BlockControls group="other">
			<ToolbarGroup>
				<ToolbarButton
					className="components-toolbar__control"
					onClick={ removeTab }
					text={ __( 'Remove tab' ) }
					disabled={ isDisabled }
				/>
			</ToolbarGroup>
		</BlockControls>
	);
}
