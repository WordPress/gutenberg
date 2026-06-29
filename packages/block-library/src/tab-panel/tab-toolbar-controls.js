/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { createBlock } from '@wordpress/blocks';
import {
	BlockControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { ToolbarGroup, ToolbarButton } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * "Add tab" and "Remove tab" buttons in the block toolbar for the tabs block.
 * Inserts or removes a core/tab-panel. The tab-list items attribute is kept
 * in sync automatically via useTabListItemsSync.
 *
 * @param {Object} props
 * @param {string} props.tabsClientId The client ID of the parent tabs block.
 * @return {React.JSX.Element} The toolbar control element.
 */
export default function TabToolbarControls( { tabsClientId } ) {
	const {
		insertBlock,
		removeBlock,
		updateBlockAttributes,
		__unstableMarkNextChangeAsNotPersistent,
	} = useDispatch( blockEditorStore );

	const {
		tabPanelsClientId,
		activeTabPanelClientId,
		tabCount,
		editorActiveTabIndex,
	} = useSelect(
		( select ) => {
			if ( ! tabsClientId ) {
				return {
					tabPanelsClientId: null,
					activeTabPanelClientId: null,
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
			const tabPanelBlocks = tabPanels?.innerBlocks || [];
			const activeTabPanel = tabPanelBlocks[ activeIndex ];

			return {
				tabPanelsClientId: tabPanels?.clientId || null,
				activeTabPanelClientId: activeTabPanel?.clientId || null,
				tabCount: tabPanelBlocks.length,
				editorActiveTabIndex: activeIndex,
			};
		},
		[ tabsClientId ]
	);

	const addTab = () => {
		if ( ! tabPanelsClientId ) {
			return;
		}

		insertBlock(
			createBlock( 'core/tab-panel', {
				label: __( 'Tab' ),
			} ),
			undefined,
			tabPanelsClientId,
			false
		);

		// Switch editor active tab to the new tab.
		const newIndex = tabCount;
		__unstableMarkNextChangeAsNotPersistent();
		updateBlockAttributes( tabsClientId, {
			editorActiveTabIndex: newIndex,
		} );
	};

	const removeTab = () => {
		if ( ! activeTabPanelClientId || tabCount <= 1 ) {
			return;
		}

		// Calculate new active index after removal.
		const newActiveIndex =
			editorActiveTabIndex >= tabCount - 1
				? tabCount - 2
				: editorActiveTabIndex;

		// Switch editor to next active tab and remove the current one.
		__unstableMarkNextChangeAsNotPersistent();
		updateBlockAttributes( tabsClientId, {
			editorActiveTabIndex: newActiveIndex,
		} );
		removeBlock( activeTabPanelClientId, false );
	};

	const isRemoveDisabled = tabCount <= 1 || ! activeTabPanelClientId;

	return (
		<BlockControls group="other">
			<ToolbarGroup>
				<ToolbarButton
					className="components-toolbar__control"
					onClick={ addTab }
					text={ __( 'Add tab' ) }
				/>
				<ToolbarButton
					className="components-toolbar__control"
					onClick={ removeTab }
					text={ __( 'Remove tab' ) }
					disabled={ isRemoveDisabled }
				/>
			</ToolbarGroup>
		</BlockControls>
	);
}
