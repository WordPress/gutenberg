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
 * "Add tab" button in the block toolbar for the tabs block.
 * Inserts a new core/tab-panel into the tab-panels. The tab-list items
 * attribute is kept in sync automatically via useTabListItemsSync.
 *
 * @param {Object} props
 * @param {string} props.tabsClientId The client ID of the parent tabs block.
 * @return {React.JSX.Element} The toolbar control element.
 */
export default function AddTabToolbarControl( { tabsClientId } ) {
	const {
		insertBlock,
		updateBlockAttributes,
		selectBlock,
		__unstableMarkNextChangeAsNotPersistent,
	} = useDispatch( blockEditorStore );

	const { tabPanelsClientId, tabCount, tabListClientId } = useSelect(
		( select ) => {
			if ( ! tabsClientId ) {
				return {
					tabPanelsClientId: null,
					tabCount: 0,
					tabListClientId: null,
				};
			}
			const { getBlocks } = select( blockEditorStore );
			const innerBlocks = getBlocks( tabsClientId );
			const tabPanels = innerBlocks.find(
				( block ) => block.name === 'core/tab-panels'
			);
			const tabList = innerBlocks.find(
				( block ) => block.name === 'core/tab-list'
			);
			return {
				tabPanelsClientId: tabPanels?.clientId || null,
				tabCount: tabPanels?.innerBlocks?.length || 0,
				tabListClientId: tabList?.clientId || null,
			};
		},
		[ tabsClientId ]
	);

	const addTab = () => {
		if ( ! tabPanelsClientId ) {
			return;
		}

		const newTabPanelBlock = createBlock( 'core/tab-panel', {
			label: __( 'Tab' ),
		} );
		insertBlock( newTabPanelBlock, undefined, tabPanelsClientId, false );

		// Switch editor active tab to the new tab.
		const newIndex = tabCount;
		__unstableMarkNextChangeAsNotPersistent();
		updateBlockAttributes( tabsClientId, {
			editorActiveTabIndex: newIndex,
		} );

		// Select the tab-list block so focus stays in the menu area.
		if ( tabListClientId ) {
			selectBlock( tabListClientId );
		}
	};

	return (
		<BlockControls group="other">
			<ToolbarGroup>
				<ToolbarButton
					className="components-toolbar__control"
					onClick={ addTab }
					text={ __( 'Add tab' ) }
				/>
			</ToolbarGroup>
		</BlockControls>
	);
}
