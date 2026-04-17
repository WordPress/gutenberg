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
 * Inserts a new core/tab-panel into the tab-panels and a new core/tab
 * into the tab-list, keeping both in sync.
 *
 * @param {Object} props
 * @param {string} props.tabsClientId The client ID of the parent tabs block.
 * @return {React.JSX.Element} The toolbar control element.
 */
export default function AddTabToolbarControl( { tabsClientId } ) {
	const { insertBlock } = useDispatch( blockEditorStore );

	const { tabPanelClientId, tabsMenuClientId } = useSelect(
		( select ) => {
			if ( ! tabsClientId ) {
				return {
					tabPanelClientId: null,
					tabsMenuClientId: null,
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
				tabPanelClientId: tabPanels?.clientId || null,
				tabsMenuClientId: tabList?.clientId || null,
			};
		},
		[ tabsClientId ]
	);

	const addTab = () => {
		if ( ! tabPanelClientId ) {
			return;
		}

		const newTabBlock = createBlock( 'core/tab-panel', {
			label: __( 'Tab' ),
		} );
		insertBlock( newTabBlock, undefined, tabPanelClientId );

		// Insert a corresponding menu item into the tab-list.
		if ( tabsMenuClientId ) {
			const newMenuItemBlock = createBlock( 'core/tab', {} );
			insertBlock( newMenuItemBlock, undefined, tabsMenuClientId );
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
