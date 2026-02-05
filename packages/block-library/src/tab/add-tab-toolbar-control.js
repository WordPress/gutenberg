/**
 * WordPress dependencies
 */
import { sprintf, __ } from '@wordpress/i18n';
import { createBlock } from '@wordpress/blocks';
import {
	BlockControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { ToolbarGroup, ToolbarButton } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * "Add tab" button in the block toolbar for the tab block.
 * Inserts new tabs into the tab-panel block.
 *
 * @param {Object} props
 * @param {string} props.tabsClientId The client ID of the parent tabs block.
 * @return {JSX.Element} The toolbar control element.
 */
export default function AddTabToolbarControl( { tabsClientId } ) {
	const { insertBlock } = useDispatch( blockEditorStore );

	// Find the tab-panel block within the tabs block
	const { tabPanelClientId, nextTabIndex } = useSelect(
		( select ) => {
			if ( ! tabsClientId ) {
				return {
					tabPanelClientId: null,
					nextTabIndex: 0,
				};
			}
			const { getBlocks } = select( blockEditorStore );
			const innerBlocks = getBlocks( tabsClientId );
			const tabPanel = innerBlocks.find(
				( block ) => block.name === 'core/tab-panel'
			);
			return {
				tabPanelClientId: tabPanel?.clientId || null,
				nextTabIndex: ( tabPanel?.innerBlocks.length || 0 ) + 1,
			};
		},
		[ tabsClientId ]
	);

	const addTab = () => {
		if ( ! tabPanelClientId ) {
			return;
		}
		const newTabBlock = createBlock( 'core/tab', {
			anchor: 'tab-' + nextTabIndex,
			/* translators: %d: tab number */
			label: sprintf( __( 'Tab %d' ), nextTabIndex ),
		} );
		insertBlock( newTabBlock, undefined, tabPanelClientId );
		// @TODO: Possible select and focus the tabs-menu-item active tab RichText editor?
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
