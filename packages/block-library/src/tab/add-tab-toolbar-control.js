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
 * "Add tab" button in the block toolbar for the tab block.
 * Inserts a new core/tab into the tab-panel and a new core/tabs-menu-item
 * into the tabs-menu, keeping both in sync.
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
			const tabPanel = innerBlocks.find(
				( block ) => block.name === 'core/tab-panel'
			);
			const tabsMenu = innerBlocks.find(
				( block ) => block.name === 'core/tabs-menu'
			);
			return {
				tabPanelClientId: tabPanel?.clientId || null,
				tabsMenuClientId: tabsMenu?.clientId || null,
			};
		},
		[ tabsClientId ]
	);

	const addTab = () => {
		if ( ! tabPanelClientId ) {
			return;
		}

		const newTabBlock = createBlock( 'core/tab', {
			label: __( 'Tab' ),
		} );
		insertBlock( newTabBlock, undefined, tabPanelClientId );

		// Insert a corresponding menu item into the tabs-menu.
		if ( tabsMenuClientId ) {
			const newMenuItemBlock = createBlock( 'core/tabs-menu-item', {} );
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
