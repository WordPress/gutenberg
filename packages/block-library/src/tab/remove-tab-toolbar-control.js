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
 * "Remove Tab" button in the block toolbar for the tab block.
 * Removes the currently active tab from the tab-panel block.
 *
 * @param {Object} props
 * @param {string} props.tabsClientId The client ID of the parent tabs block.
 * @return {JSX.Element} The toolbar control element.
 */
export default function RemoveTabToolbarControl( { tabsClientId } ) {
	const {
		removeBlock,
		updateBlockAttributes,
		selectBlock,
		__unstableMarkNextChangeAsNotPersistent,
	} = useDispatch( blockEditorStore );

	// Find the tab-panel block, active tab, and tab count within the tabs block
	const { activeTabClientId, tabCount, editorActiveTabIndex } = useSelect(
		( select ) => {
			if ( ! tabsClientId ) {
				return {
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
			const tabPanel = innerBlocks.find(
				( block ) => block.name === 'core/tab-panel'
			);
			const tabs = tabPanel?.innerBlocks || [];
			const activeTab = tabs[ activeIndex ];
			return {
				activeTabClientId: activeTab?.clientId || null,
				tabCount: tabs.length,
				editorActiveTabIndex: activeIndex,
			};
		},
		[ tabsClientId ]
	);

	const removeTab = () => {
		if ( ! activeTabClientId || tabCount <= 1 ) {
			return;
		}

		// Calculate new active index after removal
		const newActiveIndex =
			editorActiveTabIndex >= tabCount - 1
				? tabCount - 2 // If removing last tab, select the previous one
				: editorActiveTabIndex; // Otherwise keep the same index (next tab shifts into position)

		// Update the active tab index before removing
		__unstableMarkNextChangeAsNotPersistent();
		updateBlockAttributes( tabsClientId, {
			editorActiveTabIndex: newActiveIndex,
		} );

		// Remove the tab
		removeBlock( activeTabClientId, false );

		// Select the tabs block after removal
		if ( tabsClientId ) {
			selectBlock( tabsClientId );
		}
	};

	// Don't show the button if there's only one tab or no active tab
	const isDisabled = tabCount <= 1 || ! activeTabClientId;

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
